import api  from "./api";

/**
 * response จาก GET /members/account/:accountId
 * ใช้สำหรับหน้า Edit Profile
 */
export type EditProfileResponse = {
  email?: string;
  student_id?: string;
  username?: string;

  first_name?: string;
  firstname?: string; // กัน backend ส่ง key ไม่ตรง
  last_name?: string;
  lastname?: string;

  national_id?: string;
  gender_id?: number;
  gender?: string;

  dob?: string; // YYYY-MM-DD
  bio?: string;
  member_picture?: string;
};

/**
 * payload สำหรับ PUT /members/account/:accountId
 */
export type EditProfilePayload = {
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  dob: string; // YYYY-MM-DD
  gender_id: number;
  member_picture: string; // base64 / url
};

export const editProfileAPI = {
  /** โหลดข้อมูลมาใส่ฟอร์ม */
  get: (accountId: number) =>
    api.get<EditProfileResponse>(`/members/account/${accountId}`),

  /** บันทึกการแก้ไขโปรไฟล์ */
  update: (accountId: number, payload: EditProfilePayload) =>
    api.put(`/members/account/${accountId}`, payload),
};
