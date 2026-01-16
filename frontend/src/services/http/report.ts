import { http } from "./client";

export interface ReportMedia {
    url: string;
    type: string;
    is_attachment: boolean;
}

export interface CreateReportInput {
    target_type: string;
    target_id?: number;
    title: string;
    description: string;
    medias: ReportMedia[];
}

export interface Report {
    id: number;
    reporter_id: number;
    target_type: string;
    target_id?: number | null;
    title: string;
    description: string;
    status_id: number;
    admin_id?: number | null;
    created_at: string;
    updated_at: string;
    media?: ReportMedia[];
    reporter?: {
        id: number;
        username: string;
        email?: string;
    };
    status?: {
        id: number;
        status_name: string;
    }
}

const createReport = async (data: CreateReportInput) => {
    return await http.post("/members/reports", data);
};

const getMyReports = async (params: { page?: number; page_size?: number; status_id?: number }) => {
    return await http.get("/members/reports", { params });
};

const getReportById = async (id: number) => {
    return await http.get(`/members/reports/${id}`);
};

const updateReport = async (id: number, data: CreateReportInput) => {
    return await http.put(`/members/reports/${id}`, data);
};

const deleteReport = async (id: number) => {
    return await http.delete(`/members/reports/${id}`);
};

export const ReportService = {
    createReport,
    getMyReports,
    getReportById,
    updateReport,
    deleteReport,
    getAdminReports: async (params: { page?: number; page_size?: number; status_id?: number; target_type?: string; target_id?: number; q?: string }) => {
        return await http.get("/admin/reports", { params });
    },
    getReportByIdAdmin: async (id: number) => {
        return await http.get(`/admin/reports/${id}`);
    },
    updateReportStatus: async (id: number, status_id: number) => {
        return await http.post(`/admin/reports/${id}/status`, { status_id });
    },
};
