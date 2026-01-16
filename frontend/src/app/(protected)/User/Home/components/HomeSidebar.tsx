import React, { useMemo, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { friendAPI, type SuggestedFriendUI, getImageUrl } from "../../../../../services/http/friend";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Button } from "antd";

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
    const [popularMembers, setPopularMembers] = useState<any[]>([]);
    const [loadingPopular, setLoadingPopular] = useState(true);

    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const res = await friendAPI.getPopularMembers();
                if (res && res.data) {
                    setPopularMembers(res.data.slice(0, 5)); // Show top 5
                } else if (Array.isArray(res)) {
                    setPopularMembers(res.slice(0, 5));
                }
            } catch (err) {
                console.error("Failed to fetch popular members:", err);
            } finally {
                setLoadingPopular(false);
            }
        };
        fetchPopular();
    }, []);

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
        <div className="space-y-6">
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

            {/* Widget: Popular Members (Replaced Suggested Groups) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">แนะนำสำหรับคุณ</h3>
                    <Link to="/User/Friends/Popular" className="text-xs text-orange-500 hover:underline">
                        ดูทั้งหมด
                    </Link>
                </div>

                {loadingPopular ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div className="flex-1 h-3 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : popularMembers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">ไม่มีสมาชิกแนะนำ</p>
                ) : (
                    <div className="space-y-4">
                        {popularMembers.map((member) => (
                            <div key={member.ID || member.id} className="flex items-center gap-3">
                                <Avatar
                                    src={member.member_picture && member.member_picture !== "" ? getImageUrl(member.member_picture) : undefined}
                                    icon={<UserOutlined />}
                                    size={40}
                                    className="border border-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4
                                        className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-orange-500"
                                        onClick={() => navigate(`/User/Profile/${member.ID || member.id}`)}
                                    >
                                        {member.username || `${member.first_name} ${member.last_name}`}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {member.followers_count || 0} ผู้ติดตาม
                                    </p>
                                </div>
                                <Button
                                    size="small"
                                    className="text-xs"
                                    onClick={() => navigate(`/User/Profile/${member.ID || member.id}`)}
                                >
                                    ดู
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Links */}
            <div className="text-[11px] text-gray-400 px-2">
                <p>ความเป็นส่วนตัว · ข้อกำหนด · ลงโฆษณา · SUT Community © 2026</p>
            </div>
        </div>
    );
};

export default HomeSidebar;
