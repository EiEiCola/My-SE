import api from "./api";
import { type Poll } from "./poll";

export interface RejectPollRequest {
  reason: string;
}

export const adminPollAPI = {
  list: (statusID?: number) => {
    const params = statusID ? { status_id: statusID } : {};
    return api.get<Poll[]>("/admin/polls", { params });
  },

  get: (id: number) =>
    api.get<Poll>(`/admin/polls/${id}`),

  approve: (id: number) =>
    api.post(`/admin/polls/${id}/approve`, {}),

  reject: (id: number, reason: string) =>
    api.post(`/admin/polls/${id}/reject`, { reason }),

  close: (id: number) =>
    api.post(`/admin/polls/${id}/close`, {}),

  delete: (id: number) =>
    api.delete(`/admin/polls/${id}`),
};

