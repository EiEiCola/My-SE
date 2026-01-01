import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { type Announcement } from "../../../../../services/http/announcementMember";

interface AnnouncementSectionProps {
    publishedAnnouncements: Announcement[];
}

const AnnouncementSection: React.FC<AnnouncementSectionProps> = ({
    publishedAnnouncements,
}) => {
    return (
        <section className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        ข่าวประชาสัมพันธ์
                    </h2>
                </div>
                <Link
                    to="/User/Announcement"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                >
                    ดูทั้งหมด
                </Link>
            </div>

            {publishedAnnouncements.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">📭</span>
                    </div>
                    <h3 className="text-gray-900 font-medium text-sm">ไม่มีประกาศในขณะนี้</h3>
                </div>
            ) : (
                <div className="relative group/slider">
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {publishedAnnouncements.map((ann, index) => {
                            const cover =
                                ann.media?.find((m) => m.type === "image" || true)?.url || "";
                            return (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                    className="flex-none w-[200px] snap-start"
                                >
                                    <Link
                                        to={`/User/Announcement/${ann.id}`}
                                        className="block relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-gray-200 cursor-pointer group"
                                    >
                                        {cover ? (
                                            <img
                                                src={cover}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                alt={ann.title}
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        "https://via.placeholder.com/300x400?text=No+Image";
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                <span className="text-xs">No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                    </Link>
                                    <div className="mt-2 px-1">
                                        <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors text-sm">
                                            {ann.title}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {new Date(
                                                ann.publish_start_at || Date.now()
                                            ).toLocaleDateString("th-TH")}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div className="w-2 flex-none" />
                    </div>
                </div>
            )}
        </section>
    );
};

export default AnnouncementSection;
