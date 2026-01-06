import React, { useState, useEffect } from "react";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// ตั้งค่า DayJS
dayjs.locale('th');
dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface Friend {
  id: number;
  name: string;
  avatar: string;
  birthday: string;
  age: number;
}

interface BirthdayItem extends Friend {
  dateDisplay: string;
  daysDiff: number;
}

const FriendBirthday = () => {
  const navigate = useNavigate();
  const API_URL = "/api";
  const token = localStorage.getItem("token");

  // State
  const [recentBirthdays, setRecentBirthdays] = useState<BirthdayItem[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayItem[]>([]);
  const [activeMessages, setActiveMessages] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `${API_URL.replace("/api", "")}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchFriendsAndCalculate();
  }, []);

  const fetchFriendsAndCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/member/my/friends`, { headers });
      const data = await res.json();

      if (data.data && Array.isArray(data.data)) {
        const friends: Friend[] = data.data.map((m: any) => ({
          id: m.ID || m.id,
          name: `${m.first_name} ${m.last_name}`,
          avatar: getImageUrl(m.member_picture),
          birthday: m.dob || "",
          age: m.dob ? dayjs().diff(dayjs(m.dob), 'year') : 0
        }));

        processBirthdays(friends);
      }
    } catch (err) {
      console.error("Error fetching birthdays:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Logic การคำนวณวันเกิด
  // ----------------------------------------------------------------
  const processBirthdays = (friendsList: Friend[]) => {
    const today = dayjs().startOf('day');
    const currentYear = today.year();

    const processed = friendsList
      .filter(f => f.birthday && f.birthday !== "")
      .map(friend => {
        const birthDate = dayjs(friend.birthday);
        const thisYearBday = dayjs(`${currentYear}-${birthDate.format('MM-DD')}`);
        const diff = thisYearBday.diff(today, 'day');

        return {
          ...friend,
          dateDisplay: birthDate.locale('th').format('D MMMM'),
          daysDiff: diff,
        };
      });

    // 1. Recent (ผ่านไปแล้วไม่เกิน 30 วัน)
    const recent = processed
      .filter(p => p.daysDiff < 0 && p.daysDiff >= -30)
      .sort((a, b) => b.daysDiff - a.daysDiff);

    // 2. Upcoming (วันนี้ หรือ กำลังจะถึงใน 60 วัน)
    const upcoming = processed
      .filter(p => p.daysDiff >= 0 && p.daysDiff <= 60)
      .sort((a, b) => a.daysDiff - b.daysDiff);

    setRecentBirthdays(recent);
    setUpcomingBirthdays(upcoming);
  };

  const handleQuickMessage = (personId: number, msg: string) => {
    setActiveMessages(prev => ({ ...prev, [personId]: msg }));
  };

  const handleSendMessage = (personId: number) => {
    const msg = activeMessages[personId];
    if (msg) {
      alert(`ส่งข้อความ: "${msg}" ถึงเพื่อน ID: ${personId}`);
      setActiveMessages(prev => ({ ...prev, [personId]: "" }));
    } else {
      alert(`เปิดห้องแชทกับเพื่อน ID: ${personId}`);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">กำลังโหลดข้อมูลวันเกิด...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/User/Friends')}
              className="hover:bg-gray-200 rounded-full p-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">วันเกิด</h1>
          </div>

          {/* Recent Birthdays (วันเกิดที่ผ่านมาแล้ว) */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">วันเกิดเมื่อไม่นานมานี้</h2>

            {recentBirthdays.length === 0 ? (
              <div className="text-gray-400 text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                ไม่มีวันเกิดในช่วงที่ผ่านมา
              </div>
            ) : (
              <div className="space-y-4">
                {recentBirthdays.map((person) => (
                  <div key={person.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden border border-slate-100">
                        {/* ⭐ แสดงรูปภาพ */}
                        {person.avatar ? (
                          <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 truncate">{person.name}</h3>
                            <p className="text-sm text-gray-500">วันเกิด {person.dateDisplay}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-full">
                            เมื่อ {Math.abs(person.daysDiff)} วันที่แล้ว
                          </span>
                        </div>
                        <p className="text-xs text-orange-500 mt-1 font-medium">อายุครบ {person.age} ปี</p>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div>
                      <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                        <input
                          type="text"
                          placeholder={`อวยพรวันเกิดย้อนหลังให้ ${person.name.split(' ')[0]}...`}
                          value={activeMessages[person.id] || ""}
                          onChange={(e) => handleQuickMessage(person.id, e.target.value)}
                          className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                        />
                        <button className="hover:bg-gray-200 rounded-full p-1.5 transition-colors">
                          <Smile className="w-5 h-5 text-gray-400 hover:text-orange-500" />
                        </button>
                        <button
                          onClick={() => handleSendMessage(person.id)}
                          className="bg-orange-500 hover:bg-orange-600 rounded-full p-2 transition-colors shadow-sm"
                        >
                          <Send className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Birthdays (วันเกิดที่กำลังจะถึง) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-gray-800">วันเกิดที่กำลังมาถึง</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingBirthdays.length === 0 ? (
                <p className="text-gray-400 text-center py-10">ไม่มีวันเกิดเร็วๆ นี้</p>
              ) : (
                upcomingBirthdays.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-5 hover:bg-orange-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden border border-slate-100">
                        {/* ⭐ แสดงรูปภาพ */}
                        {person.avatar ? (
                          <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{person.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">{person.dateDisplay}</p>
                          {person.daysDiff === 0 ? (
                            <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
                              วันนี้!
                            </span>
                          ) : (
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                              อีก {person.daysDiff} วัน
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">จะอายุครบ {person.age} ปี</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendMessage(person.id)}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all font-medium text-sm ml-4"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">ส่งข้อความ</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
};

export default FriendBirthday;