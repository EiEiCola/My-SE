import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
});

const getToken = () => localStorage.getItem("token") || "";

const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type AdminUserAccountDTO = {
  id: number;
  username?: string;
  email?: string;
  code?: string;
  is_locked?: boolean;
  locked_reason?: string;
};

export type AdminUserSearchQuery = {
  email?: string;
  code?: string;
};

export const adminUserManageAPI = {
  search: (q: AdminUserSearchQuery) =>
    api.get("/admin/users", {
      params: q,
      headers: { ...authHeader() },
    }),

  lock: (id: number, reason?: string) =>
    api.patch(`/admin/users/${id}/lock`, reason ? { reason } : {}, {
      headers: { ...authHeader() },
    }),

  unlock: (id: number) =>
    api.patch(`/admin/users/${id}/unlock`, {}, {
      headers: { ...authHeader() },
    }),
};
