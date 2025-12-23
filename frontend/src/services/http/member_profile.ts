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
};

export type UpdateMemberProfilePayload = {
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  dob: string;
  gender_id: number;
  member_picture: string;
};

export const memberAPI = {
  // ✅ ใช้ JWT ระบุ user
  getMe: () =>
    api.get<MemberProfileResponse>("/member/me"),

  updateMe: (payload: UpdateMemberProfilePayload) =>
    api.put("/member/me", payload),
};
