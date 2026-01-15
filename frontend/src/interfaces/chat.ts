// src/interfaces/chat.ts

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  username: string;
  avatar?: string; // ตรวจสอบว่า Backend ส่ง key นี้มา หรือเป็น member_picture
  member_picture?: string; // Correct field from Backend
  student_id?: string;
  dob?: string;
}

export interface RoomMember {
  room_id: number;
  member_id: number;
  rm_role: string; // 'admin' | 'member'
  request_status?: 'pending' | 'accepted' | 'joined'; // สถานะคำเชิญ
  member?: User;
}

export interface Room {
  room_id: number;
  rc_type: string; // 'private' | 'group'
  rc_name: string;
  rc_url?: string; // รูปโปรไฟล์ห้อง/เพื่อน
  last_message?: string;
  last_sender_id?: number; // Added to support "You:" prefix
  last_sender_name?: string; // Added to support "Name:" prefix in groups
  unread_count?: number; // ✅ Added (Restore)
  updated_at?: string; // ใช้เรียงลำดับห้องล่าสุด
  created_at?: string; // วันที่สร้างห้อง
  created_by?: number; // ✅ ID คนสร้างห้อง (Restore: Required for TypeScript to access backend data)
  creator?: User; // ✅ Persisted Creator Info from Backend
  member?: RoomMember[]; // จำเป็นสำหรับเช็ค Online Status ในห้อง Private
}

export interface Attachment {
  id: number;
  message_id: number;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: string;
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
  sticker?: { // ✅ Sticker Info
    reward_picture: string;
    reward_name: string;
  };
  attachments?: Attachment[];
}

export interface WSMessage {
  type: string; // เช่น 'new_message', 'user_online'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any; // ใช้ any เพื่อรองรับ Payload หลายรูปแบบ (Message, UserID list ฯลฯ)
  room_id?: number;
  sender_id?: number;
}

export interface MemberReward {
  ID: number;
  reward_id: number;
  reward: {
    ID: number;
    reward_name: string;
    reward_picture: string;
  };
}