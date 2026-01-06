import React from "react";
import { useLocation } from "react-router-dom";

// import { 
//     TableRows,
// } from '@mui/icons-material';

interface HeaderProps {
  role: "admin" | "user";
  username?: string;
  isCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ role, username = "eiei" }) => {
  const location = useLocation();

  // แมพ path กับชื่อเมนู
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
  const subtitle =
    role === "admin"
      ? `Welcome back, ${username} (Admin)`
      : `Welcome back, ${username}`;

  return (
    <div
      className="bg-gradient-to-r from-orange-500 to-orange-600 
      border-b-1 border-l-0 border-r-0 border-t-0 border-orange-400/50 border-solid px-6 py-4"
    >
      <div className="flex flex-1 items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-white">
              {title}
            </h1>
            <p className="text-sm text-white/70">
              {subtitle}
            </p>
          </div>
        </div>

        {/* CENTER – Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
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

        {/* RIGHT */}
        <div className="flex items-center space-x-3">
          <button
            className="hidden lg:flex items-center space-x-2 py-2 px-4
            bg-white text-orange-600 
            rounded-xl hover:bg-white/90 hover:shadow-lg transition-all text-sm font-medium"
          >
            <span>New</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;