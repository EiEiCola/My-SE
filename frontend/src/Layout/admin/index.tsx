import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../../components/SideBar";
import Header from "../../components/Header";

const AdminLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };
    
    return (
        <div className="min-h-screen relative">
            
            {/* Sidebar - Fixed Position */}
            <div 
                className="fixed left-0 top-0 h-full transition-all duration-300 ease-in-out z-30"
                style={{ width: isCollapsed ? '80px' : '260px' }}
            >
                <SideBar 
                    role="admin" 
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
                        role="admin" 
                        username="Admin" 
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