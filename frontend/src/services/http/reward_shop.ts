import api from "./api";

export const rewardShopAPI = {
  // ✅ ดึงสติ๊กเกอร์ที่แอดมินสร้างไว้ เพื่อให้ Member เห็นในร้าน
  getAll: () => api.get("/rewards"), // หรือ "/reward" แล้วแต่ backend คุณตั้ง
};
