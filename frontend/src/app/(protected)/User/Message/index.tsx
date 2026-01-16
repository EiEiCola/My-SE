// \frontend\src\app\(protected)\User\Message\page.tsx

import React, { useState, useEffect, useRef } from 'react';
import { App } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
   Send, Search, MessageCircle, MoreVertical, Paperclip, Smile, Image as ImageIcon,
   Trash2, LogOut, Eraser, UserPlus, ShieldBan, X, Check, Users, User, Settings, Crown, Edit2, Sticker, Info,
   Download, FileText, StickyNote, UserMinus
} from 'lucide-react';
import type { Room, Message, WSMessage, User as ChatUser, MemberReward } from '../../../../interfaces/chat';
import { chatService } from '../../../../services/http/chat';
import { friendAPI, getImageUrl } from '../../../../services/http/friend';

// Helper: Extract ID from Token
const getUserIdFromToken = (token: string): number => {
   if (!token) return 0;
   try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Number(payload.user_id || payload.userId || payload.id || 0);
   } catch (e) { return 0; }
};

// Mock Data
const EMOJIS = ['😀', '😂', '😍', '🥰', '😘', '😊', '😎', '🤗', '🤔', '😴', '😭', '😡', '🤯', '🥳', '😇', '🤩', '👍', '👏', '🙏', '💪', '❤️', '💔', '🔥', '✨', '🎉', '🎂', '🎁', '🌟', '⭐', '💯'];
const STICKERS = [
   { id: 1, emoji: '🐱', name: 'Cat' }, { id: 2, emoji: '🐶', name: 'Dog' },
   { id: 3, emoji: '🐻', name: 'Bear' }, { id: 4, emoji: '🐰', name: 'Rabbit' },
   { id: 5, emoji: '🦊', name: 'Fox' }, { id: 6, emoji: '🐼', name: 'Panda' },
   { id: 7, emoji: '🐯', name: 'Tiger' }, { id: 8, emoji: '🦁', name: 'Lion' },
];

const ChatPage: React.FC = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { message, modal } = App.useApp();

   // --- Data State ---
   const [rooms, setRooms] = useState<Room[]>([]);
   const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

   // --- UI State ---
   const [inputText, setInputText] = useState('');
   const [showMenu, setShowMenu] = useState(false);
   const [headerImgError, setHeaderImgError] = useState(false); // ✅ Fix: Add state here

   // Reset Image Error when room changes
   useEffect(() => { setHeaderImgError(false); }, [currentRoom?.room_id]);

   // --- Pickers State ---
   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
   const [showStickerPicker, setShowStickerPicker] = useState(false);
   const [myStickers, setMyStickers] = useState<MemberReward[]>([]);

   useEffect(() => {
      chatService.getMyStickers().then(res => setMyStickers(res.data || []));
   }, []);

   // --- Upload State ---
   const [showImagePreview, setShowImagePreview] = useState(false);
   const [uploadedImages, setUploadedImages] = useState<{ id: number, file: File, preview: string }[]>([]);
   const [showFilePreview, setShowFilePreview] = useState(false);
   const [uploadedFiles, setUploadedFiles] = useState<{ id: number, file: File, name: string, size: string }[]>([]);

   // --- Modals State ---
   const [showSearchModal, setShowSearchModal] = useState(false);
   const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
   const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
   const [showInviteModal, setShowInviteModal] = useState(false);
   const [showUnblockModal, setShowUnblockModal] = useState(false);

   // --- Search/Group Data ---
   const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
   const [blockedUsers, setBlockedUsers] = useState<Set<number>>(new Set()); // Users we blocked
   const [blockedByUsers, setBlockedByUsers] = useState<Set<number>>(new Set()); // Users who blocked us
   const [selectedBlockedUser, setSelectedBlockedUser] = useState<ChatUser | null>(null);
   const [searchUserQuery, setSearchUserQuery] = useState('');
   const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([]);
   const [searchRoomQuery, setSearchRoomQuery] = useState('');

   // --- Group Form ---
   const [groupName, setGroupName] = useState('');
   const [groupImage, setGroupImage] = useState<string | null>(null);
   const [groupImageFile, setGroupImageFile] = useState<File | null>(null); // ✅ For Upload
   const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

   // --- Edit Group Mode ---
   const [isEditingGroup, setIsEditingGroup] = useState(false);
   const [editGroupName, setEditGroupName] = useState('');

   // --- Image Preview Modal State (Lightbox) ---
   const [showImageModal, setShowImageModal] = useState(false);
   const [selectedImage, setSelectedImage] = useState<string | null>(null);

   // --- Config & Refs ---
   const ws = useRef<WebSocket | null>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const activeRoomIdRef = useRef<number | null>(null);
   const roomsRef = useRef<Room[]>([]); // ✅ Added roomsRef
   // Determine WebSocket protocol and host dynamically
   const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
   const host = window.location.host; // includes port (e.g. localhost:5173 or 20.2.232.189:80)
   // If running on localhost:5173 (dev), we might still want localhost:8080 if not proxied, 
   // but for production (Nginx), window.location.host is correct.
   // Fallback for local dev without proxy:
   const isDev = host.includes("localhost:5173");
   const WS_URL = isDev
      ? "ws://localhost:8080/api/member/chat/ws"
      : `${protocol}//${host}/api/member/chat/ws`;
   const token = localStorage.getItem('token') || "";
   const [myUserID, setMyUserID] = useState<number>(() => {
      const saved = localStorage.getItem('my_member_id');
      return saved ? Number(saved) : 0;
   });

   // ✅ Derived State
   const amIAdmin = currentRoom?.member?.some(m => Number(m.member_id) === myUserID && m.rm_role === 'admin');

   // 1. Initial Load & Identity Check
   useEffect(() => {
      const initialize = async () => {
         let currentID = myUserID;

         try {
            console.log("🚀 Initializing Chat... MyUserID (State):", currentID);

            // always fetch fresh identity to confirm
            const meRes = await friendAPI.getMe();
            // 🐛 FIX: endpoint returns object directly, not wrapped in data
            const realMemberID = meRes?.ID || meRes?.id || meRes?.data?.ID || meRes?.data?.id;
            console.log("✅ Fetched Real Member ID:", realMemberID);

            if (realMemberID && realMemberID !== currentID) {
               console.log("⚠️ ID mismatch or missing. Updating to:", realMemberID);
               setMyUserID(realMemberID);
               localStorage.setItem('my_member_id', String(realMemberID));
               currentID = realMemberID;
            }
         } catch (err) {
            console.error("❌ Failed to fetch identity", err);
         }

         // Always load data, even if ID is 0 (fallback) to ensure sidebar isn't empty
         loadInitialData(currentID);
      };

      if (token) initialize();
   }, [token]);

   // ✅ Sync roomsRef
   useEffect(() => { roomsRef.current = rooms; }, [rooms]);

   // (Debug logs removed)

   const loadInitialData = async (userId: number) => {
      try {
         // 1. Load Blocked Users (Safe Mode: If fails, just continue with empty blocks)
         const blockedIds = new Set<number>();
         try {
            const blockedRes = await friendAPI.getBlockedUsers();
            const blockedData = (blockedRes as any)?.data || [];
            blockedData.forEach((b: any) => blockedIds.add(b.ID || b.id));
            setBlockedUsers(blockedIds);
         } catch (err) {
            console.warn("Failed to load blocked users, proceeding...", err);
         }

         // 2. Load Rooms
         const roomsRes = await chatService.getRooms();

         // NOW filter rooms using the blockedIds (if any)
         if (roomsRes.data) {
            const filteredRooms = roomsRes.data.filter((room: Room) => {
               if (room.rc_type === 'private') {
                  // Check if chat partner is blocked
                  const hasBlockedMember = room.member?.some(m =>
                     Number(m.member_id) !== userId && blockedIds.has(Number(m.member_id))
                  );
                  return !hasBlockedMember;
               }
               return true; // Keep all group chats
            });
            setRooms(filteredRooms);

            // ✅ Auto-select room from navigation state
            const state = location.state as { roomId?: number };
            if (state?.roomId) {
               const targetRoom = filteredRooms.find(r => r.room_id === state.roomId);
               if (targetRoom) {
                  setCurrentRoom(targetRoom);
                  // Clear state to prevent re-opening on reload (optional, but good UX)
                  window.history.replaceState({}, document.title);
               }
            }
         }
      } catch (err) {
         console.error("Load initial data failed", err);
      }
   };

   const loadRooms = async () => {
      try {
         const res = await chatService.getRooms();
         if (res.data) setRooms(res.data);
      } catch (err) { console.error("Load rooms failed", err); }
   };

   // WebSocket
   useEffect(() => {
      if (!token) return;
      ws.current = new WebSocket(`${WS_URL}?token=${token}`);
      ws.current.onopen = () => console.log("✅ WS Connected");
      ws.current.onmessage = (event) => {
         try {
            const msg: WSMessage = JSON.parse(event.data);
            if (msg.type === 'new_message') {
               const newMsg = msg.payload as Message;

               // ⭐ Optimistic Fix: Ignore own messages from WS to prevent duplicates
               // (Since we add them immediately in handleSendMessage)
               // EXCEPTION: System messages are generated by backend and we need them for updates
               if (newMsg.sender_id === myUserID && newMsg.type_message !== 'system') return;

               // If room exists locally, update it
               if (roomsRef.current.some(r => r.room_id === newMsg.room_id)) {
                  if (activeRoomIdRef.current === newMsg.room_id) {
                     setMessages(prev => [...prev, newMsg]);
                     // Mark read immediately if in room
                     chatService.markRead(newMsg.room_id).catch(console.error);
                  } else {
                     // Increment Unread Count for background room
                     setRooms(prev => prev.map(r => r.room_id === newMsg.room_id ? { ...r, unread_count: (r.unread_count || 0) + 1 } : r));
                  }
                  updateLastMessage(newMsg.room_id, newMsg.content, newMsg.sender_id, newMsg.sender?.first_name);

                  // 🔄 Real-time Update: If system message (Join/Leave), refresh room data (member count)
                  if (newMsg.type_message === 'system') {
                     chatService.getRooms().then(res => {
                        if (res.data) {
                           setRooms(res.data);
                           // If currently in that room, update currentRoom state too to show new members immediately
                           if (activeRoomIdRef.current === newMsg.room_id) {
                              const updatedRoom = res.data.find((r: Room) => r.room_id === newMsg.room_id); // Explicit type hint
                              if (updatedRoom) setCurrentRoom(updatedRoom);
                           }
                        }
                     }).catch(console.error);
                  }
               } else {
                  // Room doesn't exist locally (likely new chat from non-friend) -> Reload all rooms
                  loadRooms();
               }
            } else if (msg.type === 'room_update') { // ✅ Handle Room Update (Image/Name)
               const updatedRoom = msg.payload as Room;
               setRooms(prev => prev.map(r => r.room_id === updatedRoom.room_id ? { ...r, ...updatedRoom } : r));

               // Update current room header immediately if active
               if (activeRoomIdRef.current === updatedRoom.room_id) {
                  setCurrentRoom(prev => prev ? { ...prev, ...updatedRoom } : null);
               }
            }
         } catch (error) { console.error("WS Error:", error); }
      };
      return () => ws.current?.close();
   }, [token, myUserID]);

   // Room Selection
   useEffect(() => {
      activeRoomIdRef.current = currentRoom?.room_id || null;
      if (!currentRoom) return;
      setMessages([]);
      setShowMenu(false);
      chatService.getMessages(currentRoom.room_id).then(res => { if (res.data) setMessages(res.data); });

      setEditGroupName(currentRoom.rc_name);
      setIsEditingGroup(false);
   }, [currentRoom]);

   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

   // --- Helper Functions ---
   const getChatInfo = (room: Room) => {
      if (room.rc_type === 'private') {
         if (!room.member || room.member.length === 0) return { name: "Loading...", image: "", isOnline: false, type: 'private' };
         const partner = room.member.find((m) => Number(m.member_id) !== Number(myUserID));
         const user = (partner || room.member[0])?.member;
         if (user) {
            return {
               name: `${user.first_name} ${user.last_name}`,
               image: getImageUrl(user.member_picture || user.avatar),
               isOnline: partner ? onlineUsers.has(partner.member_id) : false,
               type: 'private'
            };
         }
         return { name: "Unknown User", image: "", isOnline: false, type: 'private' };
      }
      const memberCount = room.member?.length || 0;
      return {
         name: `${room.rc_name} (${memberCount})`,
         image: getImageUrl(room.rc_url),
         isOnline: false,
         type: 'group'
      };
   };

   const updateLastMessage = (roomId: number, text: string, senderId?: number, senderName?: string) => {
      setRooms(prev => {
         const index = prev.findIndex(r => r.room_id === roomId);
         if (index === -1) return prev;

         const updated = {
            ...prev[index],
            last_message: text,
            last_sender_id: senderId !== undefined ? senderId : prev[index].last_sender_id,
            last_sender_name: senderName !== undefined ? senderName : prev[index].last_sender_name
         };

         const newArr = [...prev];
         newArr.splice(index, 1);
         return [updated, ...newArr];
      });
   };

   // --- Actions ---
   const handleSendMessage = async (text?: string) => {
      const content = typeof text === 'string' ? text : inputText;
      if (!content.trim() || !currentRoom) return;

      // Check if blocked (for private chats)
      if (currentRoom.rc_type === 'private') {
         const partner = currentRoom.member?.find(m => Number(m.member_id) !== myUserID);
         if (partner && blockedUsers.has(partner.member_id)) {
            alert("ไม่สามารถส่งข้อความได้ เนื่องจากคุณบล็อกผู้ใช้นี้อยู่");
            return;
         }
      }

      // ⭐ Optimistic UI: Create pending message
      const tempId = Date.now();
      const optimisticMsg: Message = {
         message_id: tempId,
         room_id: currentRoom.room_id,
         sender_id: myUserID,
         content: content,
         type_message: 'text',
         sent_at: new Date().toISOString(),
         sender: {
            id: myUserID,
            username: "Me", // Placeholder, UI often uses myUserID check anyway
            avatar: ""
         }
      };

      // 1. Clear Input immediately
      if (!text) setInputText('');

      // 2. Add to messages immediately
      setMessages(prev => [...prev, optimisticMsg]);

      // 3. Update sidebar immediately
      updateLastMessage(currentRoom.room_id, content, myUserID, "Me");

      try {
         await chatService.sendMessage(currentRoom.room_id, content);
      } catch (err: any) {
         // Fail: Remove the optimistic message
         setMessages(prev => prev.filter(m => m.message_id !== tempId));

         // Check if error is due to being blocked
         if (err.response?.status === 403 || err.response?.data?.error?.includes('block')) {
            alert("ไม่สามารถส่งข้อความได้ อาจเป็นเพราะถูกบล็อกหรือบล็อกกัน");
         }
         console.error(err);
      }
   };

   // --- Group Management Handlers (Defined below) ---

   const handleLeaveRoom = () => {
      if (!currentRoom) return;
      const admins = currentRoom.member?.filter(m => m.rm_role === 'admin') || [];
      const isLastAdmin = amIAdmin && admins.length === 1 && (currentRoom.member?.length || 0) > 1;

      if (isLastAdmin) {
         message.warning("⚠️ คุณเป็น Admin เพียงคนเดียวในกลุ่ม\nกรุณาตั้งสมาชิกอื่นเป็น Admin ก่อนออกจากกลุ่ม");
         setShowGroupInfoModal(true);
         return;
      }

      modal.confirm({
         title: "ต้องการออกจากกลุ่มใช่หรือไม่?",
         centered: true,
         okText: "ตกลง",
         cancelText: "ยกเลิก",
         onOk: async () => {
            try {
               await chatService.leaveRoom(currentRoom.room_id);
               setRooms(prev => prev.filter(r => r.room_id !== currentRoom.room_id));
               setCurrentRoom(null);
               setShowGroupInfoModal(false);
               message.success("ออกจากกลุ่มเรียบร้อย");
            } catch (err: any) { message.error(err.response?.data?.error || "ไม่สามารถออกจากกลุ่มได้"); }
         }
      });
   };

   const handleBlockUser = () => {
      if (!currentRoom || currentRoom.rc_type !== 'private') return;
      const target = currentRoom.member?.find(m => m.member_id !== myUserID);
      if (!target) return;
      const info = getChatInfo(currentRoom);

      modal.confirm({
         title: `ต้องการจัดการ Block ผู้ใช้ ${info.name}?`,
         centered: true,
         okText: "ตกลง",
         cancelText: "ยกเลิก",
         zIndex: 3000,
         onOk: async () => {
            try {
               await friendAPI.blockUser(target.member_id);
               // Add to blocked users set
               setBlockedUsers(prev => {
                  const newSet = new Set(prev);
                  newSet.add(target.member_id);
                  return newSet;
               });
               // Remove the room from the list immediately
               setRooms(prev => prev.filter(r => r.room_id !== currentRoom.room_id));
               setCurrentRoom(null);
               message.success("บล็อกผู้ใช้เรียบร้อย");
            } catch (err) { console.error(err); message.error("เกิดข้อผิดพลาด"); }
         }
      });
   };

   // --- Search & Create Logic ---
   const loadAllUsers = async () => {
      try {
         // Always refresh blocked users to ensure up-to-date status
         const blockedRes = await friendAPI.getBlockedUsers();
         const blockedData = (blockedRes as any)?.data || [];

         console.log("Blocked Data from API:", blockedData); // Debug

         // Parse blocked users - the API returns objects with blocker_id and blocked_id
         const blockedIds = new Set<number>();
         const blockedByIds = new Set<number>();

         blockedData.forEach((block: any) => {
            // Only process active blocks (check if status/is_active is true)
            const isActive = block.is_active === true || block.is_active === 1 ||
               block.status === true || block.status === 1 ||
               block.is_blocked === true || block.is_blocked === 1;

            if (!isActive) return; // Skip inactive blocks

            // If I am the blocker, add to blockedIds
            if (block.blocker_id === myUserID || block.blocker_mem_id === myUserID) {
               blockedIds.add(block.blocked_id || block.blocked_mem_id || block.BlockedMember?.ID || block.BlockedMember?.id);
            }
            // If I am blocked, add to blockedByIds  
            if (block.blocked_id === myUserID || block.blocked_mem_id === myUserID) {
               blockedByIds.add(block.blocker_id || block.blocker_mem_id || block.BlockerMember?.ID || block.BlockerMember?.id);
            }
         });

         console.log("Blocked IDs (I blocked):", Array.from(blockedIds)); // Debug
         console.log("Blocked By IDs (They blocked me):", Array.from(blockedByIds)); // Debug

         setBlockedUsers(blockedIds);
         setBlockedByUsers(blockedByIds);

         // Only fetch all members once
         if (allUsers.length > 0) return;

         const membersRes = await friendAPI.getAllMembers();
         const usersData = Array.isArray(membersRes) ? membersRes : (membersRes as any)?.data;

         if (Array.isArray(usersData)) {
            // Keep ALL users (including blocked ones) so they can be found in search
            const mapped = usersData.filter((u: any) => (u.ID || u.id) !== myUserID).map((u: any) => ({
               id: u.ID || u.id, username: u.username, first_name: u.first_name, last_name: u.last_name, avatar: getImageUrl(u.member_picture || u.avatar)
            }));
            setAllUsers(mapped); setFilteredUsers(mapped);
         }
      } catch (err) { console.error(err); }
   };

   const handleCreateGroup = async () => {
      if (!groupName.trim() || selectedMembers.length === 0) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      try {
         // 1. Create Room (Backend doesn't support image in create, so we update later)
         const res = await chatService.createRoom({ type: 'group', group_name: groupName, member_ids: selectedMembers });
         if (res.data) {
            let roomData = res.data;

            // 2. Upload & Update Image if selected
            if (groupImageFile) {
               try {
                  const uploadRes = await chatService.uploadImage(groupImageFile, 'group'); // ✅ Type: group
                  if (uploadRes.url) {
                     await chatService.updateGroup(roomData.room_id, { name: groupName, avatar_url: uploadRes.url });
                     roomData.rc_url = uploadRes.url; // Update local data
                  }
               } catch (e) {
                  console.error("Upload group image failed", e);
               }
            }

            setRooms(prev => [roomData, ...prev]);
            setCurrentRoom(roomData);
            setShowCreateGroupModal(false);
            setGroupName(''); setGroupImage(null); setGroupImageFile(null); setSelectedMembers([]);
         }
      } catch (err) { alert('สร้างกลุ่มไม่สำเร็จ'); }
   };

   const handleInviteMembers = async () => {
      if (!currentRoom || selectedMembers.length === 0) return;
      try {
         await chatService.inviteMembers(currentRoom.room_id, selectedMembers);
         alert(`เชิญสมาชิกเพิ่มเรียบร้อย`);
         setShowInviteModal(false); setSelectedMembers([]);
         loadRooms(); // Reload to get updated member list (or optimistically update)
         // Optimistic update for member count display
         // Real member data needs fetch from API, simplifying by just reloading room details
         const updatedRoom = await chatService.getRooms().then(r => r.data.find(rm => rm.room_id === currentRoom.room_id));
         if (updatedRoom) setCurrentRoom(updatedRoom);

      } catch (err) { alert('เชิญไม่สำเร็จ'); }
   }

   const handleGroupImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
         const file = e.target.files[0];
         setGroupImageFile(file); // ✅ Store file state
         const reader = new FileReader();
         reader.onloadend = () => setGroupImage(reader.result as string);
         reader.readAsDataURL(file);
      }
   };

   // ✅ New Handlers for Group Management
   const handleUpdateGroupImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!currentRoom || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      try {
         const uploadRes = await chatService.uploadImage(file, 'group'); // ✅ Type: group
         // Update Group immediately
         await chatService.updateGroup(currentRoom.room_id, {
            name: currentRoom.rc_name,
            avatar_url: uploadRes.url
         });
         const newUrl = uploadRes.url;
         setCurrentRoom(prev => prev ? { ...prev, rc_url: newUrl } : null);
         setRooms(prev => prev.map(r => r.room_id === currentRoom.room_id ? { ...r, rc_url: newUrl } : r));
      } catch (err) { alert('อัปเดตรูปกลุ่มไม่สำเร็จ'); }
   };

   const handleSaveGroupInfo = async () => {
      if (!currentRoom || !editGroupName.trim()) return;
      try {
         await chatService.updateGroup(currentRoom.room_id, {
            name: editGroupName,
            avatar_url: currentRoom.rc_url
         });
         setCurrentRoom(prev => prev ? { ...prev, rc_name: editGroupName } : null);
         setRooms(prev => prev.map(r => r.room_id === currentRoom.room_id ? { ...r, rc_name: editGroupName } : r));
         setIsEditingGroup(false);
      } catch (err) { alert('แก้ไขชื่อกลุ่มไม่สำเร็จ'); }
   };

   const handlePromoteAdmin = (targetId: number, currentRole: string) => {
      if (!currentRoom) return;
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      const action = newRole === 'admin' ? 'ตั้งเป็นแอดมิน' : 'ลดสถานะเป็นสมาชิก';

      modal.confirm({
         title: `ต้องการ${action}ใช่หรือไม่?`,
         centered: true,
         okText: "ตกลง",
         cancelText: "ยกเลิก",
         onOk: async () => {
            try {
               await chatService.updateMemberRole(currentRoom.room_id, targetId, newRole as 'admin' | 'member');
               // Update local state
               const updatedMembers = currentRoom.member?.map(m =>
                  Number(m.member_id) === targetId ? { ...m, rm_role: newRole } : m
               );
               setCurrentRoom(prev => prev ? { ...prev, member: updatedMembers } : null);
               message.success(`${action}สำเร็จ`);
            } catch (err) { message.error('ดำเนินการไม่สำเร็จ'); }
         }
      });
   };

   const toggleMemberSelection = (id: number) => {
      setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
   };

   // --- Upload Handlers ---
   const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
         const files = Array.from(e.target.files);
         const newImages = files.map(file => ({
            id: Date.now() + Math.random(),
            file,
            preview: URL.createObjectURL(file)
         }));
         setUploadedImages(prev => [...prev, ...newImages]);
         setShowImagePreview(true);
      }
      e.target.value = '';
   };

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
         const files = Array.from(e.target.files);
         const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            file,
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB'
         }));
         setUploadedFiles(prev => [...prev, ...newFiles]);
         setShowFilePreview(true);
      }
      e.target.value = '';
   };

   const removeImage = (id: number) => {
      setUploadedImages(prev => {
         const newState = prev.filter(img => img.id !== id);
         if (newState.length === 0) setShowImagePreview(false);
         return newState;
      });
   };

   const removeFile = (id: number) => {
      setUploadedFiles(prev => {
         const newState = prev.filter(f => f.id !== id);
         if (newState.length === 0) setShowFilePreview(false);
         return newState;
      });
   };

   const handleSendImages = async () => {
      if (!currentRoom || uploadedImages.length === 0) return;

      // ⭐ 1. Optimistic UI: clear preview immediately
      const tempImages = [...uploadedImages];
      setUploadedImages([]);
      setShowImagePreview(false);

      // ⭐ 2. Optimistic UI: Add temporary message
      const tempId = Date.now();
      const optimisticMsg: Message = {
         message_id: tempId,
         room_id: currentRoom.room_id,
         sender_id: myUserID,
         content: "ส่งรูปภาพ",
         type_message: 'image',
         sent_at: new Date().toISOString(),
         sender: { id: myUserID, username: "Me", avatar: "" },
         attachments: tempImages.map((img, index) => ({
            id: tempId + index, // Temp ID
            message_id: tempId,
            file_url: img.preview, // Use local blob URL
            file_type: img.file.type,
            file_name: img.file.name,
            file_size: (img.file.size / 1024).toFixed(2) + ' KB'
         }))
      };

      setMessages(prev => [...prev, optimisticMsg]);
      updateLastMessage(currentRoom.room_id, "ส่งรูปภาพ", myUserID, "Me");

      try {
         const attachments = [];
         for (const img of tempImages) {
            const res = await chatService.uploadImage(img.file, 'image'); // ✅ Type: image
            attachments.push({
               file_url: res.url,
               file_type: res.file_type,
               file_name: res.file_name,
               file_size: res.file_size
            });
         }
         // Send message with attachments
         await chatService.sendMessage(currentRoom.room_id, "ส่งรูปภาพ", 'image', undefined, attachments);
      } catch (err) {
         console.error(err);
         alert("ส่งรูปภาพไม่สำเร็จ");
         // Revert on failure
         setMessages(prev => prev.filter(m => m.message_id !== tempId));
         setUploadedImages(tempImages); // Restore preview
         setShowImagePreview(true);
      }
   };

   const handleSendFiles = async () => {
      if (!currentRoom || uploadedFiles.length === 0) return;

      // ⭐ 1. Optimistic UI: clear preview immediately
      const tempFiles = [...uploadedFiles];
      setUploadedFiles([]);
      setShowFilePreview(false);

      // ⭐ 2. Optimistic UI: Add temporary message
      const tempId = Date.now();
      const optimisticMsg: Message = {
         message_id: tempId,
         room_id: currentRoom.room_id,
         sender_id: myUserID,
         content: "ส่งไฟล์",
         type_message: 'file',
         sent_at: new Date().toISOString(),
         sender: { id: myUserID, username: "Me", avatar: "" },
         attachments: tempFiles.map((f, index) => ({
            id: tempId + index, // Temp ID
            message_id: tempId,
            file_url: "", // For files, we might not have a local preview URL unless we create one, but empty is OK for "Downloading..." state simulation or just show name
            file_type: f.file.type,
            file_name: f.name,
            file_size: f.size
         }))
      };

      setMessages(prev => [...prev, optimisticMsg]);
      updateLastMessage(currentRoom.room_id, "ส่งไฟล์", myUserID, "Me");

      try {
         const attachments = [];
         for (const f of tempFiles) {
            const res = await chatService.uploadImage(f.file, 'file'); // ✅ Type: file
            attachments.push({
               file_url: res.url,
               file_type: res.file_type,
               file_name: res.file_name,
               file_size: res.file_size
            });
         }
         // Send message with attachments
         await chatService.sendMessage(currentRoom.room_id, "ส่งไฟล์", 'file', undefined, attachments);
      } catch (err) {
         console.error(err);
         alert("ส่งไฟล์ไม่สำเร็จ");
         // Revert on failure
         setMessages(prev => prev.filter(m => m.message_id !== tempId));
         setUploadedFiles(tempFiles);
         setShowFilePreview(true);
      }
   };

   // --- Picker Handlers ---
   const handleEmojiClick = (emoji: string) => {
      setInputText(prev => prev + emoji);
      setShowEmojiPicker(false);
   };

   const handleStickerClick = async (stickerId: number) => {
      if (!currentRoom) return;

      // ⭐ Optimistic UI
      const sticker = myStickers.find(s => s.reward.ID === stickerId);
      const tempId = Date.now();

      if (sticker) {
         const optimisticMsg: Message = {
            message_id: tempId,
            room_id: currentRoom.room_id,
            sender_id: myUserID,
            content: "ส่งสติ๊กเกอร์",
            type_message: 'sticker',
            sticker_id: stickerId,
            sticker: {
               reward_name: sticker.reward.reward_name,
               reward_picture: sticker.reward.reward_picture
            },
            sent_at: new Date().toISOString(),
            sender: { id: myUserID, username: "Me", avatar: "" }
         };
         setMessages(prev => [...prev, optimisticMsg]);
         updateLastMessage(currentRoom.room_id, "ส่งสติ๊กเกอร์", myUserID, "Me");
         setShowStickerPicker(false);
      }

      try {
         await chatService.sendMessage(currentRoom.room_id, '', 'sticker', stickerId);
      } catch (err) {
         console.error(err);
         alert("ส่งสติ๊กเกอร์ไม่สำเร็จ");
         setMessages(prev => prev.filter(m => m.message_id !== tempId));
      }
   };

   // --- Other Handlers ---
   const handleUnsend = (msgId: number) => {
      modal.confirm({
         title: "ยกเลิกข้อความ?",
         centered: true,
         okText: "ตกลง",
         cancelText: "ยกเลิก",
         onOk: async () => {
            try { await chatService.unsendMessage(msgId); } catch (err) { }
         }
      });
   };

   const handleClearHistory = () => {
      if (!currentRoom) return;
      modal.confirm({
         title: "ล้างแชท?",
         centered: true,
         okText: "ตกลง",
         cancelText: "ยกเลิก",
         onOk: async () => {
            // ⭐ Optimistic Update: Clear UI immediately
            const previousMessages = [...messages];
            const roomId = currentRoom.room_id;

            setMessages([]);
            setShowMenu(false);
            // Update sidebar immediately: Reset sender to 0 so "You:" prefix doesn't appear
            updateLastMessage(roomId, "เริ่มการสนทนา", 0, "");

            try {
               await chatService.clearHistory(roomId);
               message.success("ล้างแชทเรียบร้อย");
            } catch (err) {
               console.error(err);
               message.error("เกิดข้อผิดพลาดในการล้างแชท");
               // Revert on failure (optional, but good UX)
               setMessages(previousMessages);
            }
         }
      });
   };
   const handleStartChat = async (targetId: number) => {
      // Check if we blocked this user
      if (blockedUsers.has(targetId)) {
         // Show unblock modal instead
         const user = allUsers.find(u => u.id === targetId);
         if (user) {
            setSelectedBlockedUser(user);
            setShowUnblockModal(true);
         }
         return;
      }

      try {
         const res = await chatService.createRoom({ type: 'private', target_id: targetId });
         if (res.data) {
            const exists = rooms.find(r => r.room_id === res.data.room_id);
            if (!exists) setRooms(prev => [res.data, ...prev]);
            setCurrentRoom(res.data);
            setShowSearchModal(false);
         }
      } catch (err: any) {
         // Check if blocked by this user
         const errorMsg = err.response?.data?.error || err.message || "";
         if (err.response?.status === 403 || errorMsg.toLowerCase().includes('block')) {
            alert("คุณถูกบล็อกโดยผู้ใช้นี้ ไม่สามารถส่งข้อความได้");
         } else {
            alert("ไม่สามารถเริ่มแชทได้");
         }
         console.error(err);
      }
   };

   const handleUnblockUser = async () => {
      if (!selectedBlockedUser) return;
      try {
         await friendAPI.unblockUser(selectedBlockedUser.id);
         // Remove from blocked users set
         setBlockedUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedBlockedUser.id);
            return newSet;
         });
         setShowUnblockModal(false);
         setSelectedBlockedUser(null);
         alert("ปลดบล็อกเรียบร้อย");
      } catch (err) {
         console.error(err);
         alert("เกิดข้อผิดพลาดในการปลดบล็อก");
      }
   };

   const handleViewProfile = async (userId: number) => {
      try {
         // Fetch user's friend requests (received) and friends list
         const [friendsRes, receivedReqRes] = await Promise.all([
            friendAPI.getMyFriends(),
            friendAPI.getReceivedRequests()
         ]);

         const friendsData = (friendsRes as any)?.data || [];
         const receivedReqData = (receivedReqRes as any)?.data || [];

         console.log("🔍 Checking relationship for userId:", userId);
         console.log("Friends data:", friendsData);
         console.log("Received requests data:", receivedReqData);

         // Check if user is a friend
         const isFriend = friendsData.some((f: any) =>
            (f.ID || f.id || f.friend_id || f.FriendID) === userId
         );

         // Check if there's a pending received request from this user
         const hasReceivedRequest = receivedReqData.some((req: any) => {
            // The sender info is in sent_member object or sent_mem_id field
            const senderId = req.sent_mem_id ||
               req.sent_member?.ID ||
               req.sent_member?.id ||
               req.sender_id ||
               req.SenderId ||
               req.SenderID ||
               req.sender_mem_id || req.SenderMember?.ID || req.SenderMember?.id;
            return senderId === userId;
         });

         if (isFriend) {
            navigate('/User/Friends/FriendRelation', { state: { selectedId: userId } });
         } else if (hasReceivedRequest) {
            navigate('/User/Friends/Request', { state: { selectedId: userId } });
         } else {
            navigate('/User/Friends/Popular', { state: { selectedId: userId } });
         }
      } catch (err) {
         console.error("Failed to check relationship:", err);

         navigate('/User/Friends/Popular', { state: { selectedId: userId } });
      }
   };

   // ==========================================
   // Render Modal: Group Settings
   // ==========================================
   const renderGroupSettingsModal = () => {
      if (!currentRoom || currentRoom.rc_type !== 'group') return null;

      return (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
               <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-lg">จัดการกลุ่ม</h3>
                  <button onClick={() => setShowGroupInfoModal(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} /></button>
               </div>

               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {/* 1. Group Info */}
                  <div className="flex flex-col items-center mb-6">
                     <div className="relative mb-3 group">
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-100 flex items-center justify-center overflow-hidden">
                           <img src={getImageUrl(currentRoom.rc_url)} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                           {!currentRoom.rc_url && <Users size={32} className="text-gray-400" />}
                        </div>
                        {amIAdmin && (
                           <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white cursor-pointer hover:bg-blue-600 shadow-md transition-transform hover:scale-110">
                              <Edit2 size={14} />
                              <input type="file" className="hidden" accept="image/*" onChange={handleUpdateGroupImage} />
                           </label>
                        )}
                     </div>

                     <div className="flex items-center gap-2 w-full justify-center">
                        {isEditingGroup ? (
                           <div className="flex gap-2">
                              <input
                                 type="text"
                                 value={editGroupName}
                                 onChange={(e) => setEditGroupName(e.target.value)}
                                 className="text-center text-lg font-bold text-gray-800 border-b-2 border-blue-500 outline-none bg-transparent py-1 w-full"
                                 autoFocus
                              />
                              <button onClick={handleSaveGroupInfo} className="p-1 bg-green-500 text-white rounded hover:bg-green-600"><Check size={16} /></button>
                              <button onClick={() => { setIsEditingGroup(false); setEditGroupName(currentRoom.rc_name); }} className="p-1 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"><X size={16} /></button>
                           </div>
                        ) : (
                           <div className="flex items-center gap-2">
                              <h2 className="text-xl font-bold text-gray-800">{currentRoom.rc_name}</h2>
                              {amIAdmin && (
                                 <button onClick={() => { setIsEditingGroup(true); setEditGroupName(currentRoom.rc_name); }} className="text-gray-400 hover:text-blue-500 transition">
                                    <Edit2 size={16} />
                                 </button>
                              )}
                           </div>
                        )}
                     </div>
                     <p className="text-sm text-gray-500 mt-1">สมาชิก {currentRoom.member?.length} คน</p>
                  </div>

                  {/* 2. Actions (Invite) */}
                  <div className="grid gap-3 mb-6">
                     <button
                        onClick={() => { setShowGroupInfoModal(false); setShowInviteModal(true); loadAllUsers(); }}
                        className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition"
                     >
                        <UserPlus size={18} /> เชิญสมาชิก
                     </button>

                  </div>

                  {/* 3. Member List */}
                  <div>
                     <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">รายชื่อสมาชิก</h4>
                     <div className="space-y-1">
                        {currentRoom.member?.map((m) => {
                           const user = m.member;
                           const isMe = Number(m.member_id) === myUserID;
                           const isAdmin = m.rm_role === 'admin';

                           return (
                              <div key={m.member_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl group transition-colors">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                       {user?.member_picture && <img src={getImageUrl(user.member_picture)} className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-800 text-sm">
                                             {user?.first_name} {user?.last_name}
                                          </p>
                                          {isAdmin && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
                                       </div>
                                       <p className="text-xs text-gray-500">@{user?.username}</p>
                                       {isAdmin ? (
                                          <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5 font-medium">
                                             <Crown size={12} className="fill-yellow-500" /> Admin
                                          </p>
                                       ) : (
                                          <p className="text-xs text-gray-400 mt-0.5">Member</p>
                                       )}
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                    {amIAdmin && !isMe && (
                                       <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                          <button
                                             title={isAdmin ? "ลดสถานะ" : "ตั้งเป็นแอดมิน"}
                                             onClick={() => handlePromoteAdmin(Number(m.member_id), m.rm_role)}
                                             className={`p-1.5 rounded-lg ${isAdmin ? 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-500' : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'}`}
                                          >
                                             <Crown size={16} />
                                          </button>
                                          {/* ✅ Kick Member Button (Admin Only) */}
                                          <button
                                             title="เตะออกจากกลุ่ม"
                                             onClick={async () => {
                                                if (confirm(`ต้องการลบ ${user?.first_name} ออกจากกลุ่มหรือไม่?`)) {
                                                   try {
                                                      await chatService.removeMember(currentRoom.room_id, Number(m.member_id));
                                                      // Refresh happens via WebSocket System Message
                                                   } catch (err) {
                                                      alert("ลบสมาชิกไม่สำเร็จ");
                                                   }
                                                }
                                             }}
                                             className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                                          >
                                             <UserMinus size={16} />
                                          </button>
                                       </div>
                                    )}
                                    {isMe && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">ฉัน</span>}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div >

               <div className="p-4 border-t bg-gray-50">
                  <button
                     onClick={handleLeaveRoom}
                     className="w-full py-3 text-red-600 font-medium bg-red-50 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
                  >
                     <LogOut size={18} /> ออกจากกลุ่ม
                  </button>
               </div>
            </div >
         </div >
      );
   };

   return (
      <div className="flex h-full bg-gray-100 font-sans overflow-hidden rounded-2xl shadow-sm border border-gray-200">
         {/* Sidebar */}
         <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200 z-10">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">ข้อความ</h2>
                  <button onClick={() => { setShowSearchModal(true); loadAllUsers(); }} className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-500 hover:text-white transition shadow-sm"><UserPlus size={20} /></button>
               </div>
               <div className="relative">
                  <input type="text" placeholder="ค้นหาแชท..." value={searchRoomQuery} onChange={(e) => setSearchRoomQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all" />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {rooms.filter(r => getChatInfo(r).name.toLowerCase().includes(searchRoomQuery.toLowerCase())).map(room => {
                  const info = getChatInfo(room);

                  // Last Message Format Logic
                  let displayMessage = room.last_message || "เริ่มการสนทนา";
                  if (room.last_message) {
                     if (Number(room.last_sender_id) === Number(myUserID)) {
                        displayMessage = `คุณ: ${room.last_message}`;
                     } else if (room.rc_type === 'group' && room.last_sender_name) {
                        displayMessage = `${room.last_sender_name}: ${room.last_message}`;
                     }
                  }

                  return (
                     <div key={room.room_id} onClick={() => {
                        setCurrentRoom(room);
                        if (room.unread_count && room.unread_count > 0) {
                           // ⭐ Clear Unread Count Optimistically
                           setRooms(prev => prev.map(r => r.room_id === room.room_id ? { ...r, unread_count: 0 } : r));
                           chatService.markRead(room.room_id).catch(console.error);
                        }
                     }} className={`flex items-center p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all border-l-4 ${currentRoom?.room_id === room.room_id ? 'bg-orange-50 border-orange-500 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                        <div className="relative mr-3" onClick={(e) => {
                           e.stopPropagation(); // Prevent opening chat
                           if (room.rc_type === 'private') {
                              const partner = room.member?.find(m => Number(m.member_id) !== Number(myUserID));
                              if (partner) handleViewProfile(Number(partner.member_id));
                           } else if (room.rc_type === 'group') {
                              // If group, maybe show group info?
                              setCurrentRoom(room);
                              setShowGroupInfoModal(true);
                           }
                        }}>
                           <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center hover:opacity-80 transition cursor-pointer">
                              {info.image ? <img src={info.image} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} /> : (info.type === 'group' ? <Users className="text-gray-400" /> : <User className="text-gray-400" />)}
                           </div>
                           {info.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-gray-900 truncate text-sm">{info.name}</h3>
                              {room.unread_count && room.unread_count > 0 ? (
                                 <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-sm animate-in zoom-in-50">
                                    {room.unread_count > 99 ? '99+' : room.unread_count}
                                 </span>
                              ) : null}
                           </div>
                           <p className={`text-xs truncate ${currentRoom?.room_id === room.room_id ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>{displayMessage}</p>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Main Chat */}
         <div className="flex-1 flex flex-col bg-white relative">
            {currentRoom ? (
               <>
                  {/* Header */}
                  {(() => {
                     const info = getChatInfo(currentRoom);
                     return (
                        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10 h-16">
                           <div className="flex items-center gap-3 cursor-pointer" onClick={() => currentRoom.rc_type === 'group' && setShowGroupInfoModal(true)}>
                              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center">
                                 {info.image ? <img src={info.image} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} /> : (info.type === 'group' ? <Users className="text-gray-400" /> : <User className="text-gray-400" />)}
                              </div>
                              <div>
                                 <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    {info.name}
                                    {currentRoom.rc_type === 'group' && <Settings size={14} className="text-gray-400" />}
                                 </h3>
                                 {info.isOnline && <span className="text-xs text-green-500 font-medium">● กำลังใช้งาน</span>}
                              </div>
                           </div>
                           <div className="relative">
                              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><MoreVertical size={20} /></button>
                              {showMenu && (
                                 <div className="absolute right-0 top-12 w-48 bg-white shadow-xl rounded-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                                    {currentRoom.rc_type === 'group' && (
                                       <button onClick={() => { setShowGroupInfoModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex gap-2 items-center text-gray-700">
                                          <Settings size={16} /> จัดการกลุ่ม
                                       </button>
                                    )}
                                    <button onClick={handleClearHistory} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex gap-2 items-center text-gray-700">
                                       <Eraser size={16} /> ล้างแชท
                                    </button>
                                    {/* Block User */}
                                    {currentRoom.rc_type === 'private' && (
                                       <button onClick={handleBlockUser} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex gap-2 items-center">
                                          <ShieldBan size={16} /> บล็อก
                                       </button>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>
                     );
                  })()}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col">
                     {(() => {
                        const info = getChatInfo(currentRoom);
                        const partner = currentRoom.rc_type === 'private'
                           ? currentRoom.member?.find((m) => Number(m.member_id) !== Number(myUserID))
                           : null;
                        const user = partner?.member;

                        return (
                           <>
                              {/* Profile Info Header (Always Visible at Top of Scroll) */}
                              <div className="flex flex-col items-center justify-center pt-8 pb-8 shrink-0 select-none">
                                 {/* Avatar */}
                                 <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-gray-100 flex items-center justify-center overflow-hidden shadow-sm mb-4">
                                    {info.image && !headerImgError ? (
                                       <img src={info.image} className="w-full h-full object-cover" onError={() => setHeaderImgError(true)} />
                                    ) : (
                                       info.type === 'group' ? <Users size={56} className="text-gray-400" /> : <User size={56} className="text-gray-400" />
                                    )}
                                 </div>

                                 {/* Name */}
                                 <h2 className="text-2xl font-bold text-gray-800 mb-1">{info.name}</h2>

                                 {/* Subtext: Student ID / Creator Info */}
                                 {currentRoom.rc_type === 'group' ? (
                                    <div className="text-center mt-2">
                                       {(() => {
                                          const creator = currentRoom.creator || currentRoom.member?.find(m => m.member_id === currentRoom.created_by)?.member;
                                          const isCreator = currentRoom.created_by === myUserID;
                                          return (
                                             <p className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                                                {isCreator ? 'คุณเป็นคนสร้างกลุ่มนี้' : `${creator?.first_name || 'Admin'} เป็นคนสร้างกลุ่ม`}
                                             </p>
                                          );
                                       })()}
                                    </div>
                                 ) : (
                                    user && (
                                       <div className="text-center">
                                          <p className="text-sm text-gray-400 mb-3">
                                             {user.student_id ? `${user.student_id}` : ''} {user.student_id && '-'} {user.username}
                                          </p>
                                          <button
                                             className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-sm text-sm"
                                             onClick={() => {
                                                if (partner) handleViewProfile(partner.member_id);
                                             }}
                                          >
                                             ดูโปรไฟล์
                                          </button>
                                       </div>
                                    )
                                 )}
                              </div>

                              {/* Message List */}
                              <div className="flex flex-col space-y-3">
                                 {messages.map((msg, idx) => {
                                    const isMe = Number(msg.sender_id) === Number(myUserID);
                                    const avatarUrl = msg.sender?.member_picture || msg.sender?.avatar;

                                    // Special System Message Rendering
                                    if (msg.type_message === 'system') {
                                       return (
                                          <div key={idx} className="w-full flex justify-center animate-in fade-in zoom-in-95 duration-300">
                                             <span className="bg-gray-100 text-gray-500 text-xs py-1 px-4 rounded-full shadow-sm border border-gray-200 select-none">
                                                {msg.content}
                                             </span>
                                          </div>
                                       );
                                    }

                                    return (
                                       <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-1 fade-in duration-300`}>
                                          {!isMe && (
                                             <div
                                                className="w-8 h-8 mr-2 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 self-end mb-6 shadow-sm cursor-pointer hover:opacity-80 transition"
                                                onClick={() => handleViewProfile(Number(msg.sender_id))}
                                             >
                                                {avatarUrl ? <img src={getImageUrl(avatarUrl)} className="w-full h-full object-cover" /> : <User className="p-1 text-gray-500 w-full h-full" />}
                                             </div>
                                          )}
                                          <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                             {!isMe && currentRoom.rc_type === 'group' && <span className="text-[11px] text-gray-500 ml-1 mb-1 font-medium">{msg.sender?.first_name}</span>}

                                             {/* Message Bubble Logic */}
                                             {msg.type_message === 'image' ? (
                                                // --- Image Message Style (No Bubble Background) ---
                                                <div className="relative">
                                                   {msg.attachments && (
                                                      <div className={`grid gap-1 ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                         {msg.attachments.map((att) => (
                                                            <div key={att.id} className="relative group/img overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-all border border-gray-100" onClick={() => { setSelectedImage(att.file_url); setShowImageModal(true); }}>
                                                               <img src={att.file_url} alt="attachment" className={`object-cover ${msg.attachments && msg.attachments.length > 1 ? 'w-40 h-32' : 'w-60 h-auto max-h-80'}`} />
                                                               <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                                                  <Download size={24} className="text-white drop-shadow-lg scale-90 group-hover/img:scale-100 transition-transform" onClick={(e) => { e.stopPropagation(); window.open(att.file_url, '_blank'); }} />
                                                               </div>
                                                            </div>
                                                         ))}
                                                      </div>
                                                   )}
                                                </div>
                                             ) : msg.type_message === 'sticker' ? (
                                                // --- Sticker Message Style ---
                                                <div className="w-32 h-32 hover:scale-105 transition-transform">
                                                   {msg.sticker?.reward_picture ? (
                                                      <img
                                                         src={getImageUrl(msg.sticker.reward_picture)}
                                                         alt="Sticker"
                                                         className="w-full h-full object-contain drop-shadow-sm"
                                                      />
                                                   ) : (
                                                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-xs text-gray-400">
                                                         Sticker Not Found
                                                      </div>
                                                   )}
                                                </div>
                                             ) : msg.type_message === 'file' ? (
                                                // --- File Message Style (Standalone Card) ---
                                                <div className="flex flex-col gap-2">
                                                   {msg.attachments?.map((att) => (
                                                      <div key={att.id} onClick={() => window.open(att.file_url, '_blank')} className="w-64 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all shadow-sm">
                                                         <div className="w-10 h-10 bg-blue-100/50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                                            <FileText size={20} />
                                                         </div>
                                                         <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-800 text-sm truncate">{att.file_name}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase">{att.file_type.split('/').pop() || 'FILE'} • {att.file_size} KB</p>
                                                         </div>
                                                         <div className="bg-white rounded-full p-1.5 shadow-sm text-gray-500 hover:text-blue-600 transition">
                                                            <Download size={14} />
                                                         </div>
                                                      </div>
                                                   ))}
                                                </div>
                                             ) : (
                                                // --- Text Message Style (Standard Bubble) ---
                                                <div className={`px-4 py-2 text-sm shadow-sm break-words relative ${isMe ? 'bg-blue-500 text-white rounded-2xl rounded-br-none' : 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-200'}`}>
                                                   {msg.is_deleted ? (
                                                      <span className="italic opacity-70 flex gap-1 items-center text-xs"><Trash2 size={12} /> ข้อความถูกลบ</span>
                                                   ) : (
                                                      <p>{msg.content}</p>
                                                   )}
                                                </div>
                                             )}

                                             <div className="text-[10px] text-gray-400 mt-1 flex gap-2 items-center">
                                                {isMe && !msg.is_deleted && <button onClick={() => handleUnsend(msg.message_id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition font-medium">ยกเลิก</button>}
                                                <span>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                             </div>
                                          </div>
                                       </div>
                                    );
                                 })}
                                 <div ref={messagesEndRef} />
                              </div>
                           </>
                        );
                     })()}
                  </div>

                  {/* Input Area */}
                  {(() => {
                     // Check current user status in the group
                     const myMemberInfo = currentRoom.member?.find(m => Number(m.member_id) === Number(myUserID));
                     const isGroup = currentRoom.rc_type === 'group';
                     const isPending = isGroup && myMemberInfo?.request_status === 'pending';
                     const hasLeft = isGroup && !myMemberInfo; // If undefined, means not in member list (left/kicked)

                     if (hasLeft) {
                        return (
                           <div className="bg-gray-100 p-4 text-center text-gray-500 text-sm border-t border-gray-200">
                              คุณไม่ได้เป็นสมาชิกของกลุ่มนี้แล้ว
                           </div>
                        );
                     }

                     if (isPending) {
                        return (
                           <div className="bg-white border-t border-gray-200 p-4 flex flex-col items-center justify-center gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                              <p className="text-gray-600 font-medium text-sm">คุณได้รับเชิญให้เข้าร่วมกลุ่มนี้</p>
                              <div className="flex gap-4 w-full max-w-sm">
                                 <button
                                    onClick={async () => {
                                       if (confirm("ต้องการออกจากกลุ่ม?")) {
                                          await chatService.leaveRoom(currentRoom.room_id);
                                          loadRooms();
                                          setRooms(prev => prev.filter(r => r.room_id !== currentRoom.room_id));
                                          setCurrentRoom(null);
                                       }
                                    }}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                                 >
                                    ปฏิเสธ
                                 </button>
                                 <button
                                    onClick={async () => {
                                       try {
                                          await chatService.joinGroup(currentRoom.room_id);
                                          // Update local state to accepted immediately
                                          const updatedMembers = currentRoom.member?.map(m =>
                                             m.member_id === myUserID ? { ...m, request_status: 'joined' as const } : m
                                          );
                                          setCurrentRoom({ ...currentRoom, member: updatedMembers });
                                       } catch (err) {
                                          console.error("Failed to join group:", err);
                                          alert("เกิดข้อผิดพลาดในการเข้าร่วมกลุ่ม");
                                       }
                                    }}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-md transition"
                                 >
                                    ยอมรับคำเชิญ
                                 </button>
                              </div>
                           </div>
                        );
                     }

                     // Standard Input Area for Joined Members & Private Chat
                     return (
                        <div className="bg-white border-t border-gray-100 px-4 py-3 relative">
                           {/* Pickers */}
                           {showEmojiPicker && (
                              <div className="absolute bottom-20 right-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72 z-50 animate-in zoom-in-95">
                                 <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">อีโมจิ</h3><button onClick={() => setShowEmojiPicker(false)}><X size={16} /></button></div>
                                 <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {EMOJIS.map((e, i) => <button key={i} onClick={() => handleEmojiClick(e)} className="text-xl hover:bg-gray-100 p-1 rounded transition">{e}</button>)}
                                 </div>
                              </div>
                           )}
                           {showStickerPicker && (
                              <div className="absolute bottom-16 left-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-80 z-50 animate-in zoom-in-95 origin-bottom-left">
                                 <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">สติ๊กเกอร์ของฉัน</h3><button onClick={() => setShowStickerPicker(false)}><X size={16} /></button></div>
                                 {myStickers.length === 0 ? (
                                    <div className="text-center text-gray-400 py-4 text-sm">ไม่มีสติ๊กเกอร์<br />(แลกได้ที่หน้ารางวัล)</div>
                                 ) : (
                                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                                       {myStickers.map((ms) => (
                                          <button key={ms.ID} onClick={() => handleStickerClick(ms.reward.ID)} className="hover:bg-gray-50 p-2 rounded-xl flex flex-col items-center transition">
                                             <img src={getImageUrl(ms.reward.reward_picture)} alt={ms.reward.reward_name} className="w-16 h-16 object-contain" />
                                             <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{ms.reward.reward_name}</span>
                                          </button>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           )}

                           <div className="flex items-center gap-2">
                              {/* Attachment */}
                              <button onClick={() => document.getElementById('fileInput')?.click()} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors shadow-sm">
                                 <Paperclip size={20} />
                              </button>
                              <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileSelect} />

                              {/* Image */}
                              <button onClick={() => document.getElementById('imageInput')?.click()} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors shadow-sm">
                                 <ImageIcon size={20} />
                              </button>
                              <input id="imageInput" type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />

                              {/* Input Box */}
                              <div className="flex-1 relative">
                                 <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="พิมพ์ข้อความ..."
                                    className="w-full bg-white border border-gray-200 text-gray-800 rounded-full px-5 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
                                 />
                                 {/* Emoji Inside Input */}
                                 <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    <Smile size={20} />
                                 </button>
                              </div>

                              {/* Sticker (hidden in reference but useful to keep, styling consistent) */}
                              {/* Sticker Button */}
                              <button onClick={() => setShowStickerPicker(!showStickerPicker)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${showStickerPicker ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                                 <StickyNote size={20} />
                              </button>

                              {/* Send Button */}
                              <button
                                 onClick={() => handleSendMessage()}
                                 disabled={!inputText.trim()}
                                 className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all transform ${inputText.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                              >
                                 <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
                              </button>
                           </div>
                        </div>
                     );
                  })()}
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400 select-none">
                  <MessageCircle size={48} className="text-gray-300 mb-4" />
                  <h2 className="text-lg font-semibold text-gray-600">ข้อความของคุณ</h2>
               </div>
            )}
         </div>

         {/* --- Modals (Preview Image & File) --- */}

         {showImagePreview && (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-gray-800">ส่งรูปภาพ ({uploadedImages.length})</h3>
                     <button onClick={() => { setShowImagePreview(false); setUploadedImages([]); }} className="p-1 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                     {uploadedImages.map(img => (
                        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group border">
                           <img src={img.preview} className="w-full h-full object-cover" />
                           <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition opacity-0 group-hover:opacity-100">
                              <X size={14} />
                           </button>
                        </div>
                     ))}
                     <label className="aspect-square flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                        <ImageIcon size={24} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 font-medium">เพิ่มรูป</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                     </label>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                     <button onClick={() => { setShowImagePreview(false); setUploadedImages([]); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">ยกเลิก</button>
                     <button onClick={handleSendImages} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-md">ส่งรูปภาพ</button>
                  </div>
               </div>
            </div>
         )}

         {showFilePreview && (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-gray-800">ส่งไฟล์ ({uploadedFiles.length})</h3>
                     <button onClick={() => { setShowFilePreview(false); setUploadedFiles([]); }} className="p-1 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                     {uploadedFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600"><Paperclip size={20} /></div>
                              <div className="min-w-0">
                                 <p className="font-medium text-gray-800 truncate text-sm">{file.name}</p>
                                 <p className="text-xs text-gray-500">{file.size}</p>
                              </div>
                           </div>
                           <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition"><Trash2 size={18} /></button>
                        </div>
                     ))}
                     <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition">
                        <Paperclip size={18} /> <span className="text-sm font-medium">เพิ่มไฟล์อีก</span>
                        <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                     </label>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                     <button onClick={() => { setShowFilePreview(false); setUploadedFiles([]); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">ยกเลิก</button>
                     <button onClick={handleSendFiles} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-md">ส่งไฟล์</button>
                  </div>
               </div>
            </div>
         )}

         {/* Other Modals */}
         {showGroupInfoModal && renderGroupSettingsModal()}

         {showSearchModal && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-4 bg-orange-500 text-white flex justify-between items-center">
                     <h3 className="font-bold">เริ่มแชทใหม่</h3>
                     <button onClick={() => setShowSearchModal(false)}><X size={20} /></button>
                  </div>

                  <div className="p-4 bg-gray-50">
                     <input
                        autoFocus
                        type="text"
                        placeholder="ค้นหาเพื่อน..."
                        value={searchUserQuery}
                        onChange={(e) => {
                           setSearchUserQuery(e.target.value);
                           setFilteredUsers(e.target.value ? allUsers.filter(u => (u.first_name + " " + u.last_name).toLowerCase().includes(e.target.value.toLowerCase())) : allUsers)
                        }}
                        className="w-full p-2 rounded-xl border"
                     />
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                     {filteredUsers.map(u => {
                        const isBlocked = blockedUsers.has(u.id);
                        const isBlockedBy = blockedByUsers.has(u.id);

                        return (
                           <div
                              key={u.id}
                              className="p-3 hover:bg-gray-100 cursor-pointer flex gap-3 items-center justify-between rounded-xl transition"
                              onClick={() => handleStartChat(u.id)}
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gray-200">
                                    {u.avatar && <img src={u.avatar} className="w-full h-full rounded-full object-cover" />}
                                 </div>
                                 <span className="font-medium">{u.first_name} {u.last_name}</span>
                              </div>

                              {isBlocked && (
                                 <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                    บล็อกแล้ว
                                 </span>
                              )}

                              {isBlockedBy && !isBlocked && (
                                 <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                                    โดนบล็อก
                                 </span>
                              )}
                           </div>
                        );
                     })}
                  </div>

                  <div className="p-4 border-t">
                     <button
                        onClick={() => { setShowSearchModal(false); setShowCreateGroupModal(true); }}
                        className="w-full p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
                     >
                        สร้างกลุ่มใหม่
                     </button>
                  </div>
               </div>
            </div>
         )}
         {showCreateGroupModal && (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-2xl p-6"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-gray-800">สร้างกลุ่มใหม่</h3><button onClick={() => setShowCreateGroupModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div><div className="flex justify-center mb-6"><div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 relative border-2 border-dashed border-gray-300">{groupImage ? <img src={groupImage} className="w-full h-full rounded-full object-cover" /> : <ImageIcon size={32} />}<label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white cursor-pointer hover:bg-blue-600 shadow-md"><Paperclip size={14} /><input type="file" className="hidden" accept="image/*" onChange={handleGroupImageUpload} /></label></div></div><input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4" placeholder="ชื่อกลุ่ม" value={groupName} onChange={e => setGroupName(e.target.value)} /><div className="max-h-48 overflow-y-auto border rounded-xl p-2 mb-4">{allUsers.map(u => (<div key={u.id} onClick={() => toggleMemberSelection(u.id)} className={`p-2 flex justify-between items-center rounded-lg cursor-pointer ${selectedMembers.includes(u.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">{u.avatar && <img src={u.avatar} className="w-full h-full object-cover" />}</div><span>{u.first_name} {u.last_name}</span></div>{selectedMembers.includes(u.id) && <Check size={16} className="text-blue-500" />}</div>))}</div><button onClick={handleCreateGroup} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">สร้างกลุ่ม</button></div></div>)}
         {showInviteModal && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-gray-800">เชิญสมาชิกเพิ่ม</h3>
                     <button onClick={() => { setShowInviteModal(false); setSelectedMembers([]) }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 p-1 mb-4">
                     {(() => {
                        // Filter candidates who are NOT in the group
                        const candidates = allUsers.filter(u => !currentRoom?.member?.some(m => Number(m.member_id) === u.id));

                        if (candidates.length === 0) return <p className="text-center text-gray-400 py-4 text-sm">ไม่มีสมาชิกให้เชิญ</p>;

                        return candidates.map(u => (
                           <div key={u.id} onClick={() => toggleMemberSelection(u.id)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${selectedMembers.includes(u.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}>
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <User className="p-2 text-gray-400 w-full h-full" />}
                                 </div>
                                 <div>
                                    <p className="font-medium text-gray-800 text-sm">{u.first_name} {u.last_name}</p>
                                    <p className="text-xs text-gray-500">@{u.username}</p>
                                 </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${selectedMembers.includes(u.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                 {selectedMembers.includes(u.id) && <Check size={12} className="text-white" />}
                              </div>
                           </div>
                        ));
                     })()}
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button onClick={() => { setShowInviteModal(false); setSelectedMembers([]) }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">ยกเลิก</button>
                     <button
                        onClick={handleInviteMembers}
                        disabled={selectedMembers.length === 0}
                        className={`flex-1 py-3 text-white rounded-xl font-medium transition shadow-md ${selectedMembers.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                     >
                        เชิญเลย ({selectedMembers.length})
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Unblock Confirmation Modal */}
         {showUnblockModal && selectedBlockedUser && (
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                     คุณบล็อกสมาชิกนี้
                  </h3>

                  <div className="flex flex-col items-center mb-6">
                     <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-3 border-2 border-gray-100">
                        {selectedBlockedUser.avatar && (
                           <img src={selectedBlockedUser.avatar} className="w-full h-full object-cover" />
                        )}
                     </div>
                     <p className="font-semibold text-gray-800">{selectedBlockedUser.first_name} {selectedBlockedUser.last_name}</p>
                     <p className="text-sm text-gray-500">@{selectedBlockedUser.username}</p>
                  </div>

                  <p className="text-center text-gray-600 mb-6">
                     ต้องการปลดบล็อคหรือไม่
                  </p>

                  <div className="flex gap-3">
                     <button
                        onClick={() => {
                           setShowUnblockModal(false);
                           setSelectedBlockedUser(null);
                        }}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                     >
                        ยกเลิก
                     </button>
                     <button
                        onClick={handleUnblockUser}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-md"
                     >
                        ปลดบล็อก
                     </button>
                  </div>
               </div>
            </div>
         )}
         {/* Image Lightbox Modal */}
         {showImageModal && selectedImage && (
            <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowImageModal(false)}>
               <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition" onClick={() => setShowImageModal(false)}>
                  <X size={32} />
               </button>
               <img src={selectedImage} alt="Full Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
               <a
                  href={selectedImage}
                  download
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => { e.stopPropagation(); }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-900 shadow-xl hover:bg-gray-100 font-bold px-8 py-3 rounded-full transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 text-lg"
               >
                  <Download size={24} /> ดาวน์โหลด
               </a>
            </div>
         )}
      </div>
   );
}

export default ChatPage;