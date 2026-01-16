import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";


// Icons
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import CloseIcon from "@mui/icons-material/Close";
import CakeIcon from "@mui/icons-material/Cake";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CrueltyFreeIcon from "@mui/icons-material/CrueltyFree";
import CheckIcon from "@mui/icons-material/Check";
import {
  UserPlus,
  UserMinus,
  UserCheck,
  MessageCircle,
  MoreHorizontal,
  Ban,
} from "lucide-react";


import {
  friendAPI,
  getImageUrl
} from "../../../../../services/http/friend";
import { chatService } from "../../../../../services/http/chat"; // ✅ Import Chat Service
import { memberRewardAPI } from "../../../../../services/http/member_reward"; // ✅ Import Member Reward API
import MyPost from "../../Profile/MyPost";
import MyFav from "../../Profile/MyFav";


// Config Dayjs
dayjs.extend(buddhistEra);
dayjs.locale("th");
import ProfilePopup from "../../../../../components/ProfilePopup";

// --- Interfaces (เฉพาะหน้านี้ เพราะมี field พิเศษที่ไม่ได้อยู่ใน Service กลาง) ---
interface FriendRequestItem {
  id: number;
  member_id: number;
  name: string;
  username: string;
  avatar: string;
  date: string;
  subText: string;
  status: "pending" | "accepted";

  bio: string;
  gender: string;
  dob: string;

  friendCount: number;
  followerCount: number;
  followingCount: number;

  isFollowing: boolean;
}

const FriendRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message, modal } = App.useApp();
  const token = localStorage.getItem("token");

  // Data State
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestItem[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [showSentModal, setShowSentModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FriendRequestItem | null>(null);
  const [activeTab, setActiveTab] = useState("post");

  const [stickerItems, setStickerItems] = useState<any[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(false);

  // Menus
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Popup
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTab, setPopupTab] = useState<'friends' | 'followers' | 'following'>('friends');

  const handleOpenPopup = (tab: 'friends' | 'followers' | 'following') => {
    if (selectedProfile) {
      setPopupTab(tab);
      setPopupOpen(true);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  // ✅ Fetch stickers for the selected profile
  useEffect(() => {
    if (selectedProfile?.member_id) {
      fetchStickers(selectedProfile.member_id);
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

  // Reset Menus when profile changes
  useEffect(() => {
    setShowActionMenu(false);
    setShowMoreMenu(false);
  }, [selectedProfile]);

  // Handle auto-selection from navigation state
  useEffect(() => {
    if (location.state?.selectedId && receivedRequests.length > 0) {
      const targetId = location.state.selectedId;
      const targetProfile = receivedRequests.find(r => r.member_id === targetId);

      if (targetProfile) {
        setSelectedProfile(targetProfile);
        // Clear state to prevent re-selection on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [receivedRequests, location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ Use Service Methods
      const [followData, receivedData, sentData] = await Promise.all([
        friendAPI.getMyFollowing(),
        friendAPI.getReceivedRequests(),
        friendAPI.getSentRequests()
      ]);

      // 1. My Following Set
      const followingIds = new Set<number>();
      if (followData && followData.data) {
        followData.data.forEach((f: any) => followingIds.add(f.ID || f.id));
      }

      // 2. Received Requests
      if (receivedData && receivedData.data) {
        setReceivedRequests(
          receivedData.data.map((r: any) => {
            const m = r.sent_member || {};
            const memberId = m.ID || m.id || r.sent_mem_id;

            return {
              id: r.rf_id,
              member_id: memberId,
              name: m.first_name ? `${m.first_name} ${m.last_name}` : "Unknown User",
              username: m.username || "-",
              // ⭐ ใช้ Helper จาก Service
              avatar: getImageUrl(m.member_picture),
              date: dayjs(r.created_at).format("D MMM BB"),
              subText: "ต้องการเป็นเพื่อนกับคุณ",
              status: "pending",

              bio: m.bio || "-",
              gender: m.Gender ? m.Gender.gender_name : "ไม่ระบุ",
              dob: m.dob ? dayjs(m.dob).format("D MMM BBBB") : "-",

              friendCount: m.friend_count || 0,
              followerCount: m.follower_count || 0,
              followingCount: m.following_count || 0,

              isFollowing: followingIds.has(memberId)
            };
          })
        );
      }

      // 3. Sent Requests
      if (sentData && sentData.data) {
        setSentRequests(
          sentData.data.map((r: any) => {
            const m = r.recive_member || r.receive_member || {};
            return {
              id: r.rf_id,
              member_id: m.ID || r.receive_mem_id,
              name: m.first_name ? `${m.first_name} ${m.last_name}` : "Unknown User",
              username: m.username || "-",
              // ⭐ ใช้ Helper จาก Service
              avatar: getImageUrl(m.member_picture),
              date: dayjs(r.created_at).format("D MMM BB"),
              subText: "รอการตอบรับ",
              status: "pending",

              bio: m.bio || "-",
              gender: m.Gender ? m.Gender.gender_name : "ไม่ระบุ",
              dob: m.dob ? dayjs(m.dob).format("D MMM BBBB") : "-",

              friendCount: 0,
              followerCount: 0,
              followingCount: 0,
              isFollowing: false,
            };
          })
        );
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers (Updated to use Service) ---



  const handleMessageClick = async () => {
    if (!selectedProfile) return;
    try {
      const res = await chatService.createRoom({ type: 'private', target_id: selectedProfile.member_id });
      if (res.data) {
        navigate('/User/Message', { state: { roomId: res.data.room_id } });
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("ไม่สามารถเริ่มแชทได้");
    }
  };

  const handleAccept = async (reqId: number) => {
    try {
      const res = await friendAPI.respondRequest(reqId, true);
      if (res.status === 200 || res.status === 201) {
        setReceivedRequests((prev) =>
          prev.map((req) => req.id === reqId ? { ...req, status: "accepted" } : req)
        );
        if (selectedProfile?.id === reqId) {
          setSelectedProfile((prev) => prev ? { ...prev, status: "accepted" } : null);
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleReject = async (reqId: number) => {
    try {
      const res = await friendAPI.respondRequest(reqId, false);
      if (res.status === 200 || res.status === 201) {
        setReceivedRequests((prev) => prev.filter((req) => req.id !== reqId));
        if (selectedProfile?.id === reqId) setSelectedProfile(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleCancelRequest = (reqId: number) => {
    modal.confirm({
      title: "ต้องการยกเลิกคำขอ?",
      centered: true,
      okText: "ตกลง",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const res = await friendAPI.cancelRequest(reqId);
          if (res.status === 200 || res.status === 201) {
            setSentRequests((prev) => prev.filter((req) => req.id !== reqId));
            message.success("ยกเลิกคำขอเรียบร้อย");
          }
        } catch (err) {
          console.error(err);
          message.error("เกิดข้อผิดพลาด");
        }
      }
    });
  };

  const handleFollowToggle = async () => {
    if (!selectedProfile) return;
    const targetId = selectedProfile.member_id;
    const isCurrentlyFollowing = selectedProfile.isFollowing;

    try {
      if (isCurrentlyFollowing) {
        const res = await friendAPI.unfollowUser(targetId);
        if (res.status === 200 || res.status === 201) {
          const updatedProfile = { ...selectedProfile, isFollowing: false };
          setSelectedProfile(updatedProfile);
          setReceivedRequests(prev => prev.map(r => r.member_id === targetId ? { ...r, isFollowing: false } : r));
        }
      } else {
        const res = await friendAPI.followUser(targetId);
        if (res.status === 200 || res.status === 201) {
          const updatedProfile = { ...selectedProfile, isFollowing: true };
          setSelectedProfile(updatedProfile);
          setReceivedRequests(prev => prev.map(r => r.member_id === targetId ? { ...r, isFollowing: true } : r));
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleBlockUser = () => {
    if (!selectedProfile) return;
    modal.confirm({
      title: "คุณแน่ใจหรือไม่ว่าจะบล็อกผู้ใช้นี้?",
      centered: true,
      okText: "ตกลง",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const res = await friendAPI.blockUser(selectedProfile.member_id);
          if (res.status === 200 || res.status === 201) {
            message.success("บล็อกเรียบร้อย");
            setReceivedRequests(prev => prev.filter(r => r.member_id !== selectedProfile.member_id));
            setSelectedProfile(null);
          }
        } catch (err) {
          console.error(err);
          message.error("เกิดข้อผิดพลาด");
        }
      }
    });
  };

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">

      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <div className="w-80 lg:w-96 min-w-[280px] bg-white flex flex-col border-r border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate("/User/Friends")}
              className="hover:bg-orange-100 rounded-full p-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">คำขอเป็นเพื่อน</h1>
          </div>
          <div className="flex items-center justify-between ml-10">
            <p className="text-sm text-gray-600">
              {receivedRequests.filter((r) => r.status === "pending").length} รายการ
            </p>
            <button
              onClick={() => setShowSentModal(true)}
              className="text-xs text-orange-500 cursor-pointer hover:text-orange-600 font-medium hover:underline"
            >
              ดูคำขอที่ส่งแล้ว
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {receivedRequests.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">ไม่มีคำขอใหม่</div>
          ) : (
            receivedRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedProfile(request)}
                className={`rounded-2xl p-4 border transition-all cursor-pointer flex items-start gap-3
                    ${selectedProfile?.id === request.id
                    ? "bg-orange-50 border-orange-200 shadow-md ring-1 ring-orange-200"
                    : "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-orange-100"
                  }
                    `}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  {/* ⭐ ใช้ URL ที่ผ่าน Helper แล้ว */}
                  {request.avatar ? (
                    <img src={request.avatar} alt={request.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-base text-gray-800 truncate pr-2 max-w-[180px]">
                      {request.name}
                    </h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {request.date}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 truncate">
                    {request.subText}
                  </p>

                  {request.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAccept(request.id); }}
                        className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 
                            text-white py-1.5 rounded-full font-medium text-sm hover:from-orange-500 hover:to-orange-600 shadow-sm"
                      >
                        ยืนยัน
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(request.id); }}
                        className="flex-1 bg-gray-100 text-gray-600 py-1.5 
                            rounded-full font-medium text-sm hover:bg-gray-200"
                      >
                        ลบ
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-green-50 text-green-600 border border-green-200 py-1.5 rounded-full font-medium text-sm text-center">
                      เป็นเพื่อนแล้ว
                    </div>
                  )}
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
            {/* ⭐ PROFILE HEADER CARD */}
            <div className="bg-white rounded-[28px] p-[35px_40px] mb-[20px] shadow-[0px_8px_20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-[30px]">
                {/* Avatar */}
                <div className="w-[150px] h-[150px] rounded-full bg-[#C42E0A] flex items-center justify-center 
                        text-white text-[40px] font-bold overflow-hidden flex-shrink-0">
                  {selectedProfile.avatar ? (
                    <img src={selectedProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedProfile.username?.[0]?.toUpperCase()
                  )}
                </div>

                {/* Info Section */}
                <div className="flex-1 ml-[10px]">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                    <h3 className="text-[28px] font-[650] text-[#C42E0A] mr-1 break-words max-w-full">
                      {selectedProfile.username}
                    </h3>
                    <p className="text-slate-500 text-lg m-0 break-words max-w-full">
                      {selectedProfile.name}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex mt-[15px] gap-[150px]">
                    <div className="cursor-pointer group" onClick={() => handleOpenPopup('friends')}>
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">
                        {selectedProfile.friendCount}
                      </h4>
                      <span className="font-[500] text-[#5c5c5c]">friends</span>
                    </div>
                    <div className="cursor-pointer group" onClick={() => handleOpenPopup('followers')}>
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">
                        {selectedProfile.followerCount}
                      </h4>
                      <span className="font-[500] text-[#5c5c5c]">followers</span>
                    </div>
                    <div className="cursor-pointer group" onClick={() => handleOpenPopup('following')}>
                      <h4 className="m-0 text-black font-bold text-[18px] group-hover:text-[#C42E0A] transition-colors">
                        {selectedProfile.followingCount}
                      </h4>
                      <span className="font-[500] text-[#5c5c5c]">following</span>
                    </div>
                  </div>

                  {/* Bio & Meta */}
                  <div className="mt-[18px]">
                    <p className="whitespace-pre-wrap break-words text-[16px] font-[400] text-slate-700 leading-relaxed overflow-hidden">
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

            {/* ⭐ ACTION BUTTONS */}
            <div className="self-start flex gap-3 min-w-[30px] mb-[20px]">
              {/* 1. ปุ่มติดตาม */}
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

              {/* 2. ปุ่มจัดการคำขอ */}
              {selectedProfile.status === "pending" ? (
                <div className="relative w-full">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="w-full py-2 bg-[#FF9F43] text-white rounded-xl font-semibold hover:bg-[#ff8c24] 
                              flex justify-center items-center gap-2 shadow-sm transition-all"
                  >
                    <div className="border-2 border-white rounded-[4px] w-5 h-5 flex items-center justify-center">
                      <CheckIcon style={{ fontSize: 14 }} />
                    </div>
                    ตอบรับ
                  </button>

                  {showActionMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-sm border border-slate-100 
                                  rounded-xl shadow-lg overflow-hidden z-10 p-1 flex flex-col gap-1 animate-in slide-in-from-top-2">
                      <button
                        onClick={() => {
                          handleAccept(selectedProfile.id);
                          setShowActionMenu(false);
                        }}
                        className="w-full py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg text-center"
                      >
                        ยืนยันคำขอ
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedProfile.id);
                          setShowActionMenu(false);
                        }}
                        className="w-full py-2 text-slate-500 font-medium hover:bg-slate-100 hover:text-red-500 rounded-lg text-center"
                      >
                        ปฏิเสธคำขอ
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="w-full py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl 
                              font-semibold cursor-default flex items-center justify-center gap-2">
                  <UserCheck size={18} /> เป็นเพื่อนแล้ว
                </button>
              )}

              {/* 3. ปุ่มส่งข้อความ & More */}
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
            </div>

            {/* ⭐ TABS CARD */}
            <div className="bg-white rounded-[28px] p-[25px_30px] shadow-[0px_8px_20px_rgba(0,0,0,0.05)] min-h-[400px]">
              <div className="flex justify-center border-b border-slate-100 mb-6">
                {[
                  { id: "post", label: "My Post", icon: DescriptionIcon },
                  { id: "fav", label: "My Fav", icon: FavoriteIcon },
                  { id: "sticker", label: "My Sticker", icon: CrueltyFreeIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-8 py-3 text-[16px] font-[600] transition-all relative
                                ${activeTab === tab.id ? "text-[#C42E0A]" : "text-[#8E8E8E] hover:text-slate-600"}`}
                  >
                    <tab.icon style={{ color: activeTab === tab.id ? "#C42E0A" : "#8E8E8E", fontSize: 20 }} />
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#C42E0A] rounded-t-md"></span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {activeTab === 'post' && <MyPost userId={selectedProfile.member_id} />}
                {activeTab === 'fav' && <MyFav userId={selectedProfile.member_id} />}
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
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="text-center self-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200">
              <PersonSearchIcon style={{ fontSize: 60, color: "#cbd5e1" }} />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">เลือกรายชื่อ</h2>
            <p className="text-slate-500 text-sm">เลือกชื่อของผู้คนทางซ้ายเพื่อพรีวิวโปรไฟล์</p>
          </div>
        )}
      </div>

      {/* Profile Popup */}
      {selectedProfile && (
        <ProfilePopup
          isOpen={popupOpen}
          onClose={() => setPopupOpen(false)}
          userId={selectedProfile.member_id}
          initialTab={popupTab}
        />
      )}

      {/* MODAL SENT REQUESTS */}
      {showSentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-gray-800">ส่งคำขอแล้ว</h2>
              <button
                onClick={() => setShowSentModal(false)}
                className="hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <CloseIcon style={{ fontSize: 24 }} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <p className="text-sm text-gray-500 mb-4 font-medium">ส่งไปแล้ว {sentRequests.length} รายการ</p>
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                        {/* ⭐ ใช้ Helper จัดการรูป */}
                        {request.avatar ? (
                          <img src={request.avatar} alt={request.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300">
                            <ImageIcon className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate text-sm">{request.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">{request.date}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="ml-4 px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full font-medium text-xs transition-colors whitespace-nowrap border border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default FriendRequest;