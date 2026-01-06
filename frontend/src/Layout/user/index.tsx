import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../../components/SideBar";
import Header from "../../components/Header";

const AdminLayout: React.FC = () => {
    // Start collapsed by default, expand on hover
    const [isCollapsed, setIsCollapsed] = useState(true);

    const handleMouseEnter = () => {
        setIsCollapsed(false);
    };

    const handleMouseLeave = () => {
        setIsCollapsed(true);
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="min-h-screen relative">

            {/* Sidebar - Fixed Position with Auto-expand on Hover */}
            <div
                className="fixed left-0 top-0 h-full transition-all duration-300 ease-in-out z-30"
                style={{ width: isCollapsed ? '80px' : '260px' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <SideBar
                    role="user"
                    isCollapsed={isCollapsed}
                    onToggle={toggleSidebar}
                />
            </div>

            {/* Main Content Area with Dynamic Padding */}
            <div
                className="transition-all duration-300 ease-in-out"
                style={{ paddingLeft: isCollapsed ? '80px' : '260px' }}
            >
                {/* Header - Full Width ของพื้นที่ที่เหลือ */}
                <div className="sticky top-0 z-20">
                    <Header
                        role="user"
                        username="User"
                        isCollapsed={isCollapsed}
                    />
                </div>

                {/* Main Content */}
                <main className=" bg-slate-50 p-2 min-h-screen">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;