export interface AdminAnnouncement {
  id: number;
  title: string;
  content: string;
  publish_start_at: string;
  publish_end_at: string;
  status_id: number;
}

export async function listAdminAnnouncements(params: { page?: number; page_size?: number; pr_id?: number } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.pr_id) query.set("pr_id", String(params.pr_id));
  const res = await fetch(`/api/admin/announcements?${query.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteAdminAnnouncement(id: number) {
  const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAdminAnnouncement(id: number) {
  const res = await fetch(`/api/admin/announcements/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
