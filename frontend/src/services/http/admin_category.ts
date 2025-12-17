import api from "./api";

// ========== Types ==========

export interface MainCategory {
    ID: number;
    title: string;
    description: string;
    icon: string;
    order_index: number;
    created_by_admin: number;
    created_at: string;
    updated_at: string;
}

export interface SubCategoryL1 {
    ID: number;
    title: string;
    description: string;
    order_index: number;
    main_category_id: number;
    created_by_admin: number;
    created_at: string;
    updated_at: string;
}

export interface SubCategoryL2 {
    ID: number;
    title: string;
    description: string;
    order_index: number;
    sub_category_l1_id: number;
    created_by_admin: number;
    created_at: string;
    updated_at: string;
}

// ========== Request Types ==========

export interface CreateMainCategoryRequest {
    title: string;
    description?: string;
    icon?: string;
    order_index?: number;
}

export interface UpdateMainCategoryRequest {
    title?: string;
    description?: string;
    icon?: string;
    order_index?: number;
}

export interface CreateSubCategoryL1Request {
    title: string;
    description?: string;
    order_index?: number;
    main_category_id: number;
}

export interface UpdateSubCategoryL1Request {
    title?: string;
    description?: string;
    order_index?: number;
}

export interface CreateSubCategoryL2Request {
    title: string;
    description?: string;
    order_index?: number;
    sub_category_l1_id: number;
}

export interface UpdateSubCategoryL2Request {
    title?: string;
    description?: string;
    order_index?: number;
}

// ========== API Helper ==========

const getAdminHeaders = () => ({
    "X-User-ID": "1", // TODO: Replace with actual user ID from auth context
});

// ========== Main Category APIs ==========

export const mainCategoryAPI = {
    list: () => api.get<{ data: MainCategory[] }>("/admin/categories/main", { headers: getAdminHeaders() }),

    get: (id: number) => api.get<{ data: MainCategory }>(`/admin/categories/main/${id}`, { headers: getAdminHeaders() }),

    create: (payload: CreateMainCategoryRequest) =>
        api.post<{ data: MainCategory }>("/admin/categories/main", payload, { headers: getAdminHeaders() }),

    update: (id: number, payload: UpdateMainCategoryRequest) =>
        api.put<{ data: MainCategory }>(`/admin/categories/main/${id}`, payload, { headers: getAdminHeaders() }),

    delete: (id: number) =>
        api.delete(`/admin/categories/main/${id}`, { headers: getAdminHeaders() }),
};

// ========== SubCategory L1 APIs ==========

export const subCategoryL1API = {
    list: (mainCategoryId?: number) => {
        const params = mainCategoryId ? { main_category_id: mainCategoryId } : {};
        return api.get<{ data: SubCategoryL1[] }>("/admin/categories/sub1", { params, headers: getAdminHeaders() });
    },

    get: (id: number) => api.get<{ data: SubCategoryL1 }>(`/admin/categories/sub1/${id}`, { headers: getAdminHeaders() }),

    create: (payload: CreateSubCategoryL1Request) =>
        api.post<{ data: SubCategoryL1 }>("/admin/categories/sub1", payload, { headers: getAdminHeaders() }),

    update: (id: number, payload: UpdateSubCategoryL1Request) =>
        api.put<{ data: SubCategoryL1 }>(`/admin/categories/sub1/${id}`, payload, { headers: getAdminHeaders() }),

    delete: (id: number) =>
        api.delete(`/admin/categories/sub1/${id}`, { headers: getAdminHeaders() }),
};

// ========== SubCategory L2 APIs ==========

export const subCategoryL2API = {
    list: (subCategoryL1Id?: number) => {
        const params = subCategoryL1Id ? { sub_category_l1_id: subCategoryL1Id } : {};
        return api.get<{ data: SubCategoryL2[] }>("/admin/categories/sub2", { params, headers: getAdminHeaders() });
    },

    get: (id: number) => api.get<{ data: SubCategoryL2 }>(`/admin/categories/sub2/${id}`, { headers: getAdminHeaders() }),

    create: (payload: CreateSubCategoryL2Request) =>
        api.post<{ data: SubCategoryL2 }>("/admin/categories/sub2", payload, { headers: getAdminHeaders() }),

    update: (id: number, payload: UpdateSubCategoryL2Request) =>
        api.put<{ data: SubCategoryL2 }>(`/admin/categories/sub2/${id}`, payload, { headers: getAdminHeaders() }),

    delete: (id: number) =>
        api.delete(`/admin/categories/sub2/${id}`, { headers: getAdminHeaders() }),
};

// ========== Public Category APIs (no auth required) ==========

export const publicCategoryAPI = {
    listMain: () => api.get<{ data: MainCategory[] }>("/categories/main"),
    listSub1: (mainCategoryId?: number) => {
        const params = mainCategoryId ? { main_category_id: mainCategoryId } : {};
        return api.get<{ data: SubCategoryL1[] }>("/categories/sub1", { params });
    },
    listSub2: (subCategoryL1Id?: number) => {
        const params = subCategoryL1Id ? { sub_category_l1_id: subCategoryL1Id } : {};
        return api.get<{ data: SubCategoryL2[] }>("/categories/sub2", { params });
    },
};
