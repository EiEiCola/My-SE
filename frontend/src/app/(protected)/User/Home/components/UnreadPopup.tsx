import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { type Announcement, markAnnouncementRead } from "../../../../../services/http/announcementMember";

interface UnreadPopupProps {
    unreadAnnouncements: Announcement[];
    onClose: () => void;
}

const UnreadPopup: React.FC<UnreadPopupProps> = ({ unreadAnnouncements, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Safety check
    if (!unreadAnnouncements || unreadAnnouncements.length === 0) return null;

    const currentAnnouncement = unreadAnnouncements[currentIndex];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % unreadAnnouncements.length);
        setDontShowAgain(false);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + unreadAnnouncements.length) % unreadAnnouncements.length);
        setDontShowAgain(false);
    };

    const handleClose = async () => {
        if (dontShowAgain && currentAnnouncement) {
            try {
                await markAnnouncementRead(currentAnnouncement.id);
            } catch (e) {
                console.error("Failed to mark as read:", e);
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Navigation Arrows */}
                {unreadAnnouncements.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-48 -translate-y-1/2 z-20 p-2 bg-white/70 hover:bg-white text-gray-800 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 backdrop-blur-sm"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-48 -translate-y-1/2 z-20 p-2 bg-white/70 hover:bg-white text-gray-800 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 backdrop-blur-sm"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                    <X size={20} />
                </button>

                {/* Cover Image - Clickable */}
                <Link
                    to={`/User/Announcement/${currentAnnouncement.id}`}
                    onClick={onClose}
                    className="block relative group"
                >
                    {currentAnnouncement.media && currentAnnouncement.media.length > 0 ? (
                        <div className="h-96 w-full bg-gray-200 shrink-0">
                            <img
                                src={currentAnnouncement.media[0].url}
                                alt={currentAnnouncement.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full font-medium text-sm shadow-sm backdrop-blur">
                                    Click to read more
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-4xl">🎉</span>
                        </div>
                    )}
                </Link>

                {/* Content */}
                <div className="p-6 flex flex-col grow overflow-hidden bg-white">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 line-clamp-2">
                            {currentAnnouncement.title}
                        </h3>
                    </div>

                    <div className="text-gray-600 mb-6 overflow-y-auto grow leading-relaxed">
                        {currentAnnouncement.content}
                    </div>

                    {/* Don't Show Again */}
                    <div className="flex items-center gap-2 mb-4 shrink-0 pt-4 border-t border-gray-100">
                        <input
                            type="checkbox"
                            id="dontShow"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <label
                            htmlFor="dontShow"
                            className="text-sm text-gray-600 cursor-pointer select-none"
                        >
                            Don't show this again (ไม่ต้องแสดงอีก)
                        </label>
                    </div>

                    {/* Dots Indicator */}
                    {unreadAnnouncements.length > 1 && (
                        <div className="flex justify-center gap-1.5 mb-4">
                            {unreadAnnouncements.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-purple-600" : "w-1.5 bg-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnreadPopup;
