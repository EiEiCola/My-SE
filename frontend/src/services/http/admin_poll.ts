import api from "./api";
// Import shared types or redefine if needed. 
// For independency, we redefine basic Poll type or use `any` if shared type is not exported commonly (but we exported Poll in poll.ts).
// Better to import Poll from ./poll
// But imports from neighbor files might fail if circular? No.

import { type Poll } from "./poll";

// ========== Request Types ==========

export interface RejectPollRequest {
    reason: string;
}

// ========== API Helper ==========

const getAdminHeaders = () => ({
    "X-User-ID": "1", // Mock Admin ID
});

// ========== Admin Poll APIs ==========

export const adminPollAPI = {
    // List all polls (with filters)
    list: (statusID?: number) => {
        const params = statusID ? { status_id: statusID } : {};
        return api.get<Poll[]>("/admin/polls", { params, headers: getAdminHeaders() });
    },

    get: (id: number) =>
        api.get<Poll>(`/admin/polls/${id}`, { headers: getAdminHeaders() }),

    approve: (id: number) =>
        api.post(`/admin/polls/${id}/approve`, {}, { headers: getAdminHeaders() }),

    reject: (id: number, reason: string) =>
        api.post(`/admin/polls/${id}/reject`, { reason }, { headers: getAdminHeaders() }),

    close: (id: number) =>
        api.post(`/admin/polls/${id}/close`, {}, { headers: getAdminHeaders() }),

    delete: (id: number) =>
        api.delete(`/admin/polls/${id}`, { headers: getAdminHeaders() }),
};
