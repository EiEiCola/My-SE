// src/services/chatService.ts
import type { Room, Message } from '../../interfaces/chat';

const API_URL = "/api/member/chat";

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

  sendMessage: async (roomId: number, content: string, type: string = 'text', stickerId?: number, attachments?: any[]) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, type, sticker_id: stickerId, attachments })
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
  },

  joinGroup: async (roomId: number) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  markRead: async (roomId: number) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  // ✅ New Methods for Group Management
  uploadImage: async (file: File, type: 'group' | 'image' | 'file' = 'group') => {
    const formData = new FormData();
    formData.append('file', file);
    // Note: Upload endpoint is /api/member/upload, not under /chat
    // Assuming API_URL is http://localhost:8080/api/member/chat
    // We need to go up one level to /api/member
    const uploadUrl = API_URL.replace('/chat', `/upload?type=${type}`);

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        // Content-Type: multipart/form-data is set automatically by browser
      },
      body: formData
    });
    return res.json();
  },

  updateGroup: async (roomId: number, payload: { name: string; avatar_url?: string }) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  inviteMembers: async (roomId: number, memberIds: number[]) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ member_ids: memberIds })
    });
    return res.json();
  },

  removeMember: async (roomId: number, memberId: number) => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/members/${memberId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  updateMemberRole: async (roomId: number, memberId: number, role: 'admin' | 'member') => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/members/${memberId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  getMyStickers: async () => {
    const res = await fetch(`${API_URL}/stickers`, { headers: getHeaders() });
    return res.json();
  }
};