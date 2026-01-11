// \frontend\src\app\(protected)\User\Message\page.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
   Send, Search, MessageCircle, MoreVertical, Paperclip, Smile, Image as ImageIcon,
   Trash2, LogOut, Eraser, UserPlus, ShieldBan, X, Check, Users, User, Settings, Crown, Edit2, Sticker
} from 'lucide-react';
import type { Room, Message, WSMessage, User as ChatUser } from '../../../../interfaces/chat';
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
   // --- Data State ---
   const [rooms, setRooms] = useState<Room[]>([]);
   const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

   // --- UI State ---
   const [inputText, setInputText] = useState('');
   const [showMenu, setShowMenu] = useState(false);

   // --- Pickers State ---
   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
   const [showStickerPicker, setShowStickerPicker] = useState(false);

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

   // --- Search/Group Data ---
   const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
   const [searchUserQuery, setSearchUserQuery] = useState('');
   const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([]);
   const [searchRoomQuery, setSearchRoomQuery] = useState('');

   // --- Group Form ---
   const [groupName, setGroupName] = useState('');
   const [groupImage, setGroupImage] = useState<string | null>(null);
   const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

   // --- Edit Group Mode ---
   const [isEditingGroup, setIsEditingGroup] = useState(false);
   const [editGroupName, setEditGroupName] = useState('');

   // --- Config & Refs ---
   const ws = useRef<WebSocket | null>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const activeRoomIdRef = useRef<number | null>(null);
   const WS_URL = "ws://localhost:8080/api/member/chat/ws";
   const token = localStorage.getItem('token') || "";
   const [myUserID, setMyUserID] = useState<number>(0);

   // ✅ Derived State
   const amIAdmin = currentRoom?.member?.some(m => Number(m.member_id) === myUserID && m.rm_role === 'admin');

   // 1. Initial Load
   useEffect(() => {
      const storedID = Number(localStorage.getItem('my_user_id'));
      if (storedID) setMyUserID(storedID);
      else if (token) setMyUserID(getUserIdFromToken(token));
      loadRooms();
   }, [token]);

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
               if (activeRoomIdRef.current === newMsg.room_id) setMessages(prev => [...prev, newMsg]);
               updateLastMessage(newMsg.room_id, newMsg.content);
            }
         } catch (error) { console.error("WS Error:", error); }
      };
      return () => ws.current?.close();
   }, [token]);

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

   const updateLastMessage = (roomId: number, text: string) => {
      setRooms(prev => {
         const index = prev.findIndex(r => r.room_id === roomId);
         if (index === -1) return prev;
         const updated = { ...prev[index], last_message: text };
         const newArr = [...prev];
         newArr.splice(index, 1);
         return [updated, ...newArr];
      });
   };

   // --- Actions ---
   const handleSendMessage = async () => {
      if (!inputText.trim() || !currentRoom) return;
      try { await chatService.sendMessage(currentRoom.room_id, inputText); setInputText(''); } catch (err) { console.error(err); }
   };

   // --- Group Management Handlers ---
   const handleSaveGroupInfo = async () => {
      if (!currentRoom || !editGroupName.trim()) return;
      try {
         // Mockup: Replace with actual API call
         // await chatService.updateGroup(currentRoom.room_id, { name: editGroupName });
         alert(`เปลี่ยนชื่อกลุ่มเป็น "${editGroupName}" สำเร็จ (Mockup)`);
         setIsEditingGroup(false);
         setRooms(prev => prev.map(r => r.room_id === currentRoom.room_id ? { ...r, rc_name: editGroupName } : r));
         if (currentRoom) setCurrentRoom({ ...currentRoom, rc_name: editGroupName });
      } catch (err) { alert("เกิดข้อผิดพลาดในการแก้ไขกลุ่ม"); }
   };

   const handlePromoteAdmin = async (targetMemberID: number) => {
      if (!currentRoom) return;
      if (confirm("ยืนยันการตั้งสมาชิกคนนี้เป็น Admin?")) {
         try { alert(`ตั้ง Admin เรียบร้อย (Mockup)`); loadRooms(); } catch (err) { alert("ทำรายการไม่สำเร็จ"); }
      }
   };

   const handleDismissAdmin = async (targetMemberID: number) => {
      if (!currentRoom) return;
      if (targetMemberID === myUserID) { alert("คุณไม่สามารถปลดตำแหน่งตัวเองได้"); return; }
      if (confirm("ยืนยันการปลด Admin?")) {
         try { alert(`ปลด Admin เรียบร้อย (Mockup)`); loadRooms(); } catch (err) { alert("ทำรายการไม่สำเร็จ"); }
      }
   };

   const handleLeaveRoom = async () => {
      if (!currentRoom) return;
      const admins = currentRoom.member?.filter(m => m.rm_role === 'admin') || [];
      const isLastAdmin = amIAdmin && admins.length === 1 && (currentRoom.member?.length || 0) > 1;

      if (isLastAdmin) {
         alert("⚠️ คุณเป็น Admin เพียงคนเดียวในกลุ่ม\nกรุณาตั้งสมาชิกอื่นเป็น Admin ก่อนออกจากกลุ่ม");
         setShowGroupInfoModal(true);
         return;
      }

      if (!confirm("ต้องการออกจากกลุ่มใช่หรือไม่?")) return;

      try {
         await chatService.leaveRoom(currentRoom.room_id);
         setRooms(prev => prev.filter(r => r.room_id !== currentRoom.room_id));
         setCurrentRoom(null);
         setShowGroupInfoModal(false);
      } catch (err: any) { alert(err.response?.data?.error || "ไม่สามารถออกจากกลุ่มได้"); }
   };

   const handleBlockUser = async () => {
      if (!currentRoom || currentRoom.rc_type !== 'private') return;
      const target = currentRoom.member?.find(m => m.member_id !== myUserID);
      if (!target) return;
      const info = getChatInfo(currentRoom);
      if (confirm(`ต้องการจัดการ Block ผู้ใช้ ${info.name}?`)) {
         try {
            await friendAPI.blockUser(target.member_id);
            alert("ดำเนินการเรียบร้อย");
            window.location.reload();
         } catch (err) { console.error(err); }
      }
   };

   // --- Search & Create Logic ---
   const loadAllUsers = async () => {
      if (allUsers.length > 0) return;
      try {
         const res = await friendAPI.getAllMembers();
         const usersData = Array.isArray(res) ? res : (res as any)?.data;
         if (Array.isArray(usersData)) {
            const mapped = usersData.filter((u: any) => (u.ID || u.id) !== myUserID).map((u: any) => ({
               id: u.ID || u.id, username: u.username, first_name: u.first_name, last_name: u.last_name, avatar: getImageUrl(u.member_picture || u.avatar)
            }));
            setAllUsers(mapped); setFilteredUsers(mapped);
         }
      } catch (err) { console.error(err); }
   };

   const handleCreateGroup = async () => {
      if (!groupName.trim() || selectedMembers.length === 0) return alert('กรุณากรอกข้อมูล');
      try {
         const res = await chatService.createRoom({ type: 'group', group_name: groupName, member_ids: selectedMembers });
         if (res.data) {
            setRooms(prev => [res.data, ...prev]); setCurrentRoom(res.data); setShowCreateGroupModal(false);
            setGroupName(''); setGroupImage(null); setSelectedMembers([]);
         }
      } catch (err) { alert('สร้างกลุ่มไม่สำเร็จ'); }
   };

   const handleInviteMembers = async () => {
      if (!currentRoom || selectedMembers.length === 0) return;
      try {
         alert(`เชิญสมาชิกเพิ่ม ${selectedMembers.length} คนสำเร็จ (Mockup)`);
         setShowInviteModal(false); setSelectedMembers([]); loadRooms();
      } catch (err) { alert('เชิญไม่สำเร็จ'); }
   }

   const handleGroupImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
         const reader = new FileReader();
         reader.onloadend = () => setGroupImage(reader.result as string);
         reader.readAsDataURL(e.target.files[0]);
      }
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
      if (!currentRoom) return;
      alert(`ส่ง ${uploadedImages.length} รูป (Mockup)`);
      setUploadedImages([]);
      setShowImagePreview(false);
   };

   const handleSendFiles = async () => {
      if (!currentRoom) return;
      alert(`ส่ง ${uploadedFiles.length} ไฟล์ (Mockup)`);
      setUploadedFiles([]);
      setShowFilePreview(false);
   };

   // --- Picker Handlers ---
   const handleEmojiClick = (emoji: string) => {
      setInputText(prev => prev + emoji);
      setShowEmojiPicker(false);
   };

   const handleStickerClick = (sticker: any) => {
      alert(`ส่งสติ๊กเกอร์ ${sticker.name}`);
      setShowStickerPicker(false);
   };

   // --- Other Handlers ---
   const handleUnsend = async (msgId: number) => { if (confirm("ยกเลิกข้อความ?")) try { await chatService.unsendMessage(msgId); } catch (err) { } };
   const handleClearHistory = async () => { if (currentRoom && confirm("ล้างแชท?")) try { await chatService.clearHistory(currentRoom.room_id); setMessages([]); setShowMenu(false); } catch (err) { } };
   const handleStartChat = async (targetId: number) => {
      try {
         const res = await chatService.createRoom({ type: 'private', target_id: targetId });
         if (res.data) {
            const exists = rooms.find(r => r.room_id === res.data.room_id);
            if (!exists) setRooms(prev => [res.data, ...prev]);
            setCurrentRoom(res.data);
            setShowSearchModal(false);
         }
      } catch (err) { alert("ไม่สามารถเริ่มแชทได้"); }
   };
   const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchUserQuery(term);
      setFilteredUsers(term ? allUsers.filter((u) => (u.first_name + " " + u.last_name).toLowerCase().includes(term.toLowerCase())) : allUsers);
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
                              <input type="file" className="hidden" accept="image/*" />
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
                                 <button onClick={() => setIsEditingGroup(true)} className="text-gray-400 hover:text-blue-500 transition">
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
                                          {isMe && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">ฉัน</span>}
                                       </div>
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
                                       <div className="relative group/menu">
                                          <button className="p-2 text-gray-400 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition">
                                             <MoreVertical size={16} />
                                          </button>
                                          <div className="absolute right-0 top-full hidden group-hover/menu:block w-36 bg-white shadow-xl rounded-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                             {isAdmin ? (
                                                <button onClick={() => handleDismissAdmin(m.member_id)} className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 text-gray-700">⬇️ ปลด Admin</button>
                                             ) : (
                                                <button onClick={() => handlePromoteAdmin(m.member_id)} className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 text-gray-700">⬆️ ตั้งเป็น Admin</button>
                                             )}
                                             <div className="border-t border-gray-100 my-0.5"></div>
                                             <button className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50">เตะออกจากกลุ่ม</button>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>

               <div className="p-4 border-t bg-gray-50">
                  <button
                     onClick={handleLeaveRoom}
                     className="w-full py-3 text-red-600 font-medium bg-red-50 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
                  >
                     <LogOut size={18} /> ออกจากกลุ่ม
                  </button>
               </div>
            </div>
         </div>
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
                  return (
                     <div key={room.room_id} onClick={() => setCurrentRoom(room)} className={`flex items-center p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all border-l-4 ${currentRoom?.room_id === room.room_id ? 'bg-orange-50 border-orange-500 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                        <div className="relative mr-3">
                           <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center">
                              {info.image ? <img src={info.image} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} /> : (info.type === 'group' ? <Users className="text-gray-400" /> : <User className="text-gray-400" />)}
                           </div>
                           {info.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h3 className="font-semibold text-gray-900 truncate text-sm">{info.name}</h3>
                           <p className={`text-xs truncate ${currentRoom?.room_id === room.room_id ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>{room.last_message || "เริ่มการสนทนา"}</p>
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
                                    <button onClick={async () => { if (confirm("ล้างแชท?")) await chatService.clearHistory(currentRoom.room_id); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex gap-2 items-center text-gray-700">
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
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col space-y-3">
                     {messages.map((msg, idx) => {
                        const isMe = Number(msg.sender_id) === Number(myUserID);
                        return (
                           <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                              {!isMe && (
                                 <div className="w-8 h-8 mr-2 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 self-end mb-6 shadow-sm">
                                    {msg.sender?.avatar ? <img src={msg.sender.avatar} className="w-full h-full object-cover" /> : <User className="p-1 text-gray-500 w-full h-full" />}
                                 </div>
                              )}
                              <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                 {!isMe && currentRoom.rc_type === 'group' && <span className="text-[11px] text-gray-500 ml-1 mb-1 font-medium">{msg.sender?.first_name}</span>}
                                 <div className={`px-4 py-2 text-sm shadow-sm break-words relative ${isMe ? 'bg-orange-500 text-white rounded-2xl rounded-br-none' : 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-200'}`}>
                                    {msg.is_deleted ? <span className="italic opacity-70 flex gap-1 items-center text-xs"><Trash2 size={12} /> ข้อความถูกลบ</span> : msg.content}
                                 </div>
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

                  {/* Input Area */}
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
                        <div className="absolute bottom-20 right-32 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-80 z-50 animate-in zoom-in-95">
                           <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">สติ๊กเกอร์</h3><button onClick={() => setShowStickerPicker(false)}><X size={16} /></button></div>
                           <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                              {STICKERS.map((s) => <button key={s.id} onClick={() => handleStickerClick(s)} className="hover:bg-gray-100 p-2 rounded flex flex-col items-center"><span className="text-3xl">{s.emoji}</span><span className="text-xs text-gray-500">{s.name}</span></button>)}
                           </div>
                        </div>
                     )}

                     <div className="flex items-center gap-3">
                        {/* Attach File */}
                        <label className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-2 hover:bg-gray-50 rounded-full">
                           <Paperclip size={22} />
                           <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                        </label>

                        {/* Attach Image */}
                        <label className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-2 hover:bg-gray-50 rounded-full">
                           <ImageIcon size={22} />
                           <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                        </label>

                        {/* Input Box */}
                        <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-orange-200">
                           <input
                              type="text"
                              value={inputText}
                              onChange={e => setInputText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                              placeholder=""
                              className="flex-1 bg-transparent focus:outline-none text-gray-800 text-sm"
                           />
                        </div>

                        {/* Sticker Button */}
                        <button
                           onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false); }}
                           className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-50 rounded-full"
                        >
                           <Sticker size={22} />
                        </button>

                        {/* Emoji Button */}
                        <button
                           onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false); }}
                           className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-50 rounded-full"
                        >
                           <Smile size={22} />
                        </button>

                        {/* Send Button */}
                        <button
                           onClick={handleSendMessage}
                           disabled={!inputText.trim()}
                           className={`p-3 rounded-xl text-white shadow-sm transition-all flex items-center justify-center ${inputText.trim() ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                           <Send size={20} className="ml-0.5" />
                        </button>
                     </div>
                  </div>
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
         {showSearchModal && ( /* Search Modal */ <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"><div className="p-4 bg-orange-500 text-white flex justify-between items-center"><h3 className="font-bold">เริ่มแชทใหม่</h3><button onClick={() => setShowSearchModal(false)}><X size={20} /></button></div><div className="p-4 bg-gray-50"><input autoFocus type="text" placeholder="ค้นหาเพื่อน..." value={searchUserQuery} onChange={(e) => { setSearchUserQuery(e.target.value); setFilteredUsers(e.target.value ? allUsers.filter(u => u.first_name.includes(e.target.value)) : allUsers) }} className="w-full p-2 rounded-xl border" /></div><div className="flex-1 overflow-y-auto p-2">{filteredUsers.map(u => (<div key={u.id} className="p-3 hover:bg-gray-100 cursor-pointer flex gap-3 items-center" onClick={async () => { try { const r = await chatService.createRoom({ type: 'private', target_id: u.id }); if (r.data) { setRooms(p => [r.data, ...p]); setCurrentRoom(r.data); setShowSearchModal(false); } } catch (e) { alert('Error'); } }}> <div className="w-8 h-8 rounded-full bg-gray-200"><img src={u.avatar} className="w-full h-full rounded-full object-cover" /></div> {u.first_name} {u.last_name} </div>))}</div><div className="p-4 border-t"><button onClick={() => { setShowSearchModal(false); setShowCreateGroupModal(true); }} className="w-full p-3 bg-green-500 text-white rounded-xl">สร้างกลุ่มใหม่</button></div></div></div>)}
         {showCreateGroupModal && (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-2xl p-6"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-gray-800">สร้างกลุ่มใหม่</h3><button onClick={() => setShowCreateGroupModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div><div className="flex justify-center mb-6"><div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 relative border-2 border-dashed border-gray-300">{groupImage ? <img src={groupImage} className="w-full h-full rounded-full object-cover" /> : <ImageIcon size={32} />}<label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white cursor-pointer hover:bg-blue-600 shadow-md"><Paperclip size={14} /><input type="file" className="hidden" accept="image/*" onChange={handleGroupImageUpload} /></label></div></div><input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4" placeholder="ชื่อกลุ่ม" value={groupName} onChange={e => setGroupName(e.target.value)} /><div className="max-h-48 overflow-y-auto border rounded-xl p-2 mb-4">{allUsers.map(u => (<div key={u.id} onClick={() => toggleMemberSelection(u.id)} className={`p-2 flex justify-between items-center rounded-lg cursor-pointer ${selectedMembers.includes(u.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">{u.avatar && <img src={u.avatar} className="w-full h-full object-cover" />}</div><span>{u.first_name} {u.last_name}</span></div>{selectedMembers.includes(u.id) && <Check size={16} className="text-blue-500" />}</div>))}</div><button onClick={handleCreateGroup} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">สร้างกลุ่ม</button></div></div>)}
         {showInviteModal && ( // ✅ Invite Modal (Now Beautiful & Functional)
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
      </div>
   );
}

export default ChatPage;