import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8080") + "/api",
});

// mock admin id (ยังไม่มี login)
const MOCK_ADMIN_ID = 1;

export type AdminProfileDTO = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  phone_number: string;
  email: string;
  national_id_last4?: string;
};

export type UpdateAdminProfileReq = {
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  phone_number?: string;
};

export const adminProfileAPI = {
  getMe: () =>
    api.get<{ data: AdminProfileDTO }>("/admin/profile", {
      headers: { "X-Admin-ID": String(MOCK_ADMIN_ID) },
    }),

  updateMe: (payload: UpdateAdminProfileReq) =>
    api.put("/admin/profile", payload, {
      headers: { "X-Admin-ID": String(MOCK_ADMIN_ID) },
    }),

  setNationalId: (national_id: string) =>
    api.put(
      "/admin/profile/national-id",
      { national_id },
      { headers: { "X-Admin-ID": String(MOCK_ADMIN_ID) } }
    ),
};
