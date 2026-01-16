import api from "./api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const toFullUrl = (u?: string) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
};

// ========== Types ==========

export interface PollOption {
  id: number;
  label: string;
  img_url?: string;
  sort_order?: number;
  vote_count?: number;
  poll_id?: number;
}

export interface Poll {
  id: number;
  question: string;
  description?: string;
  allow_multiple: boolean;
  max_choice?: number;
  start_at?: string;
  end_at?: string;


  options?: PollOption[];
  member_id: number;

  poll_status_id: number;
  poll_status?: {
    id: number;
    name: string;
  };

  status_name?: string;
  last_reject_reason?: string;

  main_category_id?: number;
  sub_category_l1_id?: number;
  sub_category_l2_id?: number;

  created_at?: string;
  author_name?: string;
  author_avatar_url?: string; // ✅ รูปโปรไฟล์ของผู้สร้างโพล
  is_anonymous?: boolean;
  has_voted?: boolean;
  my_option_ids?: number[];

  report_count?: number; // ✅ NEW: for admin
}

export interface PollHistory {
  id: number;
  poll_id: number;
  action: string;
  admin_id: number;
  reason?: string;
  created_at: string;
}

// ========== Request Types ==========

export interface CreatePollRequest {
  question: string;
  description?: string;
  allow_multiple: boolean;
  max_choice?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  options: { label: string; img_url?: string; sort_order?: number }[];
  main_category_id?: number | null;
  sub_category_l1_id?: number | null;
  sub_category_l2_id?: number | null;
  is_anonymous?: boolean;
}

export interface UpdatePollRequest {
  question?: string;
  description?: string;
  allow_multiple?: boolean;
  max_choice?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  options?: { label: string; img_url?: string; sort_order?: number }[];
  main_category_id?: number | null;
  sub_category_l1_id?: number | null;
  sub_category_l2_id?: number | null;
  is_anonymous?: boolean;
}

export interface PollResultItem {
  option_id: number;
  label: string;
  img_url?: string;
  count: number;
  percent: number;
}

export interface PollResultsResponse {
  poll_id: number;
  question: string;
  total_votes: number;   // ✅ ชื่อตรง backend
  items: PollResultItem[];
}

export interface VotePollRequest {
  option_ids: number[];
}

export interface MyVoteResponse {
  has_voted: boolean;
  option_ids: number[];
}

// ========== Poll APIs ==========

export const pollAPI = {
  // Published feed
  listPublished: async () => {
    const res = await api.get<Poll[]>("/member/polls");
    const rows: any[] = (res as any).data ?? [];

    for (const p of rows) {
      const opts = (p?.options ?? p?.poll_options ?? []) as any[];
      if (Array.isArray(opts)) {
        p.options = opts.map((o: any) => ({
          ...o,
          img_url: toFullUrl(o.img_url),
        }));
      }
    }

    (res as any).data = rows;
    return res;
  },

  listClosed: () => api.get<Poll[]>("/member/polls/closed"),

  // ✅ published detail
  getPublishedById: async (id: number) => {
    const res = await api.get<Poll>(`/member/polls/${id}`);
    const p: any = (res as any).data;

    if (p?.options) {
      p.options = p.options.map((o: any) => ({
        ...o,
        img_url: toFullUrl(o.img_url),
      }));
    }
    (res as any).data = p;
    return res;
  },

  // (เหมือนกัน) เผื่อหน้าอื่นเรียก
  getPollDetail: async (id: number) => {
    const res = await api.get<Poll>(`/member/polls/${id}`);
    const p: any = (res as any).data;

    if (p?.options) {
      p.options = p.options.map((o: any) => ({
        ...o,
        img_url: toFullUrl(o.img_url),
      }));
    }
    (res as any).data = p;
    return res;
  },

  getMyVote: (id: number) => api.get<MyVoteResponse>(`/member/polls/${id}/my-vote`),

  getResults: async (id: number) => {
    const res = await api.get<PollResultsResponse>(`/member/polls/${id}/results`);
    const data: any = (res as any).data;

    // ✅ แปลง img_url
    if (data?.items) {
      data.items = data.items.map((it: any) => ({
        ...it,
        img_url: toFullUrl(it.img_url),
      }));
    }

    // ✅ normalize (เผื่อบางหน้าใช้ results.total)
    if (data && data.total_votes !== undefined) {
      data.total = data.total_votes;
    }

    (res as any).data = data;
    return res;
  },

  vote: (id: number, payload: VotePollRequest) =>
    api.post(`/member/polls/${id}/vote`, payload),

  // Draft & Management
  createDraft: (payload: CreatePollRequest) =>
    api.post<Poll>("/member/polls/draft", payload),

  updateDraft: (id: number, payload: UpdatePollRequest) =>
    api.put<Poll>(`/member/polls/${id}`, payload),

  deletePoll: (id: number) =>
    api.delete(`/member/polls/${id}`),

  submitForReview: (id: number) =>
    api.post(`/member/polls/${id}/submit`, {}),

  cancelRequest: (id: number) =>
    api.post(`/member/polls/${id}/cancel`, {}),

  closePoll: (id: number) =>
    api.post(`/member/polls/${id}/close`, {}), // ✅ Member closes own poll

  uploadOptionImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<{ message: string; url: string }>(
      "/member/polls/options/upload",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  // My Polls
  getMyPolls: (statusID?: number) => {
    const params = statusID ? { status_id: statusID } : {};
    return api.get<Poll[]>("/member/polls/my", { params });
  },

  getMyPollByID: async (id: number) => {
    const res = await api.get<Poll>(`/member/polls/my/${id}`);
    const p: any = (res as any).data;

    if (p?.options) {
      p.options = p.options.map((o: any) => ({
        ...o,
        img_url: toFullUrl(o.img_url),
      }));
    }

    (res as any).data = p;
    return res;
  },

  // =========================
  // ✅ ALIASES (แก้แดงให้หน้าเดิมที่เรียกชื่ออื่น)
  // =========================

  // หน้า PollDetail ของหนูเรียก getPublishedByID (ตัวใหญ่) -> ชี้มาที่ getPublishedById
  getPublishedByID: (id: number) => (pollAPI as any).getPublishedById(id),

  // หน้า PollDetail ของหนูเรียก results(...) -> ชี้มาที่ getResults
  results: (id: number) => (pollAPI as any).getResults(id),
};

//ดึงหมวดหมู่
// in poll.ts (ท้ายไฟล์)
export const categoryAPI = {
  listMain: async () => {
    const res = await api.get("/member/categories/main");
    const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
    return (Array.isArray(data) ? data : []).map((x: any) => ({
      id: Number(x?.id ?? x?.ID ?? 0),
      title: x?.title ?? "",
    }));
  },
  listSub1: async (mainCategoryId: number) => {
    const res = await api.get("/member/categories/sub1", {
      params: { main_category_id: mainCategoryId },
    });
    const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
    return (Array.isArray(data) ? data : []).map((x: any) => ({
      id: Number(x?.id ?? x?.ID ?? 0),
      title: x?.title ?? "",
    }));
  },
  listSub2: async (sub1Id: number) => {
    const res = await api.get("/member/categories/sub2", {
      params: { sub_category_l1_id: sub1Id },
    });
    const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
    return (Array.isArray(data) ? data : []).map((x: any) => ({
      id: Number(x?.id ?? x?.ID ?? 0),
      title: x?.title ?? "",
    }));
  },
};
