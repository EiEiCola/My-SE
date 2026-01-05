import { http } from "./client";

export interface PRSubmission {
    id: number;
    title: string;
    content: string;
    status: { ID: number; Name: string };
    req_start_at: string;
    media: { url: string; type: string; is_cover: boolean }[];
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    cover_media_id?: number;
    media?: { url: string; type: string }[];
    publish_start_at: string;
}

export const getMemberPRSubmissions = async (page = 1, pageSize = 20) => {
    const res = await http.get(`/members/pr-submissions?page=${page}&page_size=${pageSize}`);
    return res.data;
};

export const getUnreadAnnouncements = async () => {
    const res = await http.get(`/members/announcements/unread`);
    return res.data as Announcement[];
};

export const getPublishedAnnouncements = async (page = 1, pageSize = 20) => {
    const res = await http.get(`/members/announcements?page=${page}&page_size=${pageSize}`);
    return res.data;
};

export const markAnnouncementRead = async (id: number) => {
    const res = await http.post(`/members/announcements/${id}/read`);
    return res.data;
};
