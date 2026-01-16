import api from "./api";

// Types matching backend entity
export interface Post {
    ID: number;
    author_id: number;
    title: string;
    content: string;
    is_anonymous: boolean;
    main_category_id?: number;
    sub_category1_id?: number;
    sub_category2_id?: number;
    status: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    images?: PostImage[];
    attachments?: PostAttachment[];
    // Category relations (preloaded from backend)
    MainCategory?: { ID: number; title: string };
    SubCategoryL1?: { ID: number; title: string };
    SubCategoryL2?: { ID: number; title: string };
    // Author relation (preloaded from backend)
    author?: {
        ID: number;
        username: string;
        first_name: string;
        last_name: string;
        member_picture: string;
    };
}

export interface PostImage {
    ID: number;
    post_id: number;
    url: string;
    order_index: number;
}

export interface PostAttachment {
    ID: number;
    post_id: number;
    file_url: string;
    file_name: string;
    file_size: number;
    order_index: number;
}

export interface CreatePostRequest {
    title: string;
    content: string;
    is_anonymous: boolean;
    main_category_id?: number;
    sub_category1_id?: number;
    sub_category2_id?: number;
}

export interface UpdatePostRequest {
    title?: string;
    content?: string;
    is_anonymous?: boolean;
    main_category_id?: number;
    sub_category1_id?: number;
    sub_category2_id?: number;
}

// API Response types
interface ApiResponse<T> {
    data: T;
    message?: string;
}

// Comment Image type
export interface CommentImage {
    ID: number;
    comment_id: number;
    url: string;
    order_index: number;
}

// Comment Attachment type
export interface CommentAttachment {
    ID: number;
    comment_id: number;
    file_url: string;
    file_name: string;
    file_size: number;
    order_index: number;
}

// Comment type
export interface Comment {
    ID: number;
    post_id: number;
    author_id: number;
    content: string;
    is_anonymous: boolean;
    status: string;
    like_count: number;
    created_at: string;
    updated_at: string;
    // Author relation (preloaded)
    author?: {
        ID: number;
        username: string;
        first_name: string;
        last_name: string;
        member_picture: string;
    };
    // Images and attachments
    images?: CommentImage[];
    attachments?: CommentAttachment[];
}

// Like/Status response type
interface PostStatusResponse {
    is_liked: boolean;
    is_bookmarked: boolean;
    is_starred: boolean;
}

interface LikeResponse {
    like_count: number;
    is_liked: boolean;
}

// Paginated response from backend
export interface PaginatedPostsResponse {
    data: Post[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export const postService = {
    // Get all posts (without pagination - for backward compatibility)
    getAll: () => api.get<ApiResponse<Post[]>>("/member/posts"),

    // Get posts with pagination
    getPaginated: (page: number, limit: number) =>
        api.get<PaginatedPostsResponse>(`/member/posts?page=${page}&limit=${limit}`),

    // Get post by ID
    getById: (id: number) => api.get<ApiResponse<Post>>(`/member/posts/${id}`),

    // Create new post
    create: (data: CreatePostRequest) =>
        api.post<ApiResponse<Post>>("/member/posts", data),

    // Create post with files (multipart/form-data)
    createWithFiles: (formData: FormData) =>
        api.post<ApiResponse<Post>>("/member/posts", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    // Update post
    update: (id: number, data: UpdatePostRequest) =>
        api.put<ApiResponse<Post>>(`/member/posts/${id}`, data),

    // Update post with files (multipart/form-data)
    updateWithFiles: (id: number, formData: FormData) =>
        api.put<ApiResponse<Post>>(`/member/posts/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    // Delete post
    delete: (id: number) => api.delete(`/member/posts/${id}`),

    // =============== LIKE / STATS API ===============

    // Get status (like, bookmark, star)
    getLikeStatus: (postId: number) =>
        api.get<PostStatusResponse>(`/member/posts/${postId}/like/status`),

    // Toggle like on a post
    toggleLike: (postId: number) =>
        api.post<LikeResponse>(`/member/posts/${postId}/like`),

    // Toggle bookmark
    toggleBookmark: (postId: number) =>
        api.post<{ is_bookmarked: boolean }>(`/member/posts/${postId}/bookmark`),

    // Send star (points)
    sendStar: (postId: number) =>
        api.post<{ is_starred: boolean; message: string; point_error?: string }>(`/member/posts/${postId}/star`),

    // =============== COMMENT API ===============

    // Get all comments for a post
    getComments: (postId: number) =>
        api.get<ApiResponse<Comment[]>>(`/member/posts/${postId}/comments`),

    // Create a new comment (JSON only, no files)
    createComment: (postId: number, content: string, isAnonymous: boolean) =>
        api.post<ApiResponse<Comment>>(`/member/posts/${postId}/comments`, {
            content,
            is_anonymous: isAnonymous,
        }),

    // Create a new comment with files (multipart/form-data)
    createCommentWithFiles: (postId: number, formData: FormData) =>
        api.post<ApiResponse<Comment>>(`/member/posts/${postId}/comments`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    // Delete a comment
    deleteComment: (postId: number, commentId: number) =>
        api.delete(`/member/posts/${postId}/comments/${commentId}`),

    // Toggle like on a comment
    toggleLikeComment: (postId: number, commentId: number) =>
        api.post<{ is_liked: boolean; like_count: number }>(`/member/posts/${postId}/comments/${commentId}/like`),

    // =============== PROFILE FEATURE API ===============

    // Get bookmarked posts (My Fav)
    getBookmarkedPosts: () =>
        api.get<ApiResponse<Post[]>>("/member/posts/bookmarked"),

    // Get user's own posts (My Post)
    getMyPosts: () =>
        api.get<ApiResponse<Post[]>>("/member/posts/mine"),

    // =============== REPORT API ===============

    // Report a post
    reportPost: (postId: number, data: { title: string; description: string; report_reason_id?: number; medias?: { url: string; type: string; is_attachment: boolean }[] }) =>
        api.post(`/member/posts/${postId}/report`, data),
};

export default postService;
