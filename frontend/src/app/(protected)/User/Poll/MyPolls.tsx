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

  // detail card
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  // confirm modal (custom)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  // helpers (กัน key ไม่ตรง)
  const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
  const getQuestion = (p: Poll) => (p as any).question ?? "";
  const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;
  const getStatus = (p: Poll): StatusName =>
    ((p as any).poll_status?.name as StatusName) || "UNKNOWN";
  const getOptions = (p: Poll) => ((p as any).poll_options || (p as any).options || []) as any[];

  const fetchPolls = async (statusID?: number) => {
    setLoading(true);
    try {
      const res = await pollAPI.getMyPolls(statusID);
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

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    const list = polls;

    const tabFiltered =
      activeTab === 0 ? list : list.filter((p) => mapStatusToId(getStatus(p)) === activeTab);

    if (!keyword) return tabFiltered;

    return tabFiltered.filter((p) => {
      const idStr = String(getId(p));
      const question = String(getQuestion(p)).toLowerCase();
      return idStr.includes(keyword) || question.includes(keyword);
    });
  }, [polls, q, activeTab]);

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

  function mapStatusToId(s: StatusName) {
    // ตามที่หนูใช้ใน tabs: 1 draft, 2 pending, 3 published, 4 rejected
    if (s === "DRAFT") return 1;
    if (s === "PENDING_REVIEW") return 2;
    if (s === "PUBLISHED") return 3;
    if (s === "REJECTED") return 4;
    if (s === "CLOSED") return 5;
    return 0;
  }

  // custom confirm
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

  // actions
  const handleDelete = (id: number) => {
    openConfirm(
      "Delete this poll?",
      "This action cannot be undone.",
      true,
      async () => {
        await pollAPI.deletePoll(id);
        const status = activeTab === 0 ? undefined : activeTab;
        await fetchPolls(status);
      }
    );
  };

  const handleSubmit = (id: number) => {
    openConfirm(
      "Submit for Review?",
      "You won't be able to edit this poll while it's pending review.",
      false,
      async () => {
        await pollAPI.submitForReview(id);
        const status = activeTab === 0 ? undefined : activeTab;
        await fetchPolls(status);
      }
    );
  };

  const handleCancel = (id: number) => {
    openConfirm(
      "Cancel Request?",
      "This will cancel your submission and move it back to Draft.",
      true,
      async () => {
        await pollAPI.cancelRequest(id);
        const status = activeTab === 0 ? undefined : activeTab;
        await fetchPolls(status);
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
  const canViewResult = (p: Poll) => getStatus(p) === "PUBLISHED";

  const tabs = [
    { id: 0, label: "All", count: stats.total },
    { id: 1, label: "Drafts", count: stats.draft },
    { id: 2, label: "Pending", count: stats.pending },
    { id: 3, label: "Published", count: stats.published },
    { id: 4, label: "Rejected", count: stats.rejected },
    { id: 5, label: "Closed", count: stats.closed },
  ];

  return (
    <div className="my-polls-page">
      {/* HERO */}
      <div className="my-hero">
        <div>
          <div className="my-title">My Polls</div>
          <div className="my-sub">Create, edit, submit and track your polls.</div>
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

      {/* TABS */}
      <div className="my-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={activeTab === t.id ? "tab tab-active" : "tab"}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* TABLE CARD */}
      <div className="my-card">
        <div className="my-card-head">
          <div className="my-card-title">Poll List</div>
          {loading ? <div className="my-loading">Loading...</div> : null}
        </div>

        <div className="my-table-wrap">
          <table className="my-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Question</th>
                <th style={{ width: 160 }}>Status</th>
                <th style={{ width: 180 }}>Created</th>
                <th style={{ width: 360, textAlign: "right" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="my-empty">
                      <div className="my-empty-ico">📦</div>
                      <div className="my-empty-title">No polls</div>
                      <div className="my-empty-sub">Try changing tab or create a new poll.</div>
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
                        <button className="link-btn" onClick={() => openDetail(p)}>
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
                          <button className="btn btn-outline" onClick={() => openDetail(p)}>
                            👁 Detail
                          </button>

                          {canEditSubmitDelete(p) && (
                            <>
                              <button
                                className="btn btn-outline"
                                onClick={() => navigate(`/User/Polls/edit/${id}`)}
                              >
                                ✏️ Edit
                              </button>
                              <button className="btn btn-primary" onClick={() => handleSubmit(id)}>
                                📤 Submit
                              </button>
                              <button className="btn btn-ghost-danger" onClick={() => handleDelete(id)}>
                                🗑 Delete
                              </button>
                            </>
                          )}

                          {canCancel(p) && (
                            <button className="btn btn-danger" onClick={() => handleCancel(id)}>
                              ⛔ Cancel
                            </button>
                          )}

                          {canViewResult(p) && (
                            <button
                              className="btn btn-outline"
                              onClick={() => navigate(`/User/Polls/${id}`)}
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

      {/* ✅ DETAIL CARD MODAL */}
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

              <button className="icon-btn" onClick={closeDetail}>
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
                  <div className="detail-label">Options</div>
                  <div className="detail-value muted">
                    {getOptions(selectedPoll).length ? `${getOptions(selectedPoll).length} options` : "No options in payload"}
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn btn-outline" onClick={closeDetail}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CONFIRM MODAL */}
      {confirmOpen && (
        <div className="modal-backdrop" onMouseDown={() => setConfirmOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title">{confirmTitle}</div>
            <div className="modal-sub">{confirmDesc}</div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className={confirmDanger ? "btn btn-danger" : "btn btn-primary"}
                onClick={runConfirm}
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
