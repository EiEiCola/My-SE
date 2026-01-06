import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Search, Settings, Help, DarkMode, ChatBubble, ExitToApp, Person
} from '@mui/icons-material';
import { memberAPI } from "../../services/http/member_profile";
import { adminProfileAPI } from "../../services/http/admin_profile";

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

  const [profileName, setProfileName] = useState(defaultUsername);
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (role === "user") {
          const res = await memberAPI.getMe();
          // Ensure we access the correct property structure
          // Assuming res.data contains the profile fields directly or inside data
          const data: any = res.data;
          const user = data.data || data; // flexible check

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/");
  };

  // Map path to page title
  const getPageTitle = () => {
    const path = location.pathname;

    if (role === "admin") {
      const adminTitles: { [key: string]: string } = {
        "/Admin": "หน้าหลัก",
        "/Admin/ProfileManage": "จัดการผู้ใช้",
        "/Admin/RewardManage": "จัดการสะสมแต้ม",
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

  const title = getPageTitle();
  const subtitle = role === "admin" ? "Admin Panel" : "Welcome back";

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 relative z-40">
      <div className="flex items-center justify-between">

        {/* LEFT: Title */}
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        {/* CENTER: Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
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

        {/* RIGHT: Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
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
  );
};

export default Header;