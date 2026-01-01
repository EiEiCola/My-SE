import React from "react";
import { Link } from "react-router-dom";

const HomeSidebar: React.FC = () => {
    return (
        <div className="lg:col-span-3 space-y-6">
            {/* Widget: Trending */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🔥 กำลังมาแรง
                </h3>
                <ul className="space-y-3">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <li key={item} className="flex items-center gap-3 cursor-pointer group">
                            <span className="text-gray-400 font-medium text-sm w-4 text-center">
                                #{item}
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                    SUT_GameJam
                                </p>
                                <p className="text-[10px] text-gray-400">2.4k โพสต์</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Widget: Suggested Groups */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4">กลุ่มแนะนำ</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200" />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                    ชมรมดนตรี
                                </h4>
                                <p className="text-xs text-gray-500">สมาชิก 1.2k คน</p>
                            </div>
                            <button className="text-blue-600 text-xs font-semibold hover:bg-blue-50 px-2 py-1 rounded">
                                Join
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Links */}
            <div className="text-[11px] text-gray-400 px-2">
                <p>ความเป็นส่วนตัว · ข้อกำหนด · ลงโฆษณา · SUT Community © 2026</p>
            </div>
        </div>
    );
};

export default HomeSidebar;
