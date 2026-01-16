import api from "./api";

export const memberRewardAPI = {
  redeem: (rewardId: number, idempotencyKey?: string) =>
    api.post(`/member/rewards/${rewardId}/redeem`, null, {
      headers: {
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
      },
    }),

  myStickers: () => api.get("/member/my-stickers"),
  getMemberStickers: (id: number) => api.get(`/member/${id}/stickers`),

  // ✅ baseURL มี /api อยู่แล้ว -> ใช้ /member/points
  points: () => api.get("/member/points"),
};
