const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/** แปลง url รูปให้เป็น full url เสมอ */
const toFullUrl = (u?: string) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;       // เป็น http อยู่แล้ว
  if (u.startsWith("/")) return `${API_BASE}${u}`; // เช่น /uploads/xx.jpg
  return `${API_BASE}/${u}`;                   // เช่น uploads/xx.jpg
};

//ฟังก์ชันดึงรีวิว
export async function fetchReviews() {
  const res = await fetch(`${API_BASE}/api/member/reviews`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.detail || json?.error || "fetch reviews failed");
  }

  // ✅ ทำให้แต่ละรีวิวมี images เป็น string[] และเป็น full url เสมอ
  const list = (json.data || []).map((r: any) => {
    // backend ของเธอส่งเป็น ReviewImages (หรือบางทีอาจเป็น review_images/images)
    const rawImgs = r.ReviewImages ?? r.review_images ?? r.images ?? [];

    const images = (Array.isArray(rawImgs) ? rawImgs : [])
      .slice()
      .sort(
        (a: any, b: any) =>
          (a.sort_order ?? a.SortOrder ?? 0) - (b.sort_order ?? b.SortOrder ?? 0)
      )
      .map((img: any) => toFullUrl(img?.url ?? img?.URL))
      .filter(Boolean);

    return { ...r, images }; // ✅ UI ใช้ r.images ได้เลย
  });

  return list;
}

//ฟังก์ชันสร้างรีวิว
export async function createReview(payload: any) {
  const res = await fetch(`${API_BASE}/api/member/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.detail || json?.error || "create review failed");
  }
  return json.data;
}

//ฟังก์ชันลบรีวิว
export async function deleteReview(id: number) {
  const res = await fetch(`${API_BASE}/api/member/reviews/${id}`, {
    method: "DELETE",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.error || "delete failed");
  return json;
}

//ฟังก์ชันอัพโหลดรูปภาพรีวิว
export async function uploadReviewImages(reviewId: number, files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f)); // key ต้องชื่อ images

  const res = await fetch(`${API_BASE}/api/member/reviews/${reviewId}/images`, {
    method: "POST",
    body: fd,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.error || "upload images failed");
  return json.data; // [{url,is_cover,sort_order},...]
}
