import React, { useState } from "react";
import { ArrowLeft, Search, MoreHorizontal, MessageCircle, UserMinus, UserPlus } from "lucide-react";
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const FriendRelation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [friends] = useState([
    { id: 1, name: "Kanyanat Bunsing", mutualFriends: 4, avatar: "👩" },
    { id: 2, name: "Kruekrit Boonchan", mutualFriends: 27, avatar: "👨" },
    { id: 3, name: "ทินกิต์ชา ระเม็ยมดรม", mutualFriends: 2, avatar: "👤" },
    { id: 4, name: "Komsan Srivsut", mutualFriends: 6, avatar: "👔" },
    { id: 5, name: "Nanthawat Masa", mutualFriends: 73, avatar: "🧑" },
    { id: 6, name: "คนดรง", mutualFriends: 10, avatar: "👨‍💼" },
    { id: 7, name: "Khanathip Pawaphuchake", mutualFriends: 8, avatar: "⚽" },
    { id: 8, name: "คน ตรง", mutualFriends: 4, avatar: "🙋" },
    { id: 9, name: "Parichat Kiangthaisong", mutualFriends: 5, avatar: "👩‍💼" },
    { id: 10, name: "Kaew Bun", mutualFriends: 182, avatar: "💎" },
  ]);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMenu = (friendId) => {
    setActiveMenu(activeMenu === friendId ? null : friendId);
  };

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  return (
    <div className="flex h-screen bg-gray-100" onClick={handleClickOutside}>
      {/* Friends List Sidebar */}
      <div className="w-80 bg-white flex flex-col border-b-0 border-l-0 border-r-1
        border-t-0 border-slate-200/50 border-solid">
        {/* Header */}
        <div className="p-4 border-b-1 border-l-0 border-r-0
        border-t-0 border-slate-200/50 border-solid">
          <div className="flex items-center gap-3 mb-4">
            <button className="hover:bg-gray-100 rounded-full p-2 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">เพื่อนทั้งหมด</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาเพื่อน"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Friends Count */}
        <div className="px-4 py-3">
          <p className="text-sm text-gray-800">
            เพื่อน {filteredFriends.length} คน
          </p>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="relative flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                {friend.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate text-sm">
                  {friend.name}
                </h3>
                <p className="text-xs text-gray-500">
                  มีเพื่อนร่วมกัน {friend.mutualFriends} คน
                </p>
              </div>

              {/* More Button Container */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(friend.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full p-2 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {activeMenu === friend.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-10 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 w-64 z-50"
                  >
                    <button className="w-full px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition-colors text-left">
                      <MessageCircle className="w-5 h-5 text-gray-700" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          ส่งข้อความถึง {friend.name.split(' ')[0]}
                        </p>
                      </div>
                    </button>

                    <button className="w-full px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition-colors text-left">
                      <div className="w-5 h-5 flex items-center justify-center text-gray-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          เลิกติดตาม {friend.name.split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          หยุดดูเนื้อหาในฟีดของคุณ
                        </p>
                      </div>
                    </button>

                    <button className="w-full px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition-colors text-left">
                      <UserPlus className="w-5 h-5 text-gray-700" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          บล็อกโปรไฟล์ของ {friend.name.split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {friend.name.split(' ')[0]} จะไม่สามารถเห็นเนื้อหาของคุณ
                        </p>
                      </div>
                    </button>

                    <button className="w-full px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition-colors text-left">
                      <UserMinus className="w-5 h-5 text-gray-700" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          เลิกเป็นเพื่อนกับ {friend.name.split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          เลิกเป็นเพื่อนกับ {friend.name.split(' ')[0]}
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

{/* Empty State */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-white-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="relative">
              <PersonSearchIcon className="w-12 h-12 text-gray-400" sx={{ fontSize: 60}}/>
        
            </div>
          </div>
          <p className="text-gray-600 font-large text-xl">เลือกชื่อของผู้คนเพื่อพรีวิวโปรไฟล์</p>
        </div>
      </div>
    </div>
  );
};

export default FriendRelation;