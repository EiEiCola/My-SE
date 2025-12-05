import React from "react";
import {
  NavLink,
  useNavigate,
  type NavLinkRenderProps,
} from "react-router-dom";

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

interface SideBarProps {
  role: "admin" | "user"; // บังคับว่าต้องส่งค่า 'admin' หรือ 'user' เท่านั้น
}

const UserItems: MenuItem[] = [
  { name: "หน้าหลัก", path: "/User", icon: "🏠" },
  { name: "โปรไฟล์", path: "/User/Profile", icon: "📊" },
  { name: "สะสมแต้ม", path: "/User/Reward", icon: "👤" },
  { name: "ข้อความ", path: "/User/Message", icon: "⚙️" },
  { name: "เพื่อน", path: "/User/Friends", icon: "👥" },
  { name: "ฟีด", path: "/User/Post", icon: "📊" },
  { name: "กลุ่ม", path: "/User/Group", icon: "📄" },
  { name: "รีวิว", path: "/User/Review", icon: "🔔" },
  { name: "โพล", path: "/User/Voting", icon: "📅" },
  { name: "ประชาสัมพันธ์", path: "/User/Announcement", icon: "💾" },
  { name: "รายงานปัญหา", path: "/User/Report", icon: "❓" },
];

const AdminItems: MenuItem[] = [
  { name: "หน้าหลัก", path: "/Admin", icon: "🏠" },
  { name: "จัดการผู้ใช้", path: "/Admin/ProfileManage", icon: "📊" },
  { name: "จัดการสะสมแต้ม", path: "/Admin/RewardManage", icon: "👤" },
  { name: "จัดการข้อความ", path: "/Admin/MessageManage", icon: "⚙️" },
  { name: "จัดการเพื่อน", path: "/Admin/FriendsManage", icon: "👥" },
  { name: "จัดการโพสต์", path: "/Admin/PostManage", icon: "📊" },
  { name: "จัดการกลุ่ม", path: "/Admin/GroupManage", icon: "📄" },
  { name: "จัดการรีวิว", path: "/Admin/ReviewManage", icon: "🔔" },
  { name: "จัดการโพล", path: "/Admin/VotingManage", icon: "📅" },
  { name: "จัดการประชาสัมพันธ์", path: "/Admin/AnnouncementManage", icon: "💾" },
  { name: "จัดการรายงานปัญหา", path: "/Admin/ReportManage", icon: "❓" },
];

const SideBar: React.FC<SideBarProps> = ({ role }) => {
  const navigate = useNavigate();
  const menuItems = role === 'admin' ? AdminItems : UserItems;
 const navLinkClass = ({ isActive }: NavLinkRenderProps): string =>
    `flex items-center space-x-3 p-3 rounded-xl transition duration-150 ease-in-out cursor-pointer
    ${isActive
      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;
  return (
    <div
      className="transition duration-300 ease-in-out bg-white/80 dark:bg-slate-900/80
    backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col
    relative z-10"
    >
      {/* LOGO */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 bd-gradient-to-r from-blue-600 to-purple-600 rounded-xl
          flex items-center justify-center shadow-lg"
          >
            <div className="w-6 h-6 text-white" />
            <span className="text-white text-xl">
              {role === "admin" ? "🛡️" : "🚀"}
            </span>
          </div>

          {/*ปกบน*/}
          <div>
            <h1 className="text-200 font-bold text-slate-800 dark:text-white">
              SUT
            </h1>
            <p className="text-200 font-bold text-slate-500 dark:text-white">
              User Panel
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="flex items-center space-x-3"></div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path} // ใช้ path เป็น key ก็ได้เพราะไม่ซ้ำกัน
            to={item.path}
            className={navLinkClass}
            end={item.path === "/Admin" || item.path === "/User"}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/*usreProfile ข้างล่าง*/}
      <div className="p-4 border-t border-slate-200/50">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
          <img
            src=""
            alt="user"
            className="w-10 h-10 rounded-full ring-2 ring-blue-500"
          />
          <div className="flex-1 min-w-0">
            <div className="fleex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">User</p>
              <p className="text-xs text-slate-500 truncate">Member</p>
            </div>
          </div>
        </div>
      </div>

      <div></div>
    </div>
  );
};

export default SideBar;
