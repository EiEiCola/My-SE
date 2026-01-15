// src/services/chatService.ts
import type { Room, Message } from '../../interfaces/chat';

const API_URL = "http://localhost:8080/api/member/chat";

const getHeaders = () => {
  const token = localStorage.getItem('token'); // ✅ ดึง Token จาก LocalStorage
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface CreateRoomPayload {
  type: 'private' | 'group';
  target_id?: number;      // สำหรับ Private
  group_name?: string;     // สำหรับ Group
  member_ids?: number[];   // สำหรับ Group
}

export const chatService = {
  getRooms: async (): Promise<{ data: Room[] }> => {
    const res = await fetch(`${API_URL}/rooms`, { headers: getHeaders() });
    return res.json();
  },

  getMessages: async (roomId: number): Promise<{ data: Message[] }> => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, { headers: getHeaders() });
    return res.json();
  },

  // createGroup: async (groupName: string, memberIds: number[]) => {
  //   const res = await fetch(`${API_URL}/rooms`, {
  //     method: 'POST',
  //     headers: getHeaders(),
  //     body: JSON.stringify({
  //       type: 'group',
  //       group_name: groupName,
  //       member_ids: memberIds // ส่งเป็น Array [1, 2, 3]
  //     })
  //   });
  //   return res.json();
  // },

// ✅ แก้ไข: ให้ createRoom รับ Payload Object ก้อนเดียว
  // เพื่อรองรับทั้ง Private และ Group ตามที่หน้า ChatPage.tsx เรียกใช้
  createRoom: async (payload: CreateRoomPayload) => {
    const res = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload) // ส่ง JSON ไปตรงๆ ให้ Backend
    });
    return res.json();
  },

  sendMessage: async (roomId: number, content: string, type: string = 'text') => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, type })
    });
    return res.json();
  },

  unsendMessage: async (messageId: number) => {
    const res = await fetch(`${API_URL}/messages/${messageId}`, { // ✅ แก้ path ให้ตรง routes
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  clearHistory: async (roomId: number) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/history`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  leaveRoom: async (roomId: number) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/leave`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};