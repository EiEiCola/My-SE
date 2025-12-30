import api from "./api";

// ========== Types ==========

export interface PollOption {
  id: number;
  label: string;
  img_url?: string;
  sort_order?: number;
  vote_count?: number; // เผื่อบาง endpoint ส่งมา
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

  // Relations
  options?: PollOption[];
  member_id: number;

  // Status
  poll_status_id: number;
  poll_status?: {
    id: number;
    name: string;
  };

  // Categories (Optional)
  main_category_id?: number;
  sub_category_l1_id?: number;
  sub_category_l2_id?: number;

  created_at?: string;
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
  total_votes: number;
  items: PollResultItem[];
}

export interface VotePollRequest {
  option_ids: number[];
}

// ✅ เพิ่ม: response สำหรับเช็คว่า user โหวตแล้วไหม (ใช้ตอน OPEN ซ่อนผลก่อนโหวต)
export interface MyVoteResponse {
  has_voted: boolean;
  option_ids: number[];
}

// ========== Poll APIs ==========

export const pollAPI = {
  // Public / Published
  listPublished: () => api.get<Poll[]>("/members/polls"),

  // ✅ เพิ่ม: list โพลที่ปิดแล้ว (ใช้หน้า /User/Polls/archive)
  // ต้องมี backend route: GET /members/polls/closed
  listClosed: () => api.get<Poll[]>("/members/polls/closed"),

  // ✅ เพิ่ม: ดึงโพล published รายตัว (ถ้าต้องการ)
  // ต้องมี backend route: GET /members/polls/:id
  getPublishedById: (id: number) => api.get<Poll>(`/members/polls/${id}`),

  // ✅ เพิ่ม: ดึงรายละเอียดโพล (รวม options/vote_count ถ้า backend preload)
  // ใช้ได้กับหน้า detail หรือ refresh หลังโหวต
  // ต้องมี backend route: GET /members/polls/:id
  getPollDetail: (id: number) => api.get<Poll>(`/members/polls/${id}`),

  // ✅ เพิ่ม: เช็คว่า user โหวตโพลนี้แล้วหรือยัง
  // ต้องมี backend route: GET /members/polls/:id/my-vote
  getMyVote: (id: number) => api.get<MyVoteResponse>(`/members/polls/${id}/my-vote`),

  // ✅ แก้ type ให้ตรง backend ของหนู (PollResultsResponse)
  getResults: (id: number) =>
    api.get<PollResultsResponse>(`/members/polls/${id}/results`),

  vote: (id: number, payload: VotePollRequest) =>
    api.post(`/members/polls/${id}/vote`, payload),

  // Draft & Management
  createDraft: (payload: CreatePollRequest) =>
    api.post<Poll>("/members/polls/draft", payload),

  updateDraft: (id: number, payload: UpdatePollRequest) =>
    api.put<Poll>(`/members/polls/${id}`, payload),

  deletePoll: (id: number) =>
    api.delete(`/members/polls/${id}`),

  submitForReview: (id: number) =>
    api.post(`/members/polls/${id}/submit`, {}),

  cancelRequest: (id: number) =>
    api.post(`/members/polls/${id}/cancel`, {}),

  // My Polls
  getMyPolls: (statusID?: number) => {
    const params = statusID ? { status_id: statusID } : {};
    return api.get<Poll[]>("/members/polls/my", { params });
  },

  getMyPollByID: (id: number) =>
    api.get<Poll>(`/members/polls/my/${id}`),
};
