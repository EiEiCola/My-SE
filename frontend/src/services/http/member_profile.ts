import api  from "./api";

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
  member_picture: string; // base64 หรือ url แล้วแต่ backend รองรับ
};

export const memberAPI = {
  getByAccountId: (accountId: number) =>
    api.get<MemberProfileResponse>(`/members/account/${accountId}`),

  updateByAccountId: (accountId: number, payload: UpdateMemberProfilePayload) =>
    api.put(`/members/account/${accountId}`, payload),
};
