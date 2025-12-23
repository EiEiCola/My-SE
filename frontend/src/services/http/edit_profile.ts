import api from "./api";

export type MemberProfileResponse = {
  username?: string;
  bio?: string;
  dob?: string;
  gender?: string;
  gender_id?: number;
  member_picture?: string;
  email?: string;
  student_id?: string;
  first_name?: string;
  last_name?: string;
  national_id?: string;
};

export type UpdateMemberProfilePayload = {
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  dob: string; // YYYY-MM-DD
  gender_id: number;
  member_picture: string;
};

export const editProfileAPI = {
  // ✅ ใช้ endpoint ที่เป็น protected: /api/member/me
  // จะดึง user จาก token ไม่ต้องส่ง accountId
  getMe: () => api.get<MemberProfileResponse>(`/member/me`),

  // ✅ update profile ของตัวเอง
  updateMe: (payload: UpdateMemberProfilePayload) =>
    api.put(`/member/me`, payload),
};
