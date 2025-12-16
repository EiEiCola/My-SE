import api from "./api";

export type PointRulePayload = {
  activity_type: string;
  activity_point: number;
  daily_limit: number;
};

export const pointRuleAPI = {
  create: (payload: PointRulePayload) => api.post("/admin/point-rule", payload),
  update: (id: number, payload: PointRulePayload) =>
    api.put(`/admin/point-rule/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/point-rule/${id}`),
  getAll: () => api.get("/admin/point-rule"),
};
