import api from "./api";

export type AdminRewardPayload = {
  reward_name: string;
  point_required: number;
  reward_picture: string;
};

export const adminRewardAPI = {
  create: (payload: AdminRewardPayload) => api.post("/admin/reward", payload),
  update: (id: number, payload: AdminRewardPayload) =>
    api.put(`/admin/reward/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/reward/${id}`),
  getAll: () => api.get("/admin/reward"),
};
