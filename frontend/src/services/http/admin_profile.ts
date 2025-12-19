import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
});

const getToken = () => localStorage.getItem("token") || "";

const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
      headers: { ...authHeader() },
    }),

  updateMe: (payload: UpdateAdminProfileReq) =>
    api.put("/admin/profile", payload, {
      headers: { ...authHeader() },
    }),

  setNationalId: (national_id: string) =>
    api.put(
      "/admin/profile/national-id",
      { national_id },
      { headers: { ...authHeader() } }
    ),
};
