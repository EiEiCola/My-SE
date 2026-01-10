const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface AdminReviewItem {
    id: number;
    title: string;
    content: string;
    rating: number;
    is_anonymous: boolean;
    helpful_count: number;
    not_helpful_count: number;
    created_at: string;
    deleted_at?: string;
    admin_delete_reason?: string;
    deleted_by_type?: "ADMIN" | "OWNER" | "";

    member: {
        username: string;
        member_picture: string;
    };

    main_category?: {
        title: string;
    };

    sub_category_l1?: {
        title: string;
    };

    sub_category_l2?: {
        title: string;
    };

    tags?: Array<{
        name: string;
    }>;

    report_count: number;

    review_images?: Array<{
        url: string;
    }>;
}

export interface AdminReviewResponse {
    data: AdminReviewItem[];
    total: number;
    page: number;
    deleted_count?: number;
    reported_count?: number;
}

export const fetchAdminReviews = async (
    page: number = 1,
    pageSize: number = 10,
    search: string = ""
): Promise<AdminReviewResponse> => {
    const token = localStorage.getItem("token");
    const res = await fetch(
        `${API_BASE}/api/admin/reviews?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.error || "Failed to fetch reviews");
    }
    return json as AdminReviewResponse;
};

export const deleteAdminReview = async (id: number, reason: string): Promise<void> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.error || "Failed to delete review");
    }
};
