import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, MoreVertical, Paperclip, Image as ImageIcon, Smile, Send, FileText, Trash2, Ban } from 'lucide-react';

// --- 1. Types (ต้องตรงกับ JSON ของ Go Backend) ---

interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  member_picture?: string;
}

interface Room {
  room_id: number;
  name: string; // ชื่อกลุ่ม หรือ ชื่อเพื่อน
  type: string; // 'private' | 'group'
  avatar_url?: string;
  last_message?: string; // (Optional: ถ้า Backend ส่งมา)
  unread_count?: number; // (Optional)
}

interface Message {
  message_id: number;
  room_id: number;
  sender_id: number;
  content: string;
  type_message: string; // 'text', 'image', 'file', 'sticker'
  sticker_id?: number;
  sent_at: string;
  is_deleted?: boolean;
  sender?: User; // Preloaded sender info
}

// --- 2. Main Component ---

const ChatPage: React.FC = () => {
  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
// --- Configuration ---
  const API_BASE = "http://localhost:8888/api/member/chat"; // ✅ Port 8888
  const WS_URL = "ws://localhost:8888/api/member/chat/ws";  // ✅ Port 8888
  
  // ⚠️ ใส่ Token ของคุณที่นี่ (หรือดึงจาก LocalStorage)
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlIjoibWVtYmVyIiwiZXhwIjoxNzY2NjM5NDE1LCJpYXQiOjE3NjY1NTMwMTV9.moCM2_oyq0Wnt2pYri75uframkWkzw_BybC1Pk-K6dw"; 
  const myUserID = 4; // ⚠️ ใส่ User ID ของตัวเองให้ตรงกับ Token

  // Refs
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 3. Connect Backend Logic ---

  // 3.1 Fetch Rooms (โหลดรายการห้อง)
  useEffect(() => {
    fetch('http://localhost:8080/api/member/chat/rooms', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.data) setRooms(data.data);
    })
    .catch(err => console.error("Load rooms failed:", err));
  }, []);

  // 3.2 WebSocket Connection (Real-time)
  useEffect(() => {
    if (!token) return;

    // ต่อ Socket ไปที่ Backend
    // ✅ ใช้ WS_URL (8888) และส่ง token ทาง Query Param
    const socketUrl = `${WS_URL}?token=${token}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => console.log("WS Connected");
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // กรณีมีข้อความใหม่เข้ามา
      if (data.type === 'message') {
        const newMsg = data.payload as Message;
        // ถ้าเป็นห้องที่เปิดอยู่ ให้เพิ่มข้อความเลย
        if (currentRoom && newMsg.room_id === currentRoom.room_id) {
          setMessages(prev => [...prev, newMsg]);
        }
        // TODO: อัปเดต last_message ใน list rooms ด้านซ้ายด้วย
      }
      
      // กรณี Unsend (message_update)
      if (data.type === 'message_update') {
         const updatedMsg = data.payload as Message;
         setMessages(prev => prev.map(m => 
            m.message_id === updatedMsg.message_id ? updatedMsg : m
         ));
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [token, currentRoom]); // Re-check logic เมื่อ currentRoom เปลี่ยน

  // 3.3 Load Chat History เมื่อเลือกห้อง
  useEffect(() => {
    if (!currentRoom) return;
    
    fetch(`${API_BASE}/rooms/${currentRoom.room_id}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.data) setMessages(data.data); // data.data คือ array ของ messages
    });
  }, [currentRoom]);

  // 3.4 Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3.5 Send Message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentRoom) return;

    try {
      // ยิง REST API ตามที่คุยกัน (Backend จะ Broadcast ผ่าน WS ให้เอง)
     const res = await fetch(`${API_BASE}/rooms/${currentRoom.room_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: inputText,
          type: 'text',
          // sticker_id: ... (ถ้ามี)
        })
      });

      if (res.ok) {
        setInputText('');
      }
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  // 3.6 Unsend Message
  const handleUnsend = async (msgId: number) => {
      // เรียก API Unsend ที่ทำไว้
      // fetch(...)
      console.log("Unsend message:", msgId);
  }

  // --- 4. Render UI (ตาม Screenshot) ---

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">


      {/* ⬜ Contact List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">ข้อความ</h1>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหา"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {rooms.map((room) => (
            <div
              key={room.room_id}
              onClick={() => setCurrentRoom(room)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all ${
                currentRoom?.room_id === room.room_id ? 'bg-orange-50 border-r-4 border-orange-400' : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                   {/* Avatar */}
                   {room.avatar_url ? <img src={room.avatar_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-300"/>}
                </div>
                {/* Online Status (สมมติ) */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                  <span className="text-xs text-gray-400">18:00 น.</span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                   {room.last_message || "ส่งข้อความ ..."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟦 Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white relative">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div>
                  <h2 className="font-bold text-gray-800">{currentRoom.name}</h2>
                  <p className="text-xs text-gray-500">Active now</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 {/* ปุ่มตาม UI Screenshot */}
                 <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full transition shadow-sm">
                    สวัสดี สมชาย ใจดี
                 </button>
                 <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full transition shadow-sm">
                    ทำอะไรอยู่
                 </button>
                 <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full transition shadow-sm">
                    โอเค
                 </button>
                 <div className="h-6 w-px bg-gray-300 mx-2"></div>
                 <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <Trash2 className="w-5 h-5" />
                 </button>
                 <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
              
              {/* Profile Summary (Top of chat) */}
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                 <div className="w-24 h-24 bg-gray-200 rounded-full mb-3"></div>
                 <h3 className="text-xl font-bold text-gray-800">{currentRoom.name}</h3>
                 <p className="text-sm text-gray-500">SUT Community Member</p>
              </div>

              {/* Message List */}
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isMe = msg.sender_id === myUserID;
                  return (
                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                       {/* Avatar เพื่อน */}
                       {!isMe && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 self-end mb-1"></div>
                       )}

                      <div className="flex flex-col max-w-[70%]">
                        {/* Bubble */}
                        <div className={`px-4 py-2 break-words text-sm shadow-sm ${
                          isMe 
                            ? 'bg-[#0084FF] text-white rounded-2xl rounded-br-sm' 
                            : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
                        }`}>
                          {/* จัดการ Type ต่างๆ */}
                          {msg.is_deleted ? (
                             <span className="italic opacity-70 text-xs">ข้อความถูกยกเลิก</span>
                          ) : msg.type_message === 'text' ? (
                             msg.content
                          ) : msg.type_message === 'file' ? (
                             <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4"/>
                                <span className="underline cursor-pointer">{msg.content}</span>
                             </div>
                          ) : (
                             msg.content
                          )}
                        </div>
                        
                        {/* Time & Status */}
                        <div className={`text-[10px] text-gray-400 mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                           {/* Unsend Button (Show on hover) */}
                           {isMe && !msg.is_deleted && (
                              <button onClick={() => handleUnsend(msg.message_id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 mr-2">Unsend</button>
                           )}
                           {new Date(msg.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           {isMe && <span>· ส่งแล้ว</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
               {/* ส่วน File Upload (ถ้า user ลากไฟล์มาวาง) สามารถทำ Overlay ได้ */}
               
               <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                  <button className="text-gray-400 hover:text-gray-600 transition">
                     <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition">
                     <ImageIcon className="w-5 h-5" />
                  </button>
                  
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Aa"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400"
                  />
                  
                  <button className="text-gray-400 hover:text-gray-600 transition">
                     <Smile className="w-5 h-5" />
                  </button>
                  
                  {inputText.trim() && (
                    <button onClick={handleSendMessage} className="text-blue-500 hover:text-blue-600 transition">
                       <Send className="w-5 h-5" />
                    </button>
                  )}
               </div>
            </div>

          </>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-300">
            <MessageCircle className="w-24 h-24 mb-4 opacity-20" />
            <h2 className="text-xl font-semibold text-gray-400">ข้อความของคุณ</h2>
            <p className="text-sm">ส่งรูปภาพหรือข้อความส่วนตัวกับเพื่อนหรือกลุ่ม</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;