// src/interfaces/chat.ts

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  username: string;
  avatar?: string; // ตรวจสอบว่า Backend ส่ง key นี้มา หรือเป็น member_picture
}

export interface RoomMember {
  room_id: number;
  member_id: number;
  rm_role: string; // 'admin' | 'member'
  member?: User;
}

export interface Room {
  room_id: number;
  rc_type: string; // 'private' | 'group'
  rc_name: string;
  rc_url?: string; // รูปโปรไฟล์ห้อง/เพื่อน
  last_message?: string;
  updated_at?: string; // ใช้เรียงลำดับห้องล่าสุด
  member?: RoomMember[]; // จำเป็นสำหรับเช็ค Online Status ในห้อง Private
}

export interface Message {
  message_id: number;
  room_id: number;
  sender_id: number;
  content: string;
  type_message: string; // 'text', 'image', 'file', 'sticker'
  sticker_id?: number;
  sent_at: string;
  is_deleted?: boolean;
  sender?: User; // ข้อมูลผู้ส่ง (Preload มาจาก Backend)
}

export interface WSMessage {
  type: string; // เช่น 'new_message', 'user_online'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any; // ใช้ any เพื่อรองรับ Payload หลายรูปแบบ (Message, UserID list ฯลฯ)
  room_id?: number;
  sender_id?: number;
}