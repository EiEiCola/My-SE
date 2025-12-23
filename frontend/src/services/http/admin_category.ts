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

// ========== Main Category APIs ==========
// JWT token is automatically added by api interceptor

export const mainCategoryAPI = {
    list: () => api.get<{ data: MainCategory[] }>("/admin/categories/main"),

    get: (id: number) => api.get<{ data: MainCategory }>(`/admin/categories/main/${id}`),

    create: (payload: CreateMainCategoryRequest) =>
        api.post<{ data: MainCategory }>("/admin/categories/main", payload),

    update: (id: number, payload: UpdateMainCategoryRequest) =>
        api.put<{ data: MainCategory }>(`/admin/categories/main/${id}`, payload),

    delete: (id: number) =>
        api.delete(`/admin/categories/main/${id}`),
};

// ========== SubCategory L1 APIs ==========

export const subCategoryL1API = {
    list: (mainCategoryId?: number) => {
        const params = mainCategoryId ? { main_category_id: mainCategoryId } : {};
        return api.get<{ data: SubCategoryL1[] }>("/admin/categories/sub1", { params });
    },

    get: (id: number) => api.get<{ data: SubCategoryL1 }>(`/admin/categories/sub1/${id}`),

    create: (payload: CreateSubCategoryL1Request) =>
        api.post<{ data: SubCategoryL1 }>("/admin/categories/sub1", payload),

    update: (id: number, payload: UpdateSubCategoryL1Request) =>
        api.put<{ data: SubCategoryL1 }>(`/admin/categories/sub1/${id}`, payload),

    delete: (id: number) =>
        api.delete(`/admin/categories/sub1/${id}`),
};

// ========== SubCategory L2 APIs ==========

export const subCategoryL2API = {
    list: (subCategoryL1Id?: number) => {
        const params = subCategoryL1Id ? { sub_category_l1_id: subCategoryL1Id } : {};
        return api.get<{ data: SubCategoryL2[] }>("/admin/categories/sub2", { params });
    },

    get: (id: number) => api.get<{ data: SubCategoryL2 }>(`/admin/categories/sub2/${id}`),

    create: (payload: CreateSubCategoryL2Request) =>
        api.post<{ data: SubCategoryL2 }>("/admin/categories/sub2", payload),

    update: (id: number, payload: UpdateSubCategoryL2Request) =>
        api.put<{ data: SubCategoryL2 }>(`/admin/categories/sub2/${id}`, payload),

    delete: (id: number) =>
        api.delete(`/admin/categories/sub2/${id}`),
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
