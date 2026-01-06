import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

// Icons
import { ArrowLeft, Search, MoreHorizontal, MessageCircle, UserMinus, EyeOff, Ban, ShieldOff, Image as ImageIcon } from "lucide-react";
import CloseIcon from '@mui/icons-material/Close';
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import CakeIcon from "@mui/icons-material/Cake";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CrueltyFreeIcon from "@mui/icons-material/CrueltyFree";
import { UserPlus, UserCheck } from "lucide-react";

// Config Dayjs
dayjs.extend(buddhistEra);
dayjs.locale("th");

// --- Interfaces ---
interface FriendItem {
  id: number;
  name: string;
  username: string;
  avatar: string;
  
  // Stats
  friendCount: number;
  followerCount: number;
  followingCount: number;
  
  // Profile
  bio: string;
  gender: string;
  dob: string;

  // Status
  isFollowing: boolean;
}

const FriendRelation: React.FC = () => {
  const navigate = useNavigate();
  const API_URL = "http://localhost:8080/api";
  const token = localStorage.getItem("token");

  // State
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<FriendItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<FriendItem | null>(null);
  
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [activeTab, setActiveTab] = useState("post");

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ⭐ Helper: จัดการ URL รูปภาพ
  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `http://localhost:8080${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // Reset Menu when profile changes
  useEffect(() => {
    setShowMoreMenu(false);
  }, [selectedProfile]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchInitialData();
  }, []);

  // --- Fetch Data ---
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [friendRes, followRes] = await Promise.all([
        fetch(`${API_URL}/member/my/friends`, { headers }),
        fetch(`${API_URL}/member/my/following`, { headers })
      ]);

      const friendData = await friendRes.json();
      const followData = await followRes.json();

      const followingSet = new Set<number>();
      if (followData.data) {
        followData.data.forEach((f: any) => followingSet.add(f.ID || f.id));
      }

      if (friendData.data) {
        // Map ข้อมูลให้ครบทุก field ตาม Interface
        setFriends(friendData.data.map((m: any) => ({
            id: m.ID || m.id,
            name: `${m.first_name} ${m.last_name}`,
            username: m.username || "-",
            // ⭐ ใช้ Helper จัดการรูป
            avatar: getImageUrl(m.member_picture),
            
            // Stats
            friendCount: m.friend_count || 0,
            followerCount: m.follower_count || 0,
            followingCount: m.following_count || 0,

            bio: m.bio || "-",
            gender: m.Gender ? m.Gender.gender_name : "ไม่ระบุ",
            dob: m.dob ? dayjs(m.dob).format("D MMM BBBB") : "-",

            isFollowing: followingSet.has(m.ID || m.id)
        })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/member/my/blocks`, { headers }); 
      const data = await res.json();
      if (data.data) {
        setBlockedUsers(data.data.map((m: any) => ({
            id: m.ID || m.id,
            name: `${m.first_name} ${m.last_name}`,
            username: m.username || "-",
            // ⭐ ใช้ Helper จัดการรูป
            avatar: getImageUrl(m.member_picture),
            
            friendCount: 0, 
            followerCount: 0, 
            followingCount: 0, 
            
            bio: "-", 
            gender: "-", 
            dob: "-", 
            
            isFollowing: false
        })));
      }
    } catch (e) { console.error(e); }
  };

  const handleOpenBlockModal = () => {
    setShowBlockModal(true);
    fetchBlockedUsers();
  };

  // --- Handlers ---

  const updateLocalState = (targetId: number, updates: Partial<FriendItem>) => {
    setFriends(prev => prev.map(f => f.id === targetId ? { ...f, ...updates } : f));
    // อัปเดตหน้าขวาด้วยถ้าเปิดอยู่
    if (selectedProfile?.id === targetId) {
        setSelectedProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleUnfriend = async (friendId: number) => {
    if (!window.confirm("คุณต้องการเลิกเป็นเพื่อนใช่หรือไม่?")) return;
    try {
      const res = await fetch(`${API_URL}/member/friends/${friendId}/unfriend`, { method: "PUT", headers });
      if (res.ok) {
        setFriends(prev => prev.filter(f => f.id !== friendId)); // ลบออกจาก list ซ้าย
        // ถ้าคนที่ถูกลบ คือคนที่เปิดดูอยู่ ให้ปิดหน้าขวา
        if (selectedProfile?.id === friendId) {
            setSelectedProfile(null);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleBlock = async (friendId: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าจะบล็อกผู้ใช้นี้?")) return;
    try {
      const res = await fetch(`${API_URL}/member/blocks`, {
        method: "POST", headers, body: JSON.stringify({ blocked_id: friendId })
      });
      if (res.ok) {
        setFriends(prev => prev.filter(f => f.id !== friendId)); // ลบออกจาก list ซ้าย
        if (selectedProfile?.id === friendId) setSelectedProfile(null); // ปิดหน้าขวา
        alert("บล็อกเรียบร้อย");
      }
    } catch (e) { console.error(e); }
  };

  const handleUnblock = async (blockedId: number) => {
    if (!window.confirm("ต้องการปลดบล็อก?")) return;
    try {
      const res = await fetch(`${API_URL}/member/blocks/${blockedId}/unblock`, { 
        method: "PUT", headers 
      });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
        // อาจจะ fetch friends ใหม่เพื่อให้เขากลับมา (optional)
      }
    } catch (e) { console.error(e); }
  };

  const handleFollowToggle = async (targetId: number, isCurrentlyFollowing: boolean) => {
    try {
        if (isCurrentlyFollowing) {
            const res = await fetch(`${API_URL}/member/follows/${targetId}/unfollow`, { method: "PUT", headers });
            if(res.ok) updateLocalState(targetId, { isFollowing: false });
        } else {
            const res = await fetch(`${API_URL}/member/follows`, { 
                method: "POST", headers, body: JSON.stringify({ followed_id: targetId }) 
            });
            if(res.ok) updateLocalState(targetId, { isFollowing: true });
        }
    } catch (e) { console.error(e); }
  };
  
  const handleMessage = (name: string) => { alert(`Chat with ${name} (Coming Soon)`); };

  const filteredFriends = friends.filter(friend => friend.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-gray-100" onClick={() => setActiveMenu(null)}>
      
      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <div className="w-96 bg-white flex flex-col border-r border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/User/Friends')} className="hover:bg-gray-100 rounded-full p-2 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">เพื่อนทั้งหมด</h1>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="ค้นหาเพื่อน" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
          </div>

          <div className="flex justify-between items-center px-1">
             <p className="text-sm text-gray-600 font-medium">เพื่อน {filteredFriends.length} คน</p>
             <button 
                onClick={handleOpenBlockModal}
                className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline flex items-center gap-1 transition-colors"
             >
                <Ban className="w-3 h-3" /> รายชื่อที่ถูกบล็อก
             </button>
          </div>
        </div>

        {/* Friend List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredFriends.map((friend) => (
            <div 
                key={friend.id} 
                onClick={() => setSelectedProfile(friend)}
                className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group border-b border-slate-50 last:border-0
                    ${selectedProfile?.id === friend.id ? 'bg-orange-50' : 'hover:bg-gray-50'}
                `}
            >
               {/* Avatar */}
               <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                  {friend.avatar ? <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-300 text-lg">👤</div>}
               </div>
               {/* Info */}
               <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate text-sm">{friend.name}</h3>
                  <p className="text-xs text-gray-500">เพื่อน</p>
               </div>
               {/* Menu (3 Dots) */}
               <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === friend.id ? null : friend.id); }}
                    className={`rounded-full p-2 transition-all ${activeMenu === friend.id ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100 group-hover:text-gray-600'}`}>
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeMenu === friend.id && (
                    <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-64 z-50 animate-fadeIn origin-top-right">
                       <button onClick={() => handleMessage(friend.name)} className="w-full px-4 py-3 hover:bg-orange-50 flex items-center gap-3 transition-colors text-left">
                           <MessageCircle className="w-5 h-5 text-gray-700" /><p className="text-sm font-semibold text-gray-800">ส่งข้อความ</p>
                       </button>
                       
                       {/* Follow Toggle */}
                       <button onClick={() => handleFollowToggle(friend.id, friend.isFollowing)} className="w-full px-4 py-3 hover:bg-orange-50 flex items-center gap-3 transition-colors text-left">
                           {friend.isFollowing ? <EyeOff className="w-5 h-5 text-gray-700" /> : <UserPlus className="w-5 h-5 text-gray-700" />}
                           <div>
                               <p className="text-sm font-semibold text-gray-800">{friend.isFollowing ? "เลิกติดตาม" : "ติดตาม"}</p>
                               <p className="text-[10px] text-gray-500">{friend.isFollowing ? "หยุดดูเนื้อหาในฟีด" : "ดูเนื้อหาในฟีด"}</p>
                           </div>
                       </button>

                       <button onClick={() => handleBlock(friend.id)} className="w-full px-4 py-3 hover:bg-orange-50 flex items-center gap-3 transition-colors text-left">
                           <Ban className="w-5 h-5 text-gray-700" /><div><p className="text-sm font-semibold text-gray-800">บล็อก</p><p className="text-[10px] text-gray-500">ไม่เห็นเนื้อหาของคุณ</p></div>
                       </button>
                       
                       <div className="h-px bg-gray-100 my-1 mx-4"></div>
                       
                       <button onClick={() => handleUnfriend(friend.id)} className="w-full px-4 py-3 hover:bg-red-50 flex items-center gap-3 transition-colors text-left group/delete">
                           <UserMinus className="w-5 h-5 text-red-500 group-hover/delete:text-red-600" /><p className="text-sm font-semibold text-red-500 group-hover/delete:text-red-600">เลิกเป็นเพื่อน</p>
                       </button>
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- RIGHT PANEL ----------------- */}
      <div className="flex-1 bg-slate-50 overflow-y-auto flex justify-center p-7">
        {selectedProfile ? (
          <div className="w-full max-w-[1100px] animate-in fade-in zoom-in-95 duration-300">
            {/* PROFILE HEADER */}
            <div className="bg-white rounded-[28px] p-[35px_40px] mb-[20px] shadow-[0px_8px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-[30px]">
                <div className="w-[150px] h-[150px] rounded-full bg-[#C42E0A] flex items-center justify-center text-white text-[40px] font-bold overflow-hidden flex-shrink-0">
                  {selectedProfile.avatar ? <img src={selectedProfile.avatar} alt="avatar" className="w-full h-full object-cover" /> : selectedProfile.username?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 ml-[10px]">
                  <div className="flex items-baseline gap-3 mb-4">
                    <h3 className="text-[28px] font-[650] text-[#C42E0A] mr-1">{selectedProfile.username}</h3>
                    <p className="text-slate-500 text-lg m-0">{selectedProfile.name}</p>
                  </div>
                  
                  <div className="flex mt-[15px] gap-[150px] ">
                    <div className="cursor-pointer group">
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">{selectedProfile.friendCount}</h4>
                      <span className="font-[500] text-[#5c5c5c]">friends</span>
                    </div>
                    <div className="cursor-pointer group">
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">{selectedProfile.followerCount}</h4>
                      <span className="font-[500] text-[#5c5c5c]">followers</span>
                    </div>
                    <div className="cursor-pointer group">
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">{selectedProfile.followingCount}</h4>
                      <span className="font-[500] text-[#5c5c5c]">following</span>
                    </div>
                  </div>

                  <div className="mt-[18px]">
                    <p className="whitespace-pre-line text-[16px] font-[400] text-slate-700 leading-relaxed">{selectedProfile.bio !== "-" ? selectedProfile.bio : "No biography."}</p>
                    <div className="flex items-center mt-[14px] text-[#C42E0A] text-[16px] font-[600] gap-[16px]">
                      <div className="flex items-center"><PeopleAltIcon style={{ color: "#C42E0A", marginRight: 6 }} />{selectedProfile.gender}</div>
                      <span>•</span>
                      <div className="flex items-center"><CakeIcon style={{ color: "#C42E0A", marginRight: 6 }} />{selectedProfile.dob}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (Layout ตามรูป) */}
            <div className="flex items-center gap-3 w-full mb-[20px]">
              
              {/* 1. ปุ่มติดตาม */}
              <button
                onClick={() => handleFollowToggle(selectedProfile.id, selectedProfile.isFollowing)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
                    ${selectedProfile.isFollowing ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-[#C42E0A] text-white hover:bg-[#a02508]"}`}
              >
                {selectedProfile.isFollowing ? <><UserMinus size={18} /> เลิกติดตาม</> : <><UserPlus size={18} /> ติดตาม</>}
              </button>

              {/* 2. ปุ่มจัดการเพื่อน (มี Unfriend) */}
              <button 
                onClick={() => handleUnfriend(selectedProfile.id)}
                className="flex-1 py-2.5 bg-[#FF9F43] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#ff8c24] transition-all shadow-sm group"
              >
                <span className="flex items-center gap-2 group-hover:hidden"><UserCheck size={18} /> เพื่อน</span>
                <span className="hidden group-hover:flex items-center gap-2"><UserMinus size={18} /> เลิกเป็นเพื่อน</span>
              </button>

              {/* 3. ปุ่มส่งข้อความ */}
              <button 
                onClick={() => handleMessage(selectedProfile.name)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 font-medium text-sm transition-colors shadow-sm"
              >
                <MessageCircle size={18} /> ส่งข้อความ
              </button>

              {/* 4. ปุ่ม More (...) สำหรับ Block */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${showMoreMenu ? "bg-slate-200 border-slate-300 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  <MoreHorizontal size={20} />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-20 p-1 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => { handleBlock(selectedProfile.id); setShowMoreMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Ban size={16} /> Block
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TABS */}
            <div className="bg-white rounded-[28px] p-[25px_30px] shadow-[0px_8px_20px_rgba(0,0,0,0.05)] min-h-[400px]">
              <div className="flex justify-center border-b border-slate-100 mb-6">
                {[{ id: "post", label: "My Post", icon: DescriptionIcon }, { id: "fav", label: "My Fav", icon: FavoriteIcon }, { id: "sticker", label: "My Sticker", icon: CrueltyFreeIcon }].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-8 py-3 text-[16px] font-[600] transition-all relative ${activeTab === tab.id ? "text-[#C42E0A]" : "text-[#8E8E8E] hover:text-slate-600"}`}>
                    <tab.icon style={{ color: activeTab === tab.id ? "#C42E0A" : "#8E8E8E", fontSize: 20 }} />{tab.label}
                    {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#C42E0A] rounded-t-md"></span>}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex justify-center items-center h-40 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">No content available in {activeTab}</div>
            </div>
          </div>
        ) : (
          <div className="text-center self-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200">
              <PersonSearchIcon style={{ fontSize: 60, color: "#cbd5e1" }} />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">เลือกรายชื่อ</h2>
            <p className="text-slate-500 text-sm">เลือกชื่อเพื่อนทางซ้ายเพื่อดูโปรไฟล์</p>
          </div>
        )}
      </div>

      {/* Blocked Users Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2"><Ban className="w-6 h-6 text-red-500" /><h2 className="text-xl font-bold text-gray-800">รายชื่อที่ถูกบล็อก</h2></div>
              <button onClick={() => setShowBlockModal(false)} className="hover:bg-gray-100 rounded-full p-2 transition-colors"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <p className="text-sm text-gray-500 mb-4 font-medium">บล็อกอยู่ {blockedUsers.length} รายการ</p>
              {blockedUsers.length === 0 ? <div className="text-center py-10 text-gray-400">ไม่มีรายชื่อที่ถูกบล็อก</div> : 
                <div className="space-y-4">
                    {blockedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                           <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">{user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-300 text-lg">👤</div>}</div>
                           <div className="flex-1 min-w-0"><h3 className="font-semibold text-gray-800 truncate text-sm">{user.name}</h3><p className="text-xs text-red-400">ถูกบล็อก</p></div>
                        </div>
                        <button onClick={() => handleUnblock(user.id)} className="ml-4 px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full font-medium text-xs transition-colors whitespace-nowrap border border-slate-200 flex items-center gap-1 hover:text-green-600 hover:border-green-200 hover:bg-green-50">
                            <ShieldOff className="w-3 h-3" /> ปลดบล็อก
                        </button>
                    </div>
                    ))}
                </div>
              }
            </div>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default FriendRelation;