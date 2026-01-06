import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Search, MoreVertical, Paperclip, Image as ImageIcon, 
  Smile, Send, FileText, Trash2, LogOut, Eraser 
} from 'lucide-react';
import type { Room, Message, WSMessage } from '../../../../interfaces/chat'; // ตรวจสอบ Path ให้ถูกต้อง
import { chatService } from '../../../../services/http/chat_service'; // ตรวจสอบ Path ให้ถูกต้อง

const ChatPage: React.FC = () => {
  // --- State ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // สถานะ Online Users
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  
  // Dropdown Menu
  const [showMenu, setShowMenu] = useState(false);

  // --- Refs ---
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 🔥 สำคัญ: ใช้ Ref เพื่อแก้ปัญหา Closure ใน WebSocket (เพื่อให้ onmessage อ่านค่าห้องปัจจุบันได้โดยไม่ต้อง reconnect)
  const activeRoomIdRef = useRef<number | null>(null);

  // --- Config ---
  const WS_URL = "ws://localhost:8080/api/member/chat/ws";
  const token = localStorage.getItem('token') || ""; 
  // ⚠️ ID ของเรา: ต้องมั่นใจว่าตอน Login ได้ set item 'my_user_id' ไว้แล้ว
  const myUserID = Number(localStorage.getItem('my_user_id') || 0); 

  // --- 1. Effects ---

  // Update Active Room Ref
  useEffect(() => {
    activeRoomIdRef.current = currentRoom?.room_id || null;
  }, [currentRoom]);

  // Initial Load Rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await chatService.getRooms();
        if (res.data) setRooms(res.data);
      } catch (err) {
        console.error("Failed to load rooms", err);
      }
    };
    loadRooms();
  }, []);

  // WebSocket Connection (Run Once)
  useEffect(() => {
    if (!token) return;

    ws.current = new WebSocket(`${WS_URL}?token=${token}`);

    ws.current.onopen = () => console.log("✅ WS Connected");
    
    ws.current.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'new_message':
            const newMsg = msg.payload as Message;
            // ใช้ Ref เช็คว่าเปิดห้องนั้นอยู่ไหม
            if (activeRoomIdRef.current === newMsg.room_id) {
              setMessages((prev) => [...prev, newMsg]);
            }
            // อัปเดตข้อความล่าสุดใน Sidebar
            updateLastMessage(newMsg.room_id, newMsg.content);
            break;

          case 'message_update': // กรณี Unsend
            const updatedMsg = msg.payload as Message;
            // อัปเดตข้อความในห้องปัจจุบันถ้าตรงกัน
            if (activeRoomIdRef.current === updatedMsg.room_id) {
               setMessages((prev) => prev.map(m => m.message_id === updatedMsg.message_id ? updatedMsg : m));
            }
            // อาจจะอัปเดต Sidebar ด้วยถ้าเป็นข้อความล่าสุด (Optional)
            break;

          case 'online_users': 
            setOnlineUsers(new Set(msg.payload as number[]));
            break;

          case 'user_online': 
            setOnlineUsers((prev) => new Set(prev).add(msg.payload as number));
            break;

          case 'user_offline': 
            setOnlineUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(msg.payload as number);
              return newSet;
            });
            break;
        }
      } catch (error) {
        console.error("WS Error:", error);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [token]);

  // Load Messages when room changes
  useEffect(() => {
    if (!currentRoom) return;
    
    setMessages([]); // เคลียร์ข้อความเก่าก่อน
    setShowMenu(false); // ปิดเมนู
    
    chatService.getMessages(currentRoom.room_id).then(res => {
      if (res.data) setMessages(res.data);
    });
  }, [currentRoom]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Functions ---

  const updateLastMessage = (roomId: number, text: string) => {
    setRooms(prev => prev.map(r => r.room_id === roomId ? { ...r, last_message: text } : r));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentRoom) return;
    try {
      await chatService.sendMessage(currentRoom.room_id, inputText);
      setInputText('');
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  const handleUnsend = async (msgId: number) => {
    if (!confirm("ต้องการยกเลิกข้อความนี้ใช่ไหม?")) return;
    try {
      await chatService.unsendMessage(msgId);
    } catch (err) {
      console.error("Unsend failed", err);
    }
  };

  const handleClearHistory = async () => {
    if (!currentRoom || !confirm("ต้องการล้างประวัติการแชทใช่ไหม? (ข้อความจะหายไปเฉพาะฝั่งคุณ)")) return;
    try {
      await chatService.clearHistory(currentRoom.room_id);
      setMessages([]); 
      setShowMenu(false);
    } catch (err) {
      console.error("Clear failed", err);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom || !confirm("ต้องการออกจากกลุ่มนี้ใช่ไหม?")) return;
    try {
      await chatService.leaveRoom(currentRoom.room_id);
      setRooms(prev => prev.filter(r => r.room_id !== currentRoom.room_id));
      setCurrentRoom(null);
    } catch (err) {
      console.error("Leave failed", err);
    }
  };

  const isPrivatePartnerOnline = (room: Room) => {
    if (room.rc_type !== 'private' || !room.member) return false;
    const partner = room.member.find(m => m.member_id !== myUserID);
    return partner ? onlineUsers.has(partner.member_id) : false;
  };

  // --- Render ---

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* ⬜ Sidebar: Room List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800 mb-4">ข้อความ</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหา"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <div
              key={room.room_id}
              onClick={() => setCurrentRoom(room)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all ${
                currentRoom?.room_id === room.room_id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                   {/* Handle Image Error */}
                   <img 
                      src={room.rc_url || ""} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gray-300'); // Fallback color
                      }}
                   />
                </div>
                {/* 🟢 Online Status */}
                {isPrivatePartnerOnline(room) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-900 truncate">{room.rc_name}</h3>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {room.last_message || "ไม่มีข้อความล่าสุด"}
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
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm z-10 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                   <img 
                      src={currentRoom.rc_url || ""} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gray-300');
                      }}
                   />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{currentRoom.rc_name}</h2>
                  {currentRoom.rc_type === 'private' && isPrivatePartnerOnline(currentRoom) && (
                      <p className="text-xs text-green-500 font-medium">Online</p>
                  )}
                </div>
              </div>
              
              <div className="relative">
                 <button 
                    onClick={() => setShowMenu(!showMenu)} 
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                 >
                    <MoreVertical className="w-5 h-5" />
                 </button>

                 {/* Dropdown Menu */}
                 {showMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-white shadow-lg rounded-lg border border-gray-100 py-1 z-50">
                        <button 
                            onClick={handleClearHistory}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Eraser className="w-4 h-4"/> ล้างประวัติแชท
                        </button>
                        {currentRoom.rc_type === 'group' && (
                            <button 
                                onClick={handleLeaveRoom}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4"/> ออกจากกลุ่ม
                            </button>
                        )}
                    </div>
                 )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
              <div className="space-y-2">
                {messages.map((msg, index) => {
                  const isMe = msg.sender_id === myUserID;
                  return (
                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      
                      {!isMe && (
                         <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 self-end mb-1 overflow-hidden">
                            {msg.sender?.avatar && (
                                <img 
                                    src={msg.sender.avatar} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            )}
                         </div>
                      )}

                      <div className="flex flex-col max-w-[70%]">
                        <div className={`px-4 py-2 break-words text-sm shadow-sm relative ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-100'
                        }`}>
                          {msg.is_deleted ? (
                             <span className="italic opacity-60 flex items-center gap-1">
                                <Trash2 className="w-3 h-3"/> ข้อความถูกยกเลิก
                             </span>
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
                        
                        <div className={`text-[10px] text-gray-400 mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                           {/* ปุ่ม Unsend */}
                           {isMe && !msg.is_deleted && (
                              <button 
                                onClick={() => handleUnsend(msg.message_id)} 
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 mr-2 transition-opacity"
                              >
                                Unsend
                              </button>
                           )}
                           {new Date(msg.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
               <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <button className="text-gray-400 hover:text-gray-600 transition"><Paperclip className="w-5 h-5" /></button>
                  <button className="text-gray-400 hover:text-gray-600 transition"><ImageIcon className="w-5 h-5" /></button>
                  
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 outline-none"
                  />
                  
                  <button className="text-gray-400 hover:text-gray-600 transition"><Smile className="w-5 h-5" /></button>
                  
                  {inputText.trim() && (
                    <button onClick={handleSendMessage} className="text-blue-500 hover:text-blue-600 transition scale-100 hover:scale-110">
                       <Send className="w-5 h-5" />
                    </button>
                  )}
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-300">
            <MessageCircle className="w-24 h-24 mb-4 opacity-10" />
            <h2 className="text-lg font-medium text-gray-400">เลือกห้องสนทนาเพื่อเริ่มคุย</h2>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;