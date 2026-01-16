import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Search, Settings, Help, DarkMode, ChatBubble, ExitToApp, Person,
  Notifications
} from '@mui/icons-material';
import { memberAPI } from "../../services/http/member_profile";
import { adminProfileAPI } from "../../services/http/admin_profile";
import { useWebSocket } from "../../contexts/WebSocketContext";
import type { Notification } from "../../services/http/notification";
import { Badge } from "antd";

interface HeaderProps {
  role: "admin" | "user";
  username?: string;
  isCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ role, username: defaultUsername = "User" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification from WebSocket Context (real-time)
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteReadNotifications } = useWebSocket();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [profileName, setProfileName] = useState(defaultUsername);
  const [profileImage, setProfileImage] = useState("");

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (role === "user") {
          const res = await memberAPI.getMe();
          const data: any = res.data;
          const user = data.data || data;

          if (user) {
            setProfileName(user.username || user.first_name || "User");
            setProfileImage(user.member_picture || "");
          }

        } else if (role === "admin") {
          const res = await adminProfileAPI.getMe();
          const data = res.data.data;
          if (data) {
            setProfileName(data.username || "Admin");
            setProfileImage(data.profile_picture || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile in Header", error);
      }
    };
    fetchProfile();
  }, [role]);

  /*
  // Fetch Notifications function
  const fetchNotifications = async () => {
    if (role !== 'user') return;
    try {
      const res = await notificationAPI.getAll();
      // Check data structure carefully
      // API returns { data: Notification[] } based on controller
      if (res.data && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  // Fetch on initial load + Poll every 5 minutes (300000ms)
  useEffect(() => {
    if (role === 'user') {
      fetchNotifications();
      // Poll every 5 minutes instead of 30 seconds to reduce server load
      const interval = setInterval(fetchNotifications, 300000);
      return () => clearInterval(interval);
    }
  }, [role]);
  */
  // Memoized callback for marking notification as read
  const handleRead = useCallback(async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.ID);
    }
  }, [markAsRead]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/");
  }, [navigate]);

  // Map path to page title
  const getPageTitle = () => {
    const path = location.pathname;

    if (role === "admin") {
      const adminTitles: { [key: string]: string } = {
        "/Admin": "หน้าหลัก",
        "/Admin/ProfileManage": "จัดการผู้ใช้",
        "/Admin/Profile/Edit": "แก้ไขโปรไฟล์",
        "/Admin/RewardManage": "จัดการสะสมแต้ม",
        "/Admin/RewardManage/PointRule": "จัดการกฎการได้แต้ม",
        "/Admin/MessageManage": "จัดการข้อความ",
        "/Admin/FriendsManage": "จัดการเพื่อน",
        "/Admin/PostManage": "จัดการโพสต์",
        "/Admin/GroupManage": "จัดการกลุ่ม",
        "/Admin/ReviewManage": "จัดการรีวิว",
        "/Admin/VotingManage": "จัดการโพล",
        "/Admin/AnnouncementManage": "จัดการประชาสัมพันธ์",
        "/Admin/ReportManage": "จัดการรายงานปัญหา",
      };
      return adminTitles[path] || "Admin Dashboard";
    } else if (role === "user") {
      const userTitles: { [key: string]: string } = {
        "/User": "หน้าหลัก",
        "/User/Profile": "โปรไฟล์",
        "/User/Profile/Edit": "แก้ไขโปรไฟล์",
        "/User/Profile/sticker": "โปรไฟล์",
        "/User/Profile/post": "โปรไฟล์",
        "/User/Profile/fav": "โปรไฟล์",
        "/User/Reward": "สะสมแต้ม",
        "/User/Message": "ข้อความ",
        "/User/Friends": "เพื่อน",
        "/User/Post": "ฟีด",
        "/User/Group": "หมวดหมู่",
        "/User/Review": "รีวิว",
        "/User/Voting": "โพล",
        "/User/Announcement": "ประชาสัมพันธ์",
        "/User/Report": "รายงานปัญหา",
      };
      return userTitles[path] || "Dashboard";
    }
  };

  // Memoize page title
  const title = useMemo(() => getPageTitle(), [location.pathname, role]);
  const subtitle = role === "admin" ? "Admin Panel" : "Welcome back";

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 backdrop-blur-xl border-b border-orange-400/50 px-6 py-4 relative z-40 shadow-lg">
      <div className="flex items-center justify-between">

        {/* LEFT: Title */}
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-white/70">{subtitle}</p>
        </div>

        {/* CENTER: Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/20
              border border-white/30
              rounded-full text-white
              placeholder-white/60
              focus:outline-none focus:ring-2
              focus:ring-white/50 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* RIGHT: Notification Bell + Profile Dropdown */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                const willOpen = !isNotifOpen;
                setIsNotifOpen(willOpen);
                // Fetch fresh notifications when opening dropdown
                //if (willOpen) fetchNotifications();
              }}
              className="relative p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              title="แจ้งเตือน"
            >
              <Badge count={unreadCount} size="small" offset={[5, 0]}>
                <Notifications className="w-6 h-6 text-white" />
              </Badge>
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[#242526] text-white rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-3 border-b border-gray-700 bg-[#242526]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">แจ้งเตือน</h4>
                    {unreadCount > 0 && <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">{unreadCount} ใหม่</span>}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAllAsRead()}
                      disabled={unreadCount === 0}
                      className="flex-1 text-xs px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      อ่านทั้งหมด
                    </button>
                    <button
                      onClick={() => deleteReadNotifications()}
                      disabled={notifications.filter(n => n.is_read).length === 0}
                      className="flex-1 text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ลบที่อ่านแล้ว
                    </button>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">ไม่มีการแจ้งเตือน</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.ID}
                        onClick={() => handleRead(n)}
                        className={`p-3 border-b border-gray-700/50 hover:bg-[#3a3b3c] cursor-pointer transition-colors relative
                          ${!n.is_read ? 'bg-[#2d4a5e] border-l-4 border-l-orange-500' : 'bg-[#242526] opacity-70'}`}
                      >
                        {/* Unread indicator dot */}
                        {!n.is_read && (
                          <div className="absolute right-3 top-3 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        )}
                        <div className={`text-sm font-semibold mb-1 ${!n.is_read ? 'text-orange-400' : 'text-gray-400'}`}>
                          {n.title}
                        </div>
                        <div className={`text-sm line-clamp-2 ${!n.is_read ? 'text-gray-200' : 'text-gray-500'}`}>
                          {n.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                          {new Date(n.CreatedAt).toLocaleString('th-TH')}
                          {n.is_read && <span className="text-green-500">✓ อ่านแล้ว</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 hover:border-white transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {/* Fallback image if no profile picture */}
              <img
                src={profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[#242526] text-white rounded-xl shadow-2xl border border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">

                {/* Header: User Info */}
                <div className="p-4 border-b border-gray-700">
                  <Link to={role === "admin" ? "/Admin/ProfileManage" : "/User/Profile"} className="flex items-center gap-3 p-2 hover:bg-[#3a3b3c] rounded-lg transition-colors group">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-500 shrink-0">
                      <img
                        src={profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base truncate group-hover:underline">{profileName}</h4>
                      <p className="text-sm text-gray-400">View your profile</p>
                    </div>
                  </Link>
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1">
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-2 hover:bg-[#3a3b3c] rounded-lg transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#3a3b3c] flex items-center justify-center shrink-0">
                      <ExitToApp className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm flex-1">ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Header;