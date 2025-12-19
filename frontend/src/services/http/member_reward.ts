import api from "./api";

export const memberRewardAPI = {
  redeem: (rewardId: number, idempotencyKey?: string) =>
    api.post(`/member/rewards/${rewardId}/redeem`, null, {
      headers: {
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
      },
    }),

  myStickers: () => api.get("/member/my-stickers"),
  points: () => api.get("/member/points"),

};
