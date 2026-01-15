import api from "./api";

// ==========================================
// 1. Interfaces
// ==========================================

export interface FriendRequestUI {
  id: number;
  name: string;
  avatar: string;
  memberId?: number;
}

export interface SuggestedFriendUI {
  id: number;
  name: string;
  avatar: string;
  mutualFriends?: number;
  status: 'none' | 'pending' | 'friends';
  requestId?: number;
  isFollowing: boolean;
}

// ==========================================
// 2. Helper Functions
// ==========================================

const BASE_IMAGE_URL = "http://localhost:8080";

export const getImageUrl = (path: string | undefined | null) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_IMAGE_URL}${cleanPath}`;
};

// ==========================================
// 3. Service Methods
// ==========================================

export const friendAPI = {
  // --- Get Data (Return Data Directly) ---
  getMe: async () => (await api.get("/member/me")).data,

  getReceivedRequests: async () => (await api.get("/member/my/friend-requests/received")).data,

  getSentRequests: async () => (await api.get("/member/my/friend-requests/sent")).data,

  getMyFriends: async () => (await api.get("/member/my/friends")).data,

  getBlockedUsers: async () => (await api.get("/member/my/blocks")).data,

  getMyFollowing: async () => (await api.get("/member/my/following")).data,

  getMyFollowers: async () => (await api.get("/member/my/followers")).data,

  getPopularMembers: async () => (await api.get("/member/members/popular")).data,

  getAllMembers: async () => (await api.get("/member/members")).data,

  // --- Actions (Return Response Object for Status Check) ---
  sendRequest: async (receiverId: number) => {
    return await api.post("/member/friend-requests", { receiver_id: receiverId });
  },

  respondRequest: async (requestId: number, accept: boolean) => {
    return await api.put(`/member/friend-requests/${requestId}/respond`, { accept });
  },

  cancelRequest: async (requestId: number) => {
    return await api.put(`/member/friend-requests/${requestId}/cancel`);
  },

  unfriend: async (friendId: number) => {
    return await api.put(`/member/friends/${friendId}/unfriend`);
  },

  blockUser: async (userId: number) => {
    return await api.post("/member/blocks", { blocked_id: userId });
  },

  unblockUser: async (userId: number) => {
    return await api.put(`/member/blocks/${userId}/unblock`);
  },

  followUser: async (targetId: number) => {
    return await api.post("/member/follows", { followed_id: targetId });
  },

  unfollowUser: async (targetId: number) => {
    return await api.put(`/member/follows/${targetId}/unfollow`);
  }
};