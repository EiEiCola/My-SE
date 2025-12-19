export function getUserIdFromToken(): number | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // ✅ เติม padding ให้ atob ไม่พัง
    const padded = base64.padEnd(
      base64.length + (4 - (base64.length % 4)) % 4,
      "="
    );

    const json = JSON.parse(atob(padded));

    const id = json.user_id; // ตาม backend Claims
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    console.error("getUserIdFromToken error", e);
    return null;
  }
}
