import React, { useState } from "react";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { useNavigate } from 'react-router-dom'

const FriendBirthday = () => {
  const [message, setMessage] = useState("");
  const [activeMessages, setActiveMessages] = useState({});
  

  const recentBirthdays = [
    {
      id: 1,
      name: "Bma Akt",
      date: "13 ธันวาคม 2003",
      daysAgo: 22,
      avatar: "👩",
      quickMessages: [
        "สุขสันต์วันเกิด! 🙏☕",
        "ขอให้เป็นอีกปีที่ยอดเยี่ยมในชีวิต! 🌟🎉😝",
        "คุณควรกับการเฉลิมฉลอง สุขสันต์วันเกิด!! 🎂🎁🎊"
      ]
    },
    {
      id: 2,
      name: "พล เว็นเว้อ",
      date: "13 ธันวาคม 1995",
      daysAgo: 30,
      avatar: "🐶",
      quickMessages: [
        "สุขสันต์วันเกิด! ขอให้วันนี้เป็นวันที่วิเศษ! 👨‍👩‍👧🌟",
        "ขอให้เป็นวันเกิดที่สนุกนะ! 🎊❤️",
        "สุขสันต์วันเกิด! ขอให้มีความสุข! 🎉😸🙏"
      ]
    },
    {
      id: 3,
      name: "คน ไร้นาม",
      date: "13 ธันวาคม 1979",
      daysAgo: 46,
      avatar: "👤",
      quickMessages: [
        "ขอให้เป็นวันเกิดที่สนุกนะ! 😝🙏🎊",
        "สุขสันต์วันเกิด ขอให้มีแต่สิ่งดีๆ เข้ามานะ 👨‍👩‍👧😸🌹"
      ]
    }
  ];

  const upcomingBirthdays = [
    { id: 2, name: "Theerawut Nanthawan", date: "16 ธันวาคม 1994", days: 31, avatar: "👨" },
    { id: 3, name: "RC Ratchai", date: "16 ธันวาคม 2000", days: 25, avatar: "👔" },
    { id: 4, name: "Savita Phunsap", date: "16 ธันวาคม 1994", days: 31, avatar: "👩" },
    { id: 5, name: "Sasinan Anan", date: "16 ธันวาคม 2004", days: 21, avatar: "🧑" },
    { id: 6, name: "ทีราคณ นันทวรรณ", date: "16 ธันวาคม 1996", days: 29, avatar: "👤" },
    { id: 7, name: "รักคม นางคน", date: "16 ธันวาคม 1997", days: 28, avatar: "👨‍💼" },
    { id: 8, name: "ธีราคณ นันทวรรณ", date: "16 ธันวาคม 1997", days: 28, avatar: "😊" },
  ];

  const handleQuickMessage = (personId, msg) => {
    setActiveMessages(prev => ({
      ...prev,
      [personId]: msg
    }));
  };

  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button className="hover:bg-gray-200 rounded-full p-2 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700" onClick={() => navigate('/User/Friends')}/>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">วันเกิด</h1>
          </div>

          {/* Recent Birthdays */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">วันเกิดเมื่อไม่นานมานี้</h2>
            
            <div className="space-y-4">
              {recentBirthdays.map((person) => (
                <div key={person.id} className="bg-white rounded-2xl shadow-md p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                      {person.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{person.name}</h3>
                          <p className="text-sm text-gray-500">{person.date}</p>
                        </div>
                        <span className="text-sm text-gray-400">{person.daysAgo} ปี</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="mb-3">
                    <div className="flex gap-2 items-center bg-gray-100 rounded-full px-4 py-2.5">
                      <input
                        type="text"
                        placeholder={`สุขสันต์วันเกิด ${person.name.split(' ')[0]}! 🎁🎉💝`}
                        value={activeMessages[person.id] || ""}
                        onChange={(e) => handleQuickMessage(person.id, e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm"
                      />
                      <button className="hover:bg-gray-200 rounded-full p-1.5 transition-colors">
                        <Smile className="w-5 h-5 text-gray-500" />
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors">
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Message Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {person.quickMessages.map((msg, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickMessage(person.id, msg)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Birthdays */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">วันเกิดที่กำลังมาถึง</h2>
            </div>

            <div className="divide-y">
              {upcomingBirthdays.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                      {person.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{person.name}</h3>
                      <p className="text-xs text-gray-500">{person.date} · {person.days} ปี</p>
                    </div>
                  </div>

                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-sm font-medium">ส่งข้อความ</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendBirthday;