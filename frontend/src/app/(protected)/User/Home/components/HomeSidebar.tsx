import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Post {
    ID: number;
    MainCategory?: { ID: number; title: string };
    [key: string]: any;
}

interface HomeSidebarProps {
    posts?: Post[];
}

const HomeSidebar: React.FC<HomeSidebarProps> = ({ posts = [] }) => {
    const navigate = useNavigate();

    // Calculate top 5 categories by post count
    const trendingCategories = useMemo(() => {
        const categoryCount: Record<string, { id: number; title: string; count: number }> = {};

        posts.forEach((post) => {
            if (post.MainCategory) {
                const key = post.MainCategory.ID.toString();
                if (categoryCount[key]) {
                    categoryCount[key].count++;
                } else {
                    categoryCount[key] = {
                        id: post.MainCategory.ID,
                        title: post.MainCategory.title,
                        count: 1,
                    };
                }
            }
        });

        return Object.values(categoryCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [posts]);

    return (
        <div className="lg:col-span-3 space-y-6">
            {/* Widget: Trending Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🔥 หมวดหมู่ที่กำลังมาแรง
                </h3>
                {trendingCategories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
                ) : (
                    <ul className="space-y-3">
                        {trendingCategories.map((category, index) => (
                            <li
                                key={category.id}
                                onClick={() => navigate(`/User/Group?category=${category.id}`)}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <span
                                    className={`font-bold text-sm w-6 h-6 flex items-center justify-center rounded-full ${index < 3
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {index + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                                        {category.title}
                                    </p>
                                    <p className="text-[10px] text-gray-400">{category.count} โพสต์</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
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
