import api from "./api";
import type { Post } from "./post_service";

// Admin-specific types
export interface AdminPost extends Post {
    reports?: PostReport[];
}

export interface PostReport {
    ID: number;
    reporter: string;
    reason: string;
    created_at: string;
}

interface ApiResponse<T> {
    data: T;
    message?: string;
}

export const adminPostService = {
    // Get all posts (admin view with reports)
    getAll: () => api.get<ApiResponse<AdminPost[]>>("/admin/posts"),

    // Delete post by admin (POST method for reliable body parsing)
    delete: (id: number, reason: string) => api.post(`/admin/posts/${id}/delete`, { reason }),
};

export default adminPostService;
