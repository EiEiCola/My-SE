import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Image, MoreHorizontal, MessageCircle, UserPlus, UserMinus, Ban, User } from "lucide-react";

import {
  friendAPI,
  getImageUrl,
  type FriendRequestUI,
  type SuggestedFriendUI
} from "../../../../services/http/friend";
import { chatService } from "../../../../services/http/chat"; // ✅ Import Chat Service

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const API_URL = "/api";  <-- No longer needed here

  const [friendRequests, setFriendRequests] = useState<FriendRequestUI[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriendUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<number | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchData();
  }, []);

  // Auto-select user from navigation state (from Chat)
  useEffect(() => {
    const state = location.state as { selectedId?: number };
    if (state?.selectedId) {
      // Find user in suggested friends and auto-select
      setTimeout(() => {
        const userCard = document.querySelector(`[data-user-id="${state.selectedId}"]`);
        if (userCard) {
          (userCard as HTMLElement).click();
        }
      }, 500); // Wait for data to load
    }
  }, [location.state, suggestedFriends]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ Use Service Methods
      const [meRes, reqRecvRes, reqSentRes, friendRes, blockRes, followRes, popRes] = await Promise.all([
        friendAPI.getMe(),
        friendAPI.getReceivedRequests(),
        friendAPI.getSentRequests(),
        friendAPI.getMyFriends(),
        friendAPI.getBlockedUsers(),
        friendAPI.getMyFollowing(),
        friendAPI.getPopularMembers()
      ]);

      // The service methods now return the JSON data directly
      const meData = meRes;
      const reqRecvData = reqRecvRes;
      const reqSentData = reqSentRes;
      const friendData = friendRes;
      const blockData = blockRes;
      const followData = followRes;
      const popData = popRes;

      // 🐛 FIX: endpoint returns object directly, not wrapped in data
      // Check direct props first, then data prop fallback
      const currentUserId = meData?.ID || meData?.id || meData?.data?.ID || meData?.data?.id || 0;
      setMyId(currentUserId);

      // --- Following Set (Moved Up) ---
      const followingIds = new Set<number>();
      if (followData.data) {
        followData.data.forEach((f: any) => followingIds.add(f.ID || f.id));
      }

      // --- Received Requests ---
      const receivedIds = new Set<number>();
      if (reqRecvData.data) {
        setFriendRequests(reqRecvData.data.map((r: any) => {
          const senderId = r.sent_member?.ID || r.sent_member?.id || r.sent_mem_id;
          if (senderId) receivedIds.add(senderId);
          return {
            id: r.rf_id,
            name: r.sent_member ? `${r.sent_member.first_name} ${r.sent_member.last_name}` : "Unknown User",
            avatar: getImageUrl(r.sent_member?.member_picture),
            memberId: senderId,
            isFollowing: followingIds.has(senderId) // ✅ Added isFollowing
          };
        }));
      }

      // --- Sent Requests Map ---
      const sentMap = new Map<number, number>();
      if (reqSentData.data) {
        reqSentData.data.forEach((req: any) => {
          const targetId = req.receive_member_id || req.receive_mem_id;
          if (targetId) sentMap.set(targetId, req.rf_id);
        });
      }

      // --- Friends Set ---
      const myFriendIds = new Set<number>();
      if (friendData.data) {
        friendData.data.forEach((f: any) => myFriendIds.add(f.ID || f.id));
      }

      // --- Blocked Set ---
      const blockedIds = new Set<number>();
      if (blockData.data) {
        blockData.data.forEach((b: any) => blockedIds.add(b.ID || b.id));
      }



      // --- Popular / Suggested Friends ---
      if (popData.data) {
        const notFriendsList = popData.data.filter((m: any) => {
          const memberId = m.ID || m.id;

          const isFriend = myFriendIds.has(memberId);
          const isMe = (memberId === currentUserId);
          const isBlocked = blockedIds.has(memberId);
          const hasIncomingRequest = receivedIds.has(memberId);

          return !isFriend && !isMe && !isBlocked && !hasIncomingRequest;
        });

        setSuggestedFriends(notFriendsList.map((m: any) => {
          const currentId = m.ID || m.id;
          let status: 'none' | 'pending' | 'friends' = 'none';
          let reqId: number | undefined = undefined;

          if (sentMap.has(currentId)) {
            status = 'pending';
            reqId = sentMap.get(currentId);
          }

          return {
            id: currentId,
            name: `${m.first_name} ${m.last_name}`,
            avatar: getImageUrl(m.member_picture), // ⭐ ใช้ Helper
            mutualFriends: m.follower_count || 0,
            status: status,
            requestId: reqId,
            isFollowing: followingIds.has(currentId)
          };
        }));
      }

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleAcceptRequest = async (reqId: number) => {
    try {
      const res = await friendAPI.respondRequest(reqId, true);
      // axios return status 200/201
      if (res.status === 200 || res.status === 201) {
        setFriendRequests(prev => prev.filter(req => req.id !== reqId));
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleRejectRequest = async (reqId: number) => {
    try {
      const res = await friendAPI.respondRequest(reqId, false);
      if (res.status === 200) setFriendRequests(prev => prev.filter(req => req.id !== reqId));
    } catch (err) { console.error(err); }
  };

  const handleAddFriend = async (targetId: number) => {
    if (myId && targetId === myId) { alert("เพิ่มตัวเองไม่ได้"); return; }
    try {
      const res = await friendAPI.sendRequest(targetId);
      if (res.status === 200 || res.status === 201) fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Error";
      alert(errorMsg);
    }
  };

  const handleCancelRequest = async (reqId: number | undefined, memberId: number) => {
    if (!reqId || !window.confirm("ต้องการยกเลิกคำขอเป็นเพื่อน?")) return;
    try {
      const res = await friendAPI.cancelRequest(reqId);
      if (res.status === 200) {
        setSuggestedFriends(prev => prev.map(f =>
          f.id === memberId ? { ...f, status: 'none', requestId: undefined } : f
        ));
      }
    } catch (err) { console.error(err); }
  };

  const handleRemoveSuggestion = (id: number) => {
    setSuggestedFriends(prev => prev.filter(friend => friend.id !== id));
  };

  const handleFollowToggle = async (targetId: number, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        const res = await friendAPI.unfollowUser(targetId);
        if (res.status === 200) {
          setSuggestedFriends(prev => prev.map(f => f.id === targetId ? { ...f, isFollowing: false } : f));
          setFriendRequests(prev => prev.map(r => r.memberId === targetId ? { ...r, isFollowing: false } : r)); // ✅ Sync FriendRequests
          alert("เลิกติดตามแล้ว");
        }
      } else {
        const res = await friendAPI.followUser(targetId);
        if (res.status === 200 || res.status === 201) {
          setSuggestedFriends(prev => prev.map(f => f.id === targetId ? { ...f, isFollowing: true } : f));
          setFriendRequests(prev => prev.map(r => r.memberId === targetId ? { ...r, isFollowing: true } : r)); // ✅ Sync FriendRequests
          alert("ติดตามเรียบร้อย");
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleBlock = async (targetId: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าจะบล็อกผู้ใช้นี้?")) return;
    try {
      const res = await friendAPI.blockUser(targetId);
      if (res.status === 200 || res.status === 201) {
        alert("บล็อกผู้ใช้เรียบร้อย");
        setSuggestedFriends(prev => prev.filter(f => f.id !== targetId));
        setFriendRequests(prev => prev.filter(r => r.id !== targetId));
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "เกิดข้อผิดพลาด";
      alert(errorMsg);
    }
  };



  // ✅ Handle Message Click
  const handleMessageClick = async (targetId: number) => {
    try {
      const res = await chatService.createRoom({ type: 'private', target_id: targetId });
      if (res.data) {
        navigate('/User/Message', { state: { roomId: res.data.room_id } });
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("ไม่สามารถเริ่มแชทได้");
    }
  };

  // --- Component: FriendCard ---
  const FriendCard = ({ person, type }: { person: any, type: 'request' | 'suggested' }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setShowMenu(false);
        }
      };

      const handleScroll = () => {
        if (showMenu) setShowMenu(false);
      }

      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }, [showMenu]);

    const handleMenuAction = (action: string) => {
      setShowMenu(false);
      // ⭐ Fix: Prioritize memberId (User ID) if available (for Requests), otherwise use id (for Suggested)
      const targetId = person.memberId || person.id;

      if (action === "view_profile") handleCardClick();
      else if (action === "message") handleMessageClick(targetId); // ✅ Now sends correct User ID
      else if (action === "follow_toggle") handleFollowToggle(targetId, person.isFollowing);
      else if (action === "block") handleBlock(targetId);
    };

    const handleCardClick = () => {
      if (type === 'request') {
        navigate('/User/Friends/Request', { state: { selectedId: person.memberId } });
      } else {
        navigate('/User/Friends/Popular', { state: { selectedId: person.id } });
      }
    };

    const toggleMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (showMenu) {
        setShowMenu(false);
      } else {
        const rect = (e.currentTarget as Element).getBoundingClientRect();
        // Align menu: top-right relative to button
        setMenuPosition({
          top: rect.bottom + 5,
          left: rect.right - 180
        });
        setShowMenu(true);
      }
    }

    return (
      <div
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible hover:shadow-md transition-shadow relative group"
        data-user-id={person.id}
      >

        <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden rounded-t-2xl relative">
          <div onClick={handleCardClick} className="cursor-pointer w-full h-full">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-300 text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                }}
              />
            ) : (
              <Image className="w-12 h-12 text-slate-300 mx-auto mt-10" />
            )}
          </div>
        </div>

        <div className="p-4 relative">
          <div className="flex justify-between items-start mb-1 relative">
            <h3 className="font-semibold text-slate-800 text-sm truncate pr-2 cursor-pointer hover:underline" onClick={handleCardClick}>
              {person.name}
            </h3>

            <button onClick={toggleMenu} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="fixed w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <div className="py-1">
                  <button onClick={() => handleMenuAction("message")} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition-colors">
                    <MessageCircle className="w-4 h-4" /> ส่งข้อความ
                  </button>
                  <button onClick={handleCardClick} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition-colors">
                    <User className="w-4 h-4" /> ดูโปรไฟล์
                  </button>

                  <button onClick={() => handleMenuAction("follow_toggle")} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition-colors">
                    {person.isFollowing ? (
                      <><UserMinus className="w-4 h-4" /> เลิกติดตาม</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> ติดตาม</>
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>
                  <button onClick={() => handleMenuAction("block")} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <Ban className="w-4 h-4" /> บล็อก
                  </button>
                </div>
              </div>
            )}

          </div>

          <p className="text-xs text-slate-500 mb-3">
            {person.mutualFriends > 0 ? `${person.mutualFriends} ผู้ติดตาม` : 'สมาชิกใหม่'}
          </p>

          <div className="space-y-2 relative z-0">
            {type === 'request' ? (
              <>
                <button onClick={() => handleAcceptRequest(person.id)} className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600">ยืนยัน</button>
                <button onClick={() => handleRejectRequest(person.id)} className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-200">ลบ</button>
              </>
            ) : (
              <>
                {person.status === 'friends' && <div className="w-full py-2 bg-green-50 text-green-600 rounded-lg font-medium text-sm text-center border border-green-200">เพื่อน</div>}

                {person.status === 'pending' && (
                  <button onClick={() => handleCancelRequest(person.requestId, person.id)} className="w-full py-2 bg-slate-100 text-slate-500 rounded-lg font-medium text-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 border border-transparent">ยกเลิกคำขอ</button>
                )}

                {person.status === 'none' && (
                  <button onClick={() => handleAddFriend(person.id)} className="w-full py-2 bg-orange-50 text-orange-600 rounded-lg font-medium text-sm hover:bg-orange-100">เพิ่มเพื่อน</button>
                )}

                {person.status !== 'friends' && (
                  <button onClick={() => handleRemoveSuggestion(person.id)} className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg font-medium text-sm hover:bg-slate-100">ไม่สนใจ</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Section 1: Friend Requests */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">คำขอเป็นเพื่อน ({friendRequests.length})</h2>
            {friendRequests.length > 5 && (
              <button onClick={() => navigate('/User/Friends/Request')} className="text-orange-600 text-sm font-semibold hover:underline">ดูทั้งหมด</button>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {friendRequests.length === 0 ? (
              <div className="w-full p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">ไม่มีคำขอเป็นเพื่อนใหม่</div>
            ) : (
              friendRequests.map(req => <div key={`req-${req.id}`} className="w-52 flex-shrink-0"><FriendCard person={req} type="request" /></div>)
            )}
          </div>
        </section>

        {/* Section 2: Suggested Friends */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">แนะนำสำหรับคุณ</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {suggestedFriends.length === 0 ? (
              <div className="text-gray-400 text-sm p-4">ไม่มีรายชื่อแนะนำในขณะนี้</div>
            ) : (
              suggestedFriends.map(friend => <div key={`sug-${friend.id}`} className="w-52 flex-shrink-0"><FriendCard person={friend} type="suggested" /></div>)
            )}
          </div>
        </section>

      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default Friends;