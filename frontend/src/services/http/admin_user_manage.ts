// src/services/http/admin_user_manage.ts
import axios from "axios";

// ✅ baseURL = http://localhost:8080/api
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8080") + "/api",
});

export type AdminUserAccountDTO = {
  id: number;
  username?: string;
  email?: string;

  // “รหัส” ที่ backend map มาให้เป็น field เดียว
  code?: string;

  // ✅ ใช้ตัวนี้เป็นหลักสำหรับ Lock/Unlock
  is_locked?: boolean;

  // (optional) ถ้า backend ส่ง reason มาด้วย
  locked_reason?: string;
};

export type AdminUserSearchQuery = {
  email?: string;
  code?: string;
};

export const adminUserManageAPI = {
  // ✅ GET /api/admin/users?email=...&code=...
  search: (q: AdminUserSearchQuery) => api.get("/admin/users", { params: q }),

  // ✅ PATCH /api/admin/users/:id/lock
  lock: (id: number, reason?: string) =>
    api.patch(`/admin/users/${id}/lock`, reason ? { reason } : {}),

  // ✅ PATCH /api/admin/users/:id/unlock
  unlock: (id: number) => api.patch(`/admin/users/${id}/unlock`),
};
