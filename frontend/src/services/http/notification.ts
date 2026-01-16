import api from "./api";

export interface Notification {
    ID: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    related_id: number;
    is_read: boolean;
    CreatedAt: string;
}

export const notificationAPI = {
    getAll: () => api.get<{ data: Notification[] }>("/member/notifications"),
    markAsRead: (id: number) => api.patch(`/member/notifications/${id}/read`),
    markAllAsRead: () => api.patch("/member/notifications/read-all"),
    deleteRead: () => api.delete("/member/notifications/read"),
};
