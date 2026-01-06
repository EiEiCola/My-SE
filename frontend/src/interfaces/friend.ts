// 1. ข้อมูลสมาชิก (ใช้ร่วมกันทั่วทั้งระบบ)
export interface Member {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_pic: string; // แนะนำให้ทำเป็น string เปล่าถ้าไม่มีรูป
  follower_count?: number;
}

// 2. ข้อมูลคำขอเป็นเพื่อน (Friend Request)
export interface FriendRequest {
  id: number;           // นี่คือ rf_id จาก Backend
  sent_member_id: number;
  receive_member_id: number;
  reques_status_id: number; // 1: Pending, 2: Accepted, 3: Rejected, 4: Cancelled
  created_at: string;
  updated_at: string;
  sent_member: Member;  // ข้อมูลคนที่ส่งมา (สำหรับหน้า Received)
}

// 3. ข้อมูลความสัมพันธ์ (Relation/Friendship)
export interface Relation {
  member1_id: number;
  member2_id: number;
  active: boolean;
  created_at: string;
  friend_info: Member; // ข้อมูลเพื่อนที่เราคุยด้วย
}

// 4. ข้อมูลการติดตาม (Follow)
export interface Follow {
  f_id: number;
  follower_id: number;
  followed_id: number;
  follow_status_id: number; // 1: Following, 2: Muted, 3: Unfollowed
  updated_at: string;
}

// 5. โครงสร้าง Response พื้นฐานจาก Go Backend
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}