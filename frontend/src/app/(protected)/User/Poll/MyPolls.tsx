import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "./MyPolls.css";
import { useNavigate } from "react-router-dom";
import { type Poll, pollAPI } from "../../../../services/http/poll";

type StatusName =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "CLOSED"
  | "UNKNOWN";

const StatusBadge = ({ status }: { status: StatusName }) => {
  const cls =
    status === "PENDING_REVIEW"
      ? "badge badge-pending"
      : status === "PUBLISHED"
      ? "badge badge-published"
      : status === "REJECTED"
      ? "badge badge-rejected"
      : status === "CLOSED"
      ? "badge badge-closed"
      : status === "DRAFT"
      ? "badge badge-draft"
      : "badge";

  return <span className={cls}>{status}</span>;
};

const MyPolls: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0); // 0=All
  const [q, setQ] = useState("");

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  // -------- helpers: กัน field name ไม่ตรง --------
  const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
  const getQuestion = (p: Poll) => (p as any).question ?? "";
  const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;

  // ✅ สำคัญ: fallback จาก status_id ถ้าไม่มี poll_status.name
  const getStatus = (p: Poll): StatusName => {
    const name = (p as any)?.poll_status?.name as StatusName | undefined;
    if (name) return name;

    const sid = (p as any)?.status_id ?? (p as any)?.poll_status_id ?? (p as any)?.StatusID;
    switch (Number(sid)) {
      case 1:
        return "DRAFT";
      case 2:
        return "PENDING_REVIEW";
      case 3:
        return "PUBLISHED";
      case 4:
        return "REJECTED";
      case 5:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  };

  const getAllowMultiple = (p: Poll) =>
    Boolean((p as any)?.allow_multiple ?? (p as any)?.AllowMultiple ?? false);

  const getMaxChoice = (p: Poll) =>
    (p as any)?.max_choice ?? (p as any)?.MaxChoice ?? null;

  const getStartAt = (p: Poll) => (p as any)?.start_at ?? (p as any)?.StartAt ?? null;
  const getEndAt = (p: Poll) => (p as any)?.end_at ?? (p as any)?.EndAt ?? null;

  const getOptions = (p: Poll) => ((p as any).poll_options || (p as any).options || []) as any[];

  const optionLabel = (opt: any) =>
    opt?.text ??
    opt?.title ??
    opt?.option_text ??
    opt?.optionText ??
    opt?.OptionText ??
    opt?.name ??
    opt?.label ??
    "-";

  // -----------------------------------------------

  const fetchPolls = async (statusID?: number) => {
    setLoading(true);
    try {
      const res = await pollAPI.getMyPolls(statusID);

      // รองรับได้ทั้ง {data:{data:[]}} หรือ {data:[]}
      const rows = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      setPolls(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error(error);
      alert("Failed to load polls");
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const status = activeTab === 0 ? undefined : activeTab;
    fetchPolls(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const stats = useMemo(() => {
    const list = polls;
    const count = (s: StatusName) => list.filter((p) => getStatus(p) === s).length;
    return {
      total: list.length,
      draft: count("DRAFT"),
      pending: count("PENDING_REVIEW"),
      published: count("PUBLISHED"),
      rejected: count("REJECTED"),
      closed: count("CLOSED"),
    };
  }, [polls]);

  const tabs = [
    { id: 0, label: "All", count: stats.total },
    { id: 1, label: "Drafts", count: stats.draft },
    { id: 2, label: "Pending", count: stats.pending },
    { id: 3, label: "Published", count: stats.published },
    { id: 4, label: "Rejected", count: stats.rejected },
    { id: 5, label: "Closed", count: stats.closed },
  ];

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    const base =
      activeTab === 0
        ? polls
        : polls.filter((p) => {
            const s = getStatus(p);
            const sid =
              s === "DRAFT"
                ? 1
                : s === "PENDING_REVIEW"
                ? 2
                : s === "PUBLISHED"
                ? 3
                : s === "REJECTED"
                ? 4
                : s === "CLOSED"
                ? 5
                : 0;
            return sid === activeTab;
          });

    if (!keyword) return base;

    return base.filter((p) => {
      const idStr = String(getId(p));
      const question = String(getQuestion(p)).toLowerCase();
      return idStr.includes(keyword) || question.includes(keyword);
    });
  }, [polls, q, activeTab]);

  // --------- confirm modal ----------
  const openConfirm = (title: string, desc: string, danger: boolean, action: () => Promise<void>) => {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setConfirmDanger(danger);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const runConfirm = async () => {
    if (!confirmAction) return;
    try {
      await confirmAction();
      setConfirmOpen(false);
      setConfirmAction(null);
    } catch (e) {
      console.error(e);
      alert("Action failed");
    }
  };

  // ---------- actions ----------
  const handleDelete = (id: number) => {
    openConfirm("Delete this poll?", "This action cannot be undone.", true, async () => {
      await pollAPI.deletePoll(id);
      await fetchPolls(activeTab === 0 ? undefined : activeTab);
    });
  };

  const handleSubmit = (id: number) => {
    openConfirm(
      "Submit for Review?",
      "You won't be able to edit this poll while it's pending review.",
      false,
      async () => {
        await pollAPI.submitForReview(id);
        await fetchPolls(activeTab === 0 ? undefined : activeTab);
      }
    );
  };

  const handleCancel = (id: number) => {
    openConfirm(
       "Withdraw submission?",
      "This will withdraw your request and move the poll back to Draft so you can edit it.",
      true,
      async () => {
      await pollAPI.cancelRequest(id);
      await fetchPolls(activeTab === 0 ? undefined : activeTab);
  }
);
  };

  const openDetail = (p: Poll) => {
    setSelectedPoll(p);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedPoll(null);
  };

  const canEditSubmitDelete = (p: Poll) => {
    const s = getStatus(p);
    return s === "DRAFT" || s === "REJECTED";
  };
  const canCancel = (p: Poll) => getStatus(p) === "PENDING_REVIEW";

  // ✅ ปรับ: PUBLISHED + CLOSED ควรดูผลได้ (PUBLISHED อาจโดน backend บังคับ "ต้องโหวตก่อน")
  const canViewResult = (p: Poll) => {
    const s = getStatus(p);
    return s === "PUBLISHED" || s === "CLOSED";
  };

  return (
    <div className="my-polls-page">
      {/* HERO */}
      <div className="my-hero">
        <div>
          <div className="my-title">My Polls</div>
          <div className="my-sub">Manage your polls in one place (orange theme).</div>
        </div>

        <div className="my-toolbar">
          <div className="my-search">
            <span className="my-search-ico">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by poll id or question..."
            />
          </div>

          <button className="btn btn-primary" onClick={() => navigate("/User/Polls/create")}>
            ➕ Create Poll
          </button>
        </div>
      </div>

      {/* STATS (เหมือน admin) */}
      <div className="stats">
        <div className="stat">
          <div className="k">Total</div>
          <div className="v">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="k">Draft</div>
          <div className="v">{stats.draft}</div>
        </div>
        <div className="stat">
          <div className="k">Pending</div>
          <div className="v">{stats.pending}</div>
        </div>
        <div className="stat">
          <div className="k">Published</div>
          <div className="v">{stats.published}</div>
        </div>
        <div className="stat">
          <div className="k">Rejected</div>
          <div className="v">{stats.rejected}</div>
        </div>

        {/* ✅ แนะนำ: เพิ่ม Closed ให้ตรงกับ tab */}
        <div className="stat">
          <div className="k">Closed</div>
          <div className="v">{stats.closed}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="my-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={activeTab === t.id ? "tab tab-active" : "tab"}
            onClick={() => setActiveTab(t.id)}
            type="button"
          >
            {t.label}
            <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">Poll List</div>
          {loading ? <div className="loading">Loading...</div> : null}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Question</th>
                <th style={{ width: 170 }}>Status</th>
                <th style={{ width: 190 }}>Created</th>
                <th style={{ width: 420, textAlign: "right" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="empty-box">📦</div>
                      <div className="empty-title">No polls</div>
                      <div className="empty-sub">Try changing tab or create a new poll.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const id = getId(p);
                  const status = getStatus(p);
                  const created = getCreatedAt(p);
                  const question = getQuestion(p);

                  return (
                    <tr key={id}>
                      <td className="mono">{id}</td>

                      <td className="question">
                        <button className="link-btn" onClick={() => openDetail(p)} type="button">
                          {question}
                        </button>
                      </td>

                      <td>
                        <StatusBadge status={status} />
                      </td>

                      <td className="muted">
                        {created ? dayjs(created).format("DD/MM/YYYY HH:mm") : "-"}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="actions">
                          <button className="btn btn-outline" onClick={() => openDetail(p)} type="button" title="Detail">
  👁 Detail
</button>


                          {canEditSubmitDelete(p) && (
                            <>
                              <button
                                className="btn btn-outline"
                                onClick={() => navigate(`/User/Polls/edit/${id}`)}
                                type="button"
                              >
                                ✏️ Edit
                              </button>
                              <button className="btn btn-primary" onClick={() => handleSubmit(id)} type="button">
                                📤 Submit
                              </button>
                              <button
                                className="btn btn-ghost-danger"
                                onClick={() => handleDelete(id)}
                                type="button"
                              >
                                🗑 Delete
                              </button>
                            </>
                          )}

                          {canCancel(p) && (
                            <button className="btn btn-danger" onClick={() => handleCancel(id)} type="button">
                              ⛔ Cancel
                            </button>
                          )}

                          {canViewResult(p) && (
                            <button
                              className="btn btn-outline"
                              onClick={() => navigate(`/User/Polls/${id}`)}
                              type="button"
                            >
                              📊 Results
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL CARD MODAL */}
      {detailOpen && selectedPoll && (
        <div className="card-backdrop" onMouseDown={closeDetail}>
          <div className="card-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="card-head">
              <div>
                <div className="card-title">Poll Detail</div>
                <div className="card-sub">
                  ID #{getId(selectedPoll)} • Created{" "}
                  {getCreatedAt(selectedPoll) ? dayjs(getCreatedAt(selectedPoll)).format("DD/MM/YYYY") : "-"}
                </div>
              </div>

              <button className="icon-btn" onClick={closeDetail} type="button">
                ✕
              </button>
            </div>

            <div className="card-body">
              <div className="detail-block">
                <div className="detail-label">Question</div>
                <div className="detail-value">{getQuestion(selectedPoll)}</div>
              </div>

              <div className="detail-grid">
                <div className="detail-block">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">
                    <StatusBadge status={getStatus(selectedPoll)} />
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Allow Multiple</div>
                  <div className="detail-value">{getAllowMultiple(selectedPoll) ? "Yes" : "No"}</div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Max Choice</div>
                  <div className="detail-value">{getMaxChoice(selectedPoll) ?? "-"}</div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Time Range</div>
                  <div className="detail-value muted">
                    {getStartAt(selectedPoll) ? dayjs(getStartAt(selectedPoll)).format("DD/MM/YYYY HH:mm") : "-"}{" "}
                    →{" "}
                    {getEndAt(selectedPoll) ? dayjs(getEndAt(selectedPoll)).format("DD/MM/YYYY HH:mm") : "-"}
                  </div>
                </div>
              </div>

              <div className="detail-block" style={{ marginTop: 10 }}>
                <div className="detail-label">Options</div>
                <div className="opt-list">
                  {getOptions(selectedPoll).length ? (
                    getOptions(selectedPoll).map((opt, idx) => (
                      <div className="opt-item" key={idx}>
                        <span className="opt-dot" />
                        <span className="opt-text">{optionLabel(opt)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No options in payload (backend may not preload options).</div>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button className="btn btn-outline" onClick={closeDetail} type="button">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmOpen && (
        <div className="modal-backdrop" onMouseDown={() => setConfirmOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title">{confirmTitle}</div>
            <div className="modal-sub">{confirmDesc}</div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setConfirmOpen(false)} type="button">
                Cancel
              </button>
              <button
                className={confirmDanger ? "btn btn-danger" : "btn btn-primary"}
                onClick={runConfirm}
                type="button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPolls;
