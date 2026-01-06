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

export const chatService = {
  getRooms: async (): Promise<{ data: Room[] }> => {
    const res = await fetch(`${API_URL}/rooms`, { headers: getHeaders() });
    return res.json();
  },

  getMessages: async (roomId: number): Promise<{ data: Message[] }> => {
    const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, { headers: getHeaders() });
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