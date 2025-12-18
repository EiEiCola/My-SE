import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Home,
    AccountCircle,
    CardGiftcard,
    Forum,
    Group,
    BroadcastOnPersonal,
    Groups,
    Reviews,
    Campaign,
    InsertChartOutlined,
    ReportProblem,
    TableRows,
    ExpandMore,
    ExpandLess,
    ChevronRight
} from '@mui/icons-material';

interface SubMenuItem {
    name: string;
    path: string;
}

interface MenuItem {
    name: string;
    path?: string;
    icon: React.ReactNode;
    subItems?: SubMenuItem[];
}

interface SideBarProps {
    role: "admin" | "user";
    isCollapsed: boolean;
    onToggle: () => void;
}

const UserItems: MenuItem[] = [
    { name: "หน้าหลัก", path: "/User", icon: <Home /> },
    { name: "โปรไฟล์", path: "/User/Profile", icon: <AccountCircle /> },
    { name: "สะสมแต้ม", path: "/User/Reward", icon: <CardGiftcard /> },
    { name: "ข้อความ", path: "/User/Message", icon: <Forum /> },
    // เมนูเพื่อน (Friends) มี Path หลัก และ SubItems
    {
        name: "เพื่อน",
        path: "/User/Friends",
        icon: <Group />,
        subItems: [
            { name: "คำขอเป็นเพื่อน", path: "/User/Friends/Request" },
            { name: "เพื่อนแนะนำ", path: "/User/Friends/Popular" },
            { name: "เพื่อนทั้งหมด", path: "/User/Friends/FriendRelation" },
            { name: "วันเกิด", path: "/User/Friends/FriendBirthday" },
        ]
    },
    { name: "ฟีด", path: "/User/Post", icon: <BroadcastOnPersonal /> },
    { name: "กลุ่ม", path: "/User/Group", icon: <Groups /> },
    { name: "รีวิว", path: "/User/Review", icon: <Reviews /> },
    {
        name: "โพล",
        path: "/User/Polls",
        icon: <InsertChartOutlined />,
        subItems: [
            { name: "ฟีดโพล", path: "/User/Polls" },
            { name: "My Polls", path: "/User/Polls/my" },
        ]
    },
    { name: "ประชาสัมพันธ์", path: "/User/Announcement", icon: <Campaign /> },
    { name: "รายงานปัญหา", path: "/User/Report", icon: <ReportProblem /> },
];

const AdminItems: MenuItem[] = [
    { name: "หน้าหลัก", path: "/Admin", icon: <Home /> },
    { name: "จัดการผู้ใช้", path: "/Admin/ProfileManage", icon: <InsertChartOutlined /> },
    { name: "จัดการสะสมแต้ม", path: "/Admin/RewardManage", icon: <AccountCircle /> },
    { name: "จัดการข้อความ", path: "/Admin/MessageManage", icon: <Forum /> },
    { name: "จัดการเพื่อน", path: "/Admin/FriendsManage", icon: <Group /> },
    { name: "จัดการโพสต์", path: "/Admin/PostManage", icon: <BroadcastOnPersonal /> },
    { name: "จัดการกลุ่ม", path: "/Admin/GroupManage", icon: <Groups /> },
    { name: "จัดการรีวิว", path: "/Admin/ReviewManage", icon: <Reviews /> },
    { name: "จัดการโพล", path: "/Admin/Polls", icon: <InsertChartOutlined /> },
    { name: "จัดการประชาสัมพันธ์", path: "/Admin/AnnouncementManage", icon: <Campaign /> },
    { name: "จัดการรายงานปัญหา", path: "/Admin/ReportManage", icon: <ReportProblem /> },
];

const SideBar: React.FC<SideBarProps> = ({ role, isCollapsed, onToggle }) => {
    const menuItems = role === 'admin' ? AdminItems : UserItems;
    const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
    const location = useLocation();

    const toggleDropdown = (itemName: string) => {
        setOpenDropdowns(prev =>
            prev.includes(itemName)
                ? prev.filter(name => name !== itemName)
                : [...prev, itemName]
        );
    };

    // ตรวจสอบว่าเมนูหลัก (Parent) ควร Active/Highlighted หรือไม่
    const isParentActive = (item: MenuItem): boolean => {
        if (!item.path) return false;

        // 1. เช็คว่า Path หลัก Active ไหม (end: true สำหรับ path หลัก)
        if (item.path === location.pathname) return true;

        // 2. เช็คว่า SubItem Active ไหม (startsWith เพื่อรวมทุก path ย่อย)
        if (item.subItems) {
            return item.subItems.some(sub => location.pathname.startsWith(sub.path));
        }
        return false;
    };

    // ขยาย Dropdown อัตโนมัติ หาก URL ตรงกับเมนูย่อย เมื่อโหลดครั้งแรก
    useEffect(() => {
        menuItems.forEach(item => {
            if (item.subItems && isParentActive(item) && !openDropdowns.includes(item.name)) {
                setOpenDropdowns(prev => [...prev, item.name]);
            }
        });
    }, [location.pathname, role]);

    const isDropdownItem = (item: MenuItem) => !!item.subItems;

    // Class สำหรับ NavLink/ปุ่มเมนู
    const navLinkClass = (isActive: boolean, isParent: boolean): string =>
        `relative flex items-center p-2 rounded-xl transition duration-150 ease-in-out cursor-pointer group
        ${isCollapsed ? "justify-center" : "space-x-3"} 
        ${isActive || isParent // ไฮไลท์ถ้าเป็น Active หรือเป็น Parent ของ Active Subitem
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`;


    return (
        <div
            className={`h-screen transition-all duration-300 ease-in-out bg-white/80
            backdrop-blur-2xl border-b-0 border-l-0 border-r-1 border-t-0 border-slate-200/50 
            border-solid flex flex-col relative z-10 w-full`}
        >
            {/* LOGO */}
            <div className="py-5 px-3 border-b-1 border-l-0 border-r-0 border-t-0 border-slate-200/50 border-solid">
                <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
                    {!isCollapsed && (
                        <>
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 
                                rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                            >
                                <span className="text-white text-xl">
                                    {role === "admin" ? "A" : "U"}
                                </span>
                            </div>

                            <div className="flex flex-col flex-1">
                                <h1 className="text-base font-bold text-slate-800 whitespace-nowrap">
                                    SUT Community
                                </h1>
                                <p className="text-xs text-slate-500 whitespace-nowrap">
                                    {role === "admin" ? "Admin Panel" : "User Panel"}
                                </p>
                            </div>
                        </>
                    )}

                    <button
                        className="rounded-lg hover:bg-slate-100 p-2 flex-shrink-0 transition-colors"
                        onClick={onToggle}
                    >
                        <TableRows className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <div key={item.name}>

                        {isDropdownItem(item) && item.path ? (
                            // เมนู Dropdown ที่คลิกไปยัง Path หลักได้ (เช่น "เพื่อน")
                            <div className={`relative ${isCollapsed ? 'justify-center' : ''}`}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => navLinkClass(isActive, isParentActive(item))}
                                // end={true} ถูกนำออกเพื่อให้เมนูยัง Active อยู่เมื่ออยู่หน้าย่อยของมัน
                                // แต่ NavLink จะถูกไฮไลท์ด้วย isParentActive(item) แทน
                                >
                                    <span className={`text-xl ${isCollapsed ? "mx-auto" : ""}`}>{item.icon}</span>
                                    {!isCollapsed && <span className="font-medium text-sm flex-1">{item.name}</span>}

                                    {/* ปุ่มขยาย/ยุบ */}
                                    {!isCollapsed && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleDropdown(item.name);
                                            }}
                                            className="p-1 -mr-1 rounded-md hover:bg-blue-700/50 transition-colors flex-shrink-0"
                                            aria-label={`Toggle ${item.name}`}
                                        >
                                            {openDropdowns.includes(item.name) ? (
                                                <ExpandLess className="w-5 h-5" />
                                            ) : (
                                                <ExpandMore className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}

                                    {/* Tooltip for collapsed mode */}
                                    {isCollapsed && (
                                        <div className={`absolute left-full ml-3 px-3 py-1 bg-gray-800 
                                            text-white text-sm rounded-md opacity-0 invisible 
                                            group-hover:opacity-100 group-hover:visible 
                                            whitespace-nowrap z-50 pointer-events-none transition-all duration-200`}>
                                            {item.name}
                                        </div>
                                    )}
                                </NavLink>

                                {/* Dropdown Submenu */}
                                {!isCollapsed && openDropdowns.includes(item.name) && item.subItems && (
                                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                                        {item.subItems.map((subItem) => (
                                            <NavLink
                                                key={subItem.path}
                                                to={subItem.path}
                                                className={({ isActive }) =>
                                                    `flex items-center space-x-2 p-2 rounded-lg transition duration-150 ease-in-out text-sm
                                                    ${isActive
                                                        ? "bg-blue-100 text-blue-600 font-medium"
                                                        : "text-slate-600 hover:bg-slate-50"
                                                    }`
                                                }
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                                <span>{subItem.name}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Regular NavLink (เมนูที่ไม่มีเมนูย่อย)
                            <NavLink
                                to={item.path!}
                                className={({ isActive }) => navLinkClass(isActive, false)}
                                end={item.path === "/Admin" || item.path === "/User"}
                            >
                                <span className={`text-xl ${isCollapsed ? "mx-auto" : ""}`}>{item.icon}</span>

                                {!isCollapsed && <span className="font-medium text-sm flex-1">{item.name}</span>}

                                {isCollapsed && (
                                    <div className={`absolute left-full ml-3 px-3 py-1 bg-gray-800 
                                        text-white text-sm rounded-md opacity-0 invisible 
                                        group-hover:opacity-100 group-hover:visible 
                                        whitespace-nowrap z-50 pointer-events-none transition-all duration-200`}>
                                        {item.name}
                                    </div>
                                )}
                            </NavLink>
                        )}
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default SideBar;