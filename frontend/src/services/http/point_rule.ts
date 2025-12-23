import api from "./api";

export type PointRulePayload = {
  activity_type: string;
  description?: string; // ✅ NEW
  activity_point: number;
  daily_limit: number;
};

export const pointRuleAPI = {
  // -------- Admin (ต้องเป็น admin token) --------
  create: (payload: PointRulePayload) => api.post("/admin/point-rule", payload),
  update: (id: number, payload: PointRulePayload) =>
    api.put(`/admin/point-rule/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/point-rule/${id}`),
  getAllAdmin: () => api.get("/admin/point-rule"), // ✅ เปลี่ยนชื่อให้ชัด

  // -------- Public/User (อ่านอย่างเดียว) --------
  getAllPublic: () => api.get("/point-rules"), // ✅ NEW: /api/point-rules
};
