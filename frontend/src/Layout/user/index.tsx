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
                className="transition-all duration-300 ease-in-out flex flex-col h-screen"
                style={{ paddingLeft: isCollapsed ? '80px' : '260px' }}
            >
                {/* Header - Full Width */}
                <div className="z-20 flex-none">
                    <Header
                        role="user"
                        username="User"
                        isCollapsed={isCollapsed}
                    />
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-2">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;