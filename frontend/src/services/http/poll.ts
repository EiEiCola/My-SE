import api from "./api";

// ========== Types ==========

export interface PollOption {
  id: number;
  label: string;
  vote_count: number;
  poll_id: number;
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
  max_choice?: number;
  start_at?: string;
  end_at?: string;
  options: { label: string }[];
  main_category_id?: number;
  sub_category_l1_id?: number;
  sub_category_l2_id?: number;
}

export interface UpdatePollRequest {
  question?: string;
  description?: string;
  allow_multiple?: boolean;
  max_choice?: number;
  start_at?: string;
  end_at?: string;
  options?: { label: string }[]; // Replace all options
}

export interface VotePollRequest {
  option_ids: number[];
}

// ========== API Helper ==========

// TODO: Replace "1" with actual User ID from Context/Auth
const getHeaders = () => ({
  "X-User-ID": "1",
});

// ========== Poll APIs ==========

export const pollAPI = {
  // Public / Published
  listPublished: () => api.get<Poll[]>("/members/polls"),

  getResults: (id: number) => api.get<{ poll: Poll; results: any[] }>(`/members/polls/${id}/results`),

  vote: (id: number, payload: VotePollRequest) =>
    api.post(`/members/polls/${id}/vote`, payload, { headers: getHeaders() }),

  // Draft & Management
  createDraft: (payload: CreatePollRequest) =>
    api.post<Poll>("/members/polls/draft", payload, { headers: getHeaders() }),

  updateDraft: (id: number, payload: UpdatePollRequest) =>
    api.put<Poll>(`/members/polls/${id}`, payload, { headers: getHeaders() }),

  deletePoll: (id: number) =>
    api.delete(`/members/polls/${id}`, { headers: getHeaders() }),

  submitForReview: (id: number) =>
    api.post(`/members/polls/${id}/submit`, {}, { headers: getHeaders() }),

  cancelRequest: (id: number) =>
    api.post(`/members/polls/${id}/cancel`, {}, { headers: getHeaders() }),

  // My Polls
  getMyPolls: (statusID?: number) => {
    const params = statusID ? { status_id: statusID } : {};
    return api.get<Poll[]>("/members/polls/my", { params, headers: getHeaders() });
  },

  getMyPollByID: (id: number) =>
    api.get<Poll>(`/members/polls/my/${id}`, { headers: getHeaders() }),
};
