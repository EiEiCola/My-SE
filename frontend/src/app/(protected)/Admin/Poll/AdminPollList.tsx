import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "./AdminPollList.css";
import { adminPollAPI } from "../../../../services/http/admin_poll";
import { type Poll } from "../../../../services/http/poll";

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

const AdminPollList: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [filterStatus, setFilterStatus] = useState<number>(2); // default pending
    const [q, setQ] = useState("");

    // ✅ Detail Card Modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

    // ✅ Reject Modal
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectPollId, setRejectPollId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        fetchPolls(filterStatus);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    const fetchPolls = async (statusID: number) => {
        setLoading(true);
        try {
            const res = await adminPollAPI.list(statusID);

            // รองรับทั้ง res.data.data หรือ res.data
            const rows = (res as any)?.data?.data ?? (res as any)?.data ?? [];
            setPolls(Array.isArray(rows) ? rows : []);
        } catch (e) {
            console.error(e);
            alert("Failed to load polls");
            setPolls([]);
        } finally {
            setLoading(false);
        }
    };

    // helpers (กัน key ไม่ตรง ID/id)
    const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
    const getQuestion = (p: Poll) => (p as any).question ?? "";
    const getAuthorId = (p: Poll) => (p as any).member_id ?? "-";
    const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;
    const getStatus = (p: Poll): StatusName =>
        ((p as any).poll_status?.name as StatusName) || "UNKNOWN";

    // optional: backend อาจส่งชื่อมา
    const getAuthorName = (p: Poll) =>
        (p as any).member?.name ||
        (p as any).member?.username ||
        (p as any).author_name ||
        "";

    const getOptions = (p: Poll) => ((p as any).poll_options || (p as any).options || []) as any[];

    const filtered = useMemo(() => {
        const keyword = q.trim().toLowerCase();
        if (!keyword) return polls;

        return polls.filter((p) => {
            const question = String(getQuestion(p)).toLowerCase();
            const author = String(getAuthorId(p));
            const idStr = String(getId(p));
            return question.includes(keyword) || author.includes(keyword) || idStr.includes(keyword);
        });
    }, [polls, q]);

    const stats = useMemo(() => {
        const all = polls;
        const count = (s: StatusName) => all.filter((p) => getStatus(p) === s).length;
        return {
            total: all.length,
            pending: count("PENDING_REVIEW"),
            published: count("PUBLISHED"),
            rejected: count("REJECTED"),
            closed: count("CLOSED"),
            draft: count("DRAFT"),
        };
    }, [polls]);

    const confirmAction = async (title: string, detail: string, onYes: () => Promise<void>) => {
        const ok = window.confirm(`${title}\n\n${detail}`);
        if (!ok) return;
        await onYes();
    };

    const approve = async (id: number) => {
        await confirmAction("Approve this poll?", "It will be published immediately.", async () => {
            try {
                await adminPollAPI.approve(id);
                await fetchPolls(filterStatus);
                // ถ้าเปิด detail อยู่ ให้ sync ใหม่
                if (selectedPoll && getId(selectedPoll) === id) {
                    setSelectedPoll({ ...(selectedPoll as any) });
                }
            } catch {
                alert("Failed to approve");
            }
        });
    };

    const openReject = (id: number) => {
        setRejectPollId(id);
        setRejectReason("");
        setRejectOpen(true);
    };

    const submitReject = async () => {
        if (!rejectPollId) return;
        if (!rejectReason.trim()) return alert("Please provide a reason");

        try {
            await adminPollAPI.reject(rejectPollId, rejectReason.trim());
            setRejectOpen(false);
            await fetchPolls(filterStatus);
        } catch {
            alert("Failed to reject");
        }
    };

    const closePoll = async (id: number) => {
        await confirmAction("Close this poll?", "Users will no longer be able to vote.", async () => {
            try {
                await adminPollAPI.close(id);
                await fetchPolls(filterStatus);
            } catch {
                alert("Failed to close poll");
            }
        });
    };

    const deletePoll = async (id: number) => {
        await confirmAction("Delete this poll?", "This action cannot be undone.", async () => {
            try {
                await adminPollAPI.delete(id);
                await fetchPolls(filterStatus);
                if (selectedPoll && getId(selectedPoll) === id) {
                    setDetailOpen(false);
                    setSelectedPoll(null);
                }
            } catch {
                alert("Failed to delete poll");
            }
        });
    };

    // ✅ Detail open/close
    const openDetail = (p: Poll) => {
        setSelectedPoll(p);
        setDetailOpen(true);
    };
    const closeDetail = () => {
        setDetailOpen(false);
        setSelectedPoll(null);
    };

    const canApproveReject = (p: Poll) => (p as any).poll_status?.name === "PENDING_REVIEW";
    const canClose = (p: Poll) => (p as any).poll_status?.name === "PUBLISHED";
    const canDelete = (p: Poll) => {
        const s = (p as any).poll_status?.name;
        return s === "REJECTED" || s === "CLOSED" || s === "DRAFT";
    };

    return (
        <div className="poll-admin-page">
            {/* HERO */}
            <div className="poll-admin-hero">
                <div>
                    <div className="title">Poll Management</div>
                    <div className="subtitle">Review & moderate polls (orange theme).</div>
                </div>

                <div className="toolbar">
                    <div className="searchbox">
                        <span className="search-ico">⌕</span>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by question, author id, poll id..."
                        />
                    </div>

                    <div className="filter">
                        <span>Status</span>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(Number(e.target.value))}>
                            <option value={0}>All</option>
                            <option value={2}>Pending Review</option>
                            <option value={3}>Published</option>
                            <option value={4}>Rejected</option>
                            <option value={5}>Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* STATS */}
            <div className="stats">
                <div className="stat">
                    <div className="k">Total</div>
                    <div className="v">{stats.total}</div>
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
                <div className="stat">
                    <div className="k">Closed</div>
                    <div className="v">{stats.closed}</div>
                </div>
            </div>

            {/* TABLE */}
            <div className="table-card">
                <div className="table-head">
                    <div className="table-title">Polls</div>
                    {loading ? <div className="loading">Loading...</div> : null}
                </div>

                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 70 }}>ID</th>
                                <th>Question</th>
                                <th style={{ width: 220 }}>Author</th>
                                <th style={{ width: 170 }}>Status</th>
                                <th style={{ width: 140 }}>Created</th>
                                <th style={{ width: 380, textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty">
                                            <div className="empty-box">📦</div>
                                            <div className="empty-title">No data</div>
                                            <div className="empty-sub">Try changing status filter or seed some polls.</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => {
                                    const id = getId(p);
                                    const s = getStatus(p);
                                    const question = getQuestion(p);
                                    const authorId = getAuthorId(p);
                                    const authorName = getAuthorName(p);
                                    const created = getCreatedAt(p);

                                    return (
                                        <tr key={id}>
                                            <td className="mono">{id}</td>

                                            <td className="question">
                                                <button className="link-btn" onClick={() => openDetail(p)}>
                                                    {question}
                                                </button>
                                            </td>

                                            <td>
                                                <div className="author">
                                                    <div className="author-name">{authorName ? authorName : `Member #${authorId}`}</div>
                                                    <div className="author-sub">ID: {authorId}</div>
                                                </div>
                                            </td>

                                            <td>
                                                <StatusBadge status={s} />
                                            </td>

                                            <td className="muted">{created ? dayjs(created).format("DD/MM/YYYY") : "-"}</td>

                                            <td style={{ textAlign: "right" }}>
                                                <div className="actions">
                                                    <button className="btn btn-outline" onClick={() => openDetail(p)}>
                                                        👁 View
                                                    </button>

                                                    {s === "PENDING_REVIEW" && (
                                                        <>
                                                            <button className="btn btn-primary" onClick={() => approve(id)}>
                                                                ✅ Approve
                                                            </button>
                                                            <button className="btn btn-danger" onClick={() => openReject(id)}>
                                                                ❌ Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {s === "PUBLISHED" && (
                                                        <button className="btn btn-outline" onClick={() => closePoll(id)}>
                                                            ⛔ Close
                                                        </button>
                                                    )}

                                                    {(s === "REJECTED" || s === "CLOSED" || s === "DRAFT") && (
                                                        <button className="btn btn-ghost-danger" onClick={() => deletePoll(id)}>
                                                            🗑 Delete
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
                                    <div className="detail-label">Author</div>
                                    <div className="detail-value">
                                        <span className="chip">ID {getAuthorId(selectedPoll)}</span>
                                        {!!getAuthorName(selectedPoll) && (
                                            <span className="muted" style={{ marginLeft: 8 }}>
                                                {getAuthorName(selectedPoll)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-block">
                                    <div className="detail-label">Status</div>
                                    <div className="detail-value">
                                        <StatusBadge status={getStatus(selectedPoll)} />
                                    </div>
                                </div>

                                <div className="detail-block">
                                    <div className="detail-label">Allow Multiple</div>
                                    <div className="detail-value">{(selectedPoll as any).allow_multiple ? "Yes" : "No"}</div>
                                </div>

                                <div className="detail-block">
                                    <div className="detail-label">Max Choice</div>
                                    <div className="detail-value">{(selectedPoll as any).max_choice ?? "-"}</div>
                                </div>
                            </div>

                            <div className="detail-block">
                                <div className="detail-label">Options</div>

                                <div className="option-list">
                                    {getOptions(selectedPoll).length === 0 ? (
                                        <div className="muted" style={{ marginTop: 8 }}>
                                            No options in payload.
                                        </div>
                                    ) : (
                                        getOptions(selectedPoll).map((opt: any) => (
                                            <div className="option-item" key={opt.ID || opt.id || opt.text}>
                                                <div className="option-dot" />
                                                <div className="option-text">{opt.text || opt.title || "-"}</div>
                                                {opt.image_url && <img className="option-img" src={opt.image_url} alt="" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="card-actions">
                                {canApproveReject(selectedPoll) && (
                                    <>
                                        <button className="btn btn-primary" onClick={() => approve(getId(selectedPoll))}>
                                            ✅ Approve
                                        </button>
                                        <button className="btn btn-danger" onClick={() => openReject(getId(selectedPoll))}>
                                            ❌ Reject
                                        </button>
                                    </>
                                )}

                                {canClose(selectedPoll) && (
                                    <button className="btn btn-outline" onClick={() => closePoll(getId(selectedPoll))}>
                                        ⛔ Close Poll
                                    </button>
                                )}

                                {canDelete(selectedPoll) && (
                                    <button className="btn btn-ghost-danger" onClick={() => deletePoll(getId(selectedPoll))}>
                                        🗑 Delete
                                    </button>
                                )}

                                <button className="btn btn-outline" onClick={closeDetail}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ REJECT MODAL */}
            {rejectOpen && (
                <div className="modal-backdrop" onMouseDown={() => setRejectOpen(false)}>
                    <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-title">Reject Poll</div>
                        <div className="modal-sub">Please provide a reason for rejection:</div>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason..."
                            rows={5}
                        />

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setRejectOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={submitReject}>
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPollList;
