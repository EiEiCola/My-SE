const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/** แปลง url รูปให้เป็น full url เสมอ */
const toFullUrl = (u?: string) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u; // เป็น http อยู่แล้ว
  if (u.startsWith("/")) return `${API_BASE}${u}`; // เช่น /uploads/xx.jpg
  return `${API_BASE}/${u}`; // เช่น uploads/xx.jpg
};

// =======================
// ✅ AUTH helpers (ไม่แดงใน TS)
// =======================
const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

// คืนค่าเป็น Headers (ชนิดนี้ TS รับชัวร์)
const buildAuthHeaders = () => {
  const h = new Headers();
  const token = getToken();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
};

// =======================
// ✅ shared image mapper
// =======================
const mapReviewsWithImages = (data: any[]) => {
  const list = (data || []).map((r: any) => {
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
};

// =======================
// API: Reviews
// =======================

// ฟังก์ชันดึงรีวิวทั้งหมด
export async function fetchReviews() {
  const headers = buildAuthHeaders();

  const res = await fetch(`${API_BASE}/api/member/reviews`, {
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.detail || json?.error || json?.message || "fetch reviews failed"
    );
  }

  return mapReviewsWithImages(json.data || []);
}

// ฟังก์ชันดึงรีวิวของฉัน
export async function fetchMyReviews() {
  const headers = buildAuthHeaders();

  const res = await fetch(`${API_BASE}/api/member/reviews/my`, {
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.detail || json?.error || json?.message || "fetch my reviews failed"
    );
  }

  return mapReviewsWithImages(json.data || []);
}

// ฟังก์ชันสร้างรีวิว
export async function createReview(payload: any) {
  const headers = buildAuthHeaders();
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}/api/member/reviews`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.detail || json?.error || json?.message || "create review failed"
    );
  }
  return json.data;
}

// ฟังก์ชันลบรีวิว
export async function deleteReview(id: number) {
  const headers = buildAuthHeaders();

  const res = await fetch(`${API_BASE}/api/member/reviews/${id}`, {
    method: "DELETE",
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.detail || json?.error || json?.message || "delete failed"
    );
  }
  return json;
}

// ฟังก์ชันอัพโหลดรูปภาพรีวิว
export async function uploadReviewImages(reviewId: number, files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f)); // key ต้องชื่อ images

  const headers = buildAuthHeaders();
  // ❗ห้าม set Content-Type เอง เพราะ browser จะ set boundary ให้

  const res = await fetch(`${API_BASE}/api/member/reviews/${reviewId}/images`, {
    method: "POST",
    headers,
    body: fd,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.detail || json?.error || json?.message || "upload images failed"
    );
  }
  return json.data; // [{url,is_cover,sort_order},...]
}

// ฟังก์ชันโหวตรีวิว (helpful / not_helpful)
export async function voteReview(
  reviewId: number,
  voteType: "helpful" | "not_helpful"
) {
  const headers = buildAuthHeaders();
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}/api/member/reviews/${reviewId}/vote`, {
    method: "POST",
    headers,
    body: JSON.stringify({ vote_type: voteType }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.detail || json?.error || json?.message || "vote failed"
    );
  }

  return json.data as {
    review_id: number;
    helpful_count: number;
    not_helpful_count: number;
    my_vote_type: "helpful" | "not_helpful" | null;
    action: "voted" | "unvoted" | "switched";
  };
}

// =======================
// API: Categories (member)
// =======================

// ฟังก์ชันดึงหมวดหมู่ทั้งหมด (member route ต้องใช้ token)
export async function getCategories() {
  const headers = buildAuthHeaders();

  const res = await fetch(`${API_BASE}/api/member/categories`, {
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.detail || json?.error || json?.message || "fetch categories failed"
    );
  }

  // แปลงข้อมูลจาก Backend (Title) ให้ตรงกับ Frontend (name)
  // และจัดการโครงสร้าง parent_id ให้ React ใช้งานได้ง่าย
  const rawData = json.data || [];
  return rawData.map((item: any) => ({
    id: item.ID || item.id,
    name: item.Title || item.name || "",
    parent_id:
      item.MainCategoryID || item.SubCategoryL1ID || item.parent_id || null,
    emoji: item.Emoji || "📁",
    hint: item.Hint || "",
  }));
}
