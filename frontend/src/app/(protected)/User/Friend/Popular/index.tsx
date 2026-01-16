import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { chatService } from "../../../../../services/http/chat"; // ✅ Import Chat Service
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { memberRewardAPI } from "../../../../../services/http/member_reward"; // ✅ Import Member Reward API


// Icons
import { ArrowLeft, Image as ImageIcon, Search, Edit } from "lucide-react";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import CakeIcon from "@mui/icons-material/Cake";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CrueltyFreeIcon from "@mui/icons-material/CrueltyFree";
import {
  UserPlus,
  UserMinus,
  UserX,
  UserCheck,
  MessageCircle,
  MoreHorizontal,
  Ban,
  Check
} from "lucide-react";

// Config Dayjs
dayjs.extend(buddhistEra);
dayjs.locale("th");

// --- Interfaces ---
interface MemberItem {
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

  // Logic Status
  status: 'none' | 'pending' | 'friend' | 'self' | 'incoming';
  requestId?: number;
  isFollowing: boolean;
}

const FriendPopular: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = "/api";
  const token = localStorage.getItem("token");

  // --- State ---
  const [displayList, setDisplayList] = useState<MemberItem[]>([]);
  const [allMembers, setAllMembers] = useState<MemberItem[]>([]);
  const [populars, setPopulars] = useState<MemberItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<MemberItem | null>(null);
  const [activeTab, setActiveTab] = useState("post");

  const [stickerItems, setStickerItems] = useState<any[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(false);

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ⭐ Helper: จัดการ URL รูปภาพ
  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `${API_URL.replace("/api", "")}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchInitialData();
  }, []);

  // ✅ Fetch stickers for the selected profile
  useEffect(() => {
    if (selectedProfile?.id) {
      fetchStickers(selectedProfile.id);
    } else {
      setStickerItems([]);
    }
  }, [selectedProfile]);

  const fetchStickers = async (id: number) => {
    setLoadingStickers(true);
    try {
      const res = await memberRewardAPI.getMemberStickers(id);
      if (res.data) setStickerItems(res.data);
      else setStickerItems([]);
    } catch (err) {
      console.error("Fetch Sticker Error:", err);
      setStickerItems([]);
    }
    finally { setLoadingStickers(false); }
  };

  useEffect(() => {
    setShowMoreMenu(false);
  }, [selectedProfile]);

  useEffect(() => {
    // เช็คว่ามี state ส่งมาไหม และข้อมูลโหลดเสร็จหรือยัง
    if (location.state?.selectedId && (displayList.length > 0 || allMembers.length > 0)) {
      const targetId = location.state.selectedId;

      const targetProfile = displayList.find(m => m.id === targetId);
      const backupProfile = allMembers.find(m => m.id === targetId);

      const foundProfile = targetProfile || backupProfile;

      if (foundProfile) {
        setSelectedProfile(foundProfile);
        window.history.replaceState({}, document.title);
      }
    }
  }, [displayList, allMembers, location.state]);


  // --- Fetching Logic ---
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [meRes, sentRes, receivedRes, friendRes, popRes, allRes, followRes, blockRes] = await Promise.all([
        fetch(`${API_URL}/member/me`, { headers }),
        fetch(`${API_URL}/member/my/friend-requests/sent`, { headers }),
        fetch(`${API_URL}/member/my/friend-requests/received`, { headers }),
        fetch(`${API_URL}/member/my/friends`, { headers }),
        fetch(`${API_URL}/member/members/popular`, { headers }),
        fetch(`${API_URL}/member/members`, { headers }),
        fetch(`${API_URL}/member/my/following`, { headers }),
        fetch(`${API_URL}/member/my/blocks`, { headers })
      ]);

      const meData = await meRes.json();
      const sentData = await sentRes.json();
      const receivedData = await receivedRes.json();
      const friendData = await friendRes.json();
      const popData = await popRes.json();
      const allMembersData = await allRes.json();
      const followData = await followRes.json();
      const blockData = await blockRes.json();

      const currentUserId = Number(meData.data?.ID || meData.data?.id || meData.ID || meData.id || 0);

      const sentMap = new Map<number, number>();
      if (sentData.data) {
        sentData.data.forEach((req: any) => {
          const targetId = Number(req.receive_member_id || req.receive_mem_id);
          if (targetId) sentMap.set(targetId, req.rf_id);
        });
      }

      const receivedSet = new Set<number>();
      if (receivedData.data) {
        receivedData.data.forEach((req: any) => {
          const senderId = Number(req.sent_member?.ID || req.sent_member?.id || req.sent_mem_id);
          if (senderId) receivedSet.add(senderId);
        });
      }

      const friendSet = new Set<number>();
      if (friendData.data) {
        friendData.data.forEach((f: any) => friendSet.add(Number(f.ID || f.id)));
      }

      const followingSet = new Set<number>();
      if (followData.data) {
        followData.data.forEach((f: any) => followingSet.add(Number(f.ID || f.id)));
      }

      const blockedSet = new Set<number>();
      if (blockData.data) {
        blockData.data.forEach((b: any) => blockedSet.add(Number(b.ID || b.id)));
      }

      const processMembers = (list: any[]): MemberItem[] => {
        return list.map((m: any) => {
          const mId = Number(m.ID || m.id);

          let status: MemberItem['status'] = 'none';
          let reqId: number | undefined = undefined;

          if (mId === currentUserId) {
            status = 'self';
          } else if (friendSet.has(mId)) {
            status = 'friend';
          } else if (receivedSet.has(mId)) {
            status = 'incoming';
          } else if (sentMap.has(mId)) {
            status = 'pending';
            reqId = sentMap.get(mId);
          }

          return {
            id: mId,
            name: `${m.first_name} ${m.last_name}`,
            username: m.username || "-",
            // ⭐ ใช้ Helper จัดการรูป
            avatar: getImageUrl(m.member_picture),

            friendCount: m.friend_count || 0,
            followerCount: m.follower_count || 0,
            followingCount: m.following_count || 0,

            bio: m.bio || "-",
            gender: m.Gender ? m.Gender.gender_name : "ไม่ระบุ",
            dob: m.dob ? dayjs(m.dob).format("D MMM BBBB") : "-",

            status: status,
            requestId: reqId,
            isFollowing: followingSet.has(mId)
          };
        }).filter(item => !blockedSet.has(item.id));
      };

      if (allMembersData.data) {
        setAllMembers(processMembers(allMembersData.data));
      }

      if (popData.data) {
        const processedPop = processMembers(popData.data);

        const cleanPopulars = processedPop.filter(m => {
          const isMe = (m.id === currentUserId) || (m.status === 'self');
          const isFriend = (m.status === 'friend');
          const isIncoming = (m.status === 'incoming');
          return !isMe && !isFriend && !isIncoming;
        });

        setPopulars(cleanPopulars);

        if (!searchTerm) {
          setDisplayList(cleanPopulars);
        }
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Search Handler ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === "") {
      setDisplayList(populars);
    } else {
      const filtered = allMembers.filter(m =>
        m.name.toLowerCase().includes(term.toLowerCase()) ||
        m.username.toLowerCase().includes(term.toLowerCase())
      );
      setDisplayList(filtered);
    }
  };

  // --- Handlers ---
  const updateLocalState = (targetId: number, updates: Partial<MemberItem>) => {
    const updateList = (list: MemberItem[]) => list.map(m => m.id === targetId ? { ...m, ...updates } : m);
    setDisplayList(prev => updateList(prev));
    setPopulars(prev => updateList(prev));
    setAllMembers(prev => updateList(prev));

    if (selectedProfile?.id === targetId) {
      setSelectedProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleAddFriend = async (targetId: number) => {
    try {
      const res = await fetch(`${API_URL}/member/friend-requests`, {
        method: "POST", headers, body: JSON.stringify({ receiver_id: targetId })
      });
      if (res.ok) {
        updateLocalState(targetId, { status: 'pending' });
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) { console.error(err); }
  };

  const handleCancelRequest = async (reqId: number | undefined, targetId: number) => {
    if (!reqId || !window.confirm("ต้องการยกเลิกคำขอ?")) return;
    try {
      const res = await fetch(`${API_URL}/member/friend-requests/${reqId}/cancel`, { method: "PUT", headers });
      if (res.ok) {
        updateLocalState(targetId, { status: 'none', requestId: undefined });
      }
    } catch (err) { console.error(err); }
  };

  const handleFollowToggle = async () => {
    if (!selectedProfile) return;
    const targetId = selectedProfile.id;
    const isCurrentlyFollowing = selectedProfile.isFollowing;

    try {
      if (isCurrentlyFollowing) {
        const res = await fetch(`${API_URL}/member/follows/${targetId}/unfollow`, { method: "PUT", headers });
        if (res.ok) updateLocalState(targetId, { isFollowing: false });
      } else {
        const res = await fetch(`${API_URL}/member/follows`, {
          method: "POST", headers, body: JSON.stringify({ followed_id: targetId })
        });
        if (res.ok) updateLocalState(targetId, { isFollowing: true });
      }
    } catch (err) { console.error(err); }
  };

  const handleBlockUser = async () => {
    if (!selectedProfile || !window.confirm("คุณแน่ใจหรือไม่ว่าจะบล็อกผู้ใช้นี้?")) return;
    try {
      const res = await fetch(`${API_URL}/member/blocks`, {
        method: "POST", headers, body: JSON.stringify({ blocked_id: selectedProfile.id })
      });
      if (res.ok) {
        alert("บล็อกเรียบร้อย");
        const filterList = (list: MemberItem[]) => list.filter(m => m.id !== selectedProfile.id);
        setDisplayList(prev => filterList(prev));
        setPopulars(prev => filterList(prev));
        setAllMembers(prev => filterList(prev));
        setSelectedProfile(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleMessageClick = async () => {
    if (!selectedProfile) return;
    try {
      const res = await chatService.createRoom({ type: 'private', target_id: selectedProfile.id });
      if (res.data) {
        navigate('/User/Message', { state: { roomId: res.data.room_id } });
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("ไม่สามารถเริ่มแชทได้");
    }
  };

  const handleEditProfile = () => {
    navigate('/User/Profile/Edit');
  };

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">

      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <div className="w-96 bg-white flex flex-col border-r border-slate-200 shadow-sm z-10 flex-shrink-0">

        {/* Header & Search */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/User/Friends')}
              className="hover:bg-orange-100 rounded-full p-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {searchTerm ? "ผลการค้นหา" : "เพื่อนยอดนิยม"}
            </h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสมาชิก..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              {searchTerm ? `ไม่พบ "${searchTerm}"` : "ไม่มีรายชื่อแนะนำ"}
            </div>
          ) : (
            displayList.map((person) => (
              <div
                key={person.id}
                onClick={() => setSelectedProfile(person)}
                className={`rounded-2xl p-4 border transition-all cursor-pointer 
                            ${selectedProfile?.id === person.id
                    ? "bg-orange-50 border-orange-200 shadow-md ring-1 ring-orange-200"
                    : "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    {/* ⭐ ใช้ URL ที่ผ่าน Helper แล้ว */}
                    {person.avatar ? (
                      <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <h3 className="font-semibold text-base text-gray-800 truncate">{person.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {person.status === 'self'
                          ? 'คุณเอง'
                          : (person.followerCount > 0 ? `${person.followerCount} ผู้ติดตาม` : 'สมาชิก')}
                      </p>
                    </div>

                    {/* Mini Action Buttons */}
                    <div className="mt-3">
                      {/* ตัวเราเอง -> แก้ไข */}
                      {person.status === 'self' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditProfile(); }}
                          className="w-full flex items-center justify-center gap-2 py-1.5 bg-slate-800 text-white rounded-lg font-medium text-xs hover:bg-slate-900 transition-all shadow-sm"
                        >
                          <Edit className="w-3 h-3" /> แก้ไขโปรไฟล์
                        </button>
                      )}

                      {/* คนที่ส่งคำขอมา -> ตอบรับ */}
                      {person.status === 'incoming' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/User/Friends/Request'); }}
                          className="w-full flex items-center justify-center gap-2 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-medium text-xs hover:bg-orange-200 transition-all"
                        >
                          <Check className="w-3 h-3" /> ตอบรับคำขอ
                        </button>
                      )}

                      {/* เพื่อนแล้ว */}
                      {person.status === 'friend' && (
                        <div className="w-full py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg font-medium text-xs text-center">
                          เป็นเพื่อนแล้ว
                        </div>
                      )}

                      {/* ส่งไปแล้ว */}
                      {person.status === 'pending' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelRequest(person.requestId, person.id); }}
                          className="w-full flex items-center justify-center gap-2 py-1.5 bg-slate-100 text-slate-500 rounded-lg font-medium text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 border border-transparent transition-all group"
                        >
                          <span className="group-hover:hidden">ส่งคำขอแล้ว</span>
                          <span className="hidden group-hover:inline">ยกเลิกคำขอ</span>
                        </button>
                      )}

                      {/* ยังไม่เป็นเพื่อน */}
                      {person.status === 'none' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddFriend(person.id); }}
                          className="w-full flex items-center justify-center gap-2 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg font-medium text-xs hover:from-orange-500 hover:to-orange-600 transition-all shadow-sm"
                        >
                          <UserPlus className="w-3 h-3" /> เพิ่มเพื่อน
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ----------------- RIGHT PANEL (Target UI) ----------------- */}
      <div className="flex-1 bg-slate-50 overflow-y-auto flex justify-center p-7">
        {selectedProfile ? (
          <div className="w-full max-w-[1100px] animate-in fade-in zoom-in-95 duration-300">

            {/* PROFILE HEADER */}
            <div className="bg-white rounded-[28px] p-[35px_40px] mb-[20px] shadow-[0px_8px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-[30px]">
                <div className="w-[150px] h-[150px] rounded-full bg-[#C42E0A] flex items-center justify-center 
                        text-white text-[40px] font-bold overflow-hidden flex-shrink-0">
                  {selectedProfile.avatar ? (
                    <img src={selectedProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedProfile.username?.[0]?.toUpperCase()
                  )}
                </div>

                <div className="flex-1 ml-[10px]">
                  <div className="flex items-baseline gap-3 mb-4">
                    <h3 className="text-[28px] font-[650] text-[#C42E0A] mr-1">
                      {selectedProfile.username}
                    </h3>
                    <p className="text-slate-500 text-lg m-0">
                      {selectedProfile.name}
                    </p>
                  </div>

                  <div className="flex mt-[15px] gap-[150px] ">
                    <div className="cursor-pointer group">
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">
                        {selectedProfile.friendCount}
                      </h4>
                      <span className="font-[500] text-[#5c5c5c]">friends</span>
                    </div>
                    <div className="cursor-pointer group">
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">
                        {selectedProfile.followerCount}
                      </h4>
                      <span className="font-[500] text-[#5c5c5c]">followers</span>
                    </div>
                    <div className="cursor-pointer group">
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">
                        {selectedProfile.followingCount}
                      </h4>
                      <span className="font-[500] text-[#5c5c5c]">following</span>
                    </div>
                  </div>

                  <div className="mt-[18px]">
                    <p className="whitespace-pre-line text-[16px] font-[400] text-slate-700 leading-relaxed">
                      {selectedProfile.bio !== "-" ? selectedProfile.bio : "No biography."}
                    </p>
                    <div className="flex items-center mt-[14px] text-[#C42E0A] text-[16px] font-[600] gap-[16px]">
                      <div className="flex items-center">
                        <PeopleAltIcon style={{ color: "#C42E0A", marginRight: 6 }} />
                        {selectedProfile.gender}
                      </div>
                      <span>•</span>
                      <div className="flex items-center">
                        <CakeIcon style={{ color: "#C42E0A", marginRight: 6 }} />
                        {selectedProfile.dob}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ⭐ ACTION BUTTONS (Right Panel) */}
            <div className="self-start flex gap-3 min-w-[30px] mb-[20px]">

              {/* 1. ปุ่มติดตาม (ไม่แสดงถ้าเป็นตัวเอง) */}
              {selectedProfile.status !== 'self' && (
                <button
                  onClick={handleFollowToggle}
                  className={`w-full py-2 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm
                                    ${selectedProfile.isFollowing
                      ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      : "bg-[#C42E0A] text-white hover:bg-[#a02508]"
                    }`}
                >
                  {selectedProfile.isFollowing ? (
                    <><UserMinus size={18} /> เลิกติดตาม</>
                  ) : (
                    <><UserPlus size={18} /> ติดตาม</>
                  )}
                </button>
              )}

              {/* 2. ปุ่มจัดการความสัมพันธ์ */}
              {selectedProfile.status === 'self' ? (
                <button
                  onClick={handleEditProfile}
                  className="w-full py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 
                                flex justify-center items-center gap-2 shadow-sm transition-all"
                >
                  <Edit size={18} /> แก้ไขโปรไฟล์
                </button>
              ) : selectedProfile.status === 'friend' ? (
                <button className="w-full py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl 
                                  font-semibold cursor-default flex items-center justify-center gap-2">
                  <UserCheck size={18} /> เป็นเพื่อนแล้ว
                </button>
              ) : selectedProfile.status === 'pending' ? (
                <button
                  onClick={() => handleCancelRequest(selectedProfile.requestId, selectedProfile.id)}
                  className="w-full py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl 
                                font-semibold hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center gap-2 transition-all"
                >
                  <UserX size={18} /> ยกเลิกคำขอ
                </button>
              ) : selectedProfile.status === 'incoming' ? (
                <button
                  onClick={() => navigate('/User/Friends/Request')}
                  className="w-full py-2 bg-orange-100 text-orange-600 rounded-xl font-semibold hover:bg-orange-200 
                                flex justify-center items-center gap-2 shadow-sm transition-all"
                >
                  <Check size={18} /> ตอบรับคำขอ
                </button>
              ) : (
                <button
                  onClick={() => handleAddFriend(selectedProfile.id)}
                  className="w-full py-2 bg-[#FF9F43] text-white rounded-xl font-semibold hover:bg-[#ff8c24] 
                                flex justify-center items-center gap-2 shadow-sm transition-all"
                >
                  <UserPlus size={18} /> เพิ่มเพื่อน
                </button>
              )}

              {/* 3. ส่งข้อความ & Block (ซ่อนถ้าเป็นตัวเอง) */}
              {selectedProfile.status !== 'self' && (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleMessageClick}
                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 flex justify-center items-center gap-2 font-medium transition-colors"
                  >
                    <MessageCircle size={20} />
                    <span className="text-sm">ส่งข้อความ</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className={`py-2 px-3 rounded-xl flex justify-center border transition-all ${showMoreMenu
                        ? "bg-slate-100 text-slate-600 border-slate-300"
                        : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-100 
                                    rounded-xl shadow-lg overflow-hidden z-20 p-1 animate-in zoom-in-95">
                        <button
                          onClick={() => {
                            handleBlockUser();
                            setShowMoreMenu(false);
                          }}
                          className="w-full py-2 px-3 text-red-500 font-medium text-sm hover:bg-red-50 
                                    rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Ban size={16} /> Block
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              <div className="mt-5">
                {activeTab === 'sticker' ? (
                  loadingStickers ? <div className="text-center text-gray-400 py-10">กำลังโหลด...</div> :
                    stickerItems.length === 0 ? <div className="text-center text-gray-400 py-10">ไม่มีสติ๊กเกอร์</div> :
                      <div className="grid grid-cols-3 gap-4">
                        {stickerItems.map((s) => {
                          const rw = s.reward ?? s.Reward;
                          const img = s.reward_picture ?? rw?.reward_picture ?? rw?.RewardPicture ?? "";
                          const name = s.reward_name ?? rw?.reward_name ?? rw?.RewardName ?? "Sticker";
                          return (
                            <div key={s.id} className="flex flex-col items-center gap-2">
                              {img ? <img src={img} alt={name} className="w-20 h-20 object-contain" onError={(e) => (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/90?text=Sticker"} /> : <div className="w-20 h-20 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">No Image</div>}
                              <span className="text-xs font-semibold text-[#C42E0A] text-center">{name}</span>
                            </div>
                          )
                        })}
                      </div>
                ) : (
                  <div className="flex justify-center items-center h-40 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                    No content available in {activeTab}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="text-center self-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200">
              <PersonSearchIcon style={{ fontSize: 60, color: "#cbd5e1" }} />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">ค้นหาสมาชิก</h2>
            <p className="text-slate-500 text-sm">พิมพ์ชื่อสมาชิกทางซ้ายมือเพื่อค้นหา</p>
          </div>
        )}
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default FriendPopular;