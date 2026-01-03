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
  | "OPEN"
  | "UPCOMING"
  | "UNKNOWN";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const toFullUrl = (u?: string) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:") ||
    s.startsWith("blob:")
  )
    return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
};

const StatusBadge = ({ status }: { status: StatusName }) => {
  const cls =
    status === "PENDING_REVIEW"
      ? "badge badge-pending"
      : status === "PUBLISHED" || status === "OPEN" || status === "UPCOMING"
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

  // Detail Card Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  // Reject Modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectPollId, setRejectPollId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Lightbox (ดูรูปใหญ่)
  const [imgOpen, setImgOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const openImg = (src: string) => {
    if (!src) return;
    setImgSrc(src);
    setImgOpen(true);
  };
  const closeImg = () => {
    setImgOpen(false);
    setImgSrc("");
  };

  useEffect(() => {
    fetchPolls(filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchPolls = async (statusID: number) => {
    setLoading(true);
    try {
      // ✅ ถ้าเลือก Closed (5) แต่ DB ยังไม่ set เป็น CLOSED
      // ให้ดึง PUBLISHED (3) มาก่อน แล้วค่อย filter ด้วย computed_status ใน FE
      const requestStatus = statusID === 5 ? 3 : statusID;

      const res = await adminPollAPI.list(requestStatus);
      const rows = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      const list = Array.isArray(rows) ? rows : [];

      if (statusID === 5) {
        // filter เฉพาะ computed CLOSED หรือ DB CLOSED
        const closedOnly = list.filter((p: Poll) => {
          const ds = getDisplayStatus(p);
          return ds === "CLOSED";
        });
        setPolls(closedOnly);
      } else if (statusID === 3) {
        // ✅ FIX: Published (ตามที่หนูเลือกแบบ 1) = OPEN + UPCOMING + (fallback PUBLISHED) เท่านั้น
        // ไม่เอา CLOSED ปนเข้ามา
        const publishedLike = list.filter((p: Poll) => {
          const ds = getDisplayStatus(p);
          return ds === "OPEN" || ds === "UPCOMING" || ds === "PUBLISHED";
        });
        setPolls(publishedLike);
      } else {
        setPolls(list);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load polls");
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  // helpers
  const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
  const getQuestion = (p: Poll) => (p as any).question ?? "";
  const getDescription = (p: Poll) => (p as any).description ?? (p as any).Description ?? "";
  const getAuthorId = (p: Poll) => (p as any).member_id ?? (p as any).MemberID ?? "-";
  const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;
  const getUpdatedAt = (p: Poll) => (p as any).updated_at ?? (p as any).UpdatedAt ?? null;

  const getBaseStatus = (p: Poll): StatusName => {
    const name =
      ((p as any)?.status_name as StatusName | undefined) ??
      ((p as any)?.StatusName as StatusName | undefined) ??
      ((p as any)?.poll_status?.name as StatusName | undefined);

    if (name) return name;

    const sid =
      (p as any)?.status_id ??
      (p as any)?.poll_status_id ??
      (p as any)?.StatusID ??
      (p as any)?.PollStatusID;

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

  // ✅ computed_status จาก backend
  const getComputedStatus = (p: Poll): "OPEN" | "UPCOMING" | "CLOSED" | "" => {
    const csRaw =
      (p as any)?.computed_status ??
      (p as any)?.computedStatus ??
      (p as any)?.ComputedStatus ??
      "";
    const cs = String(csRaw || "").toUpperCase();
    if (cs === "OPEN" || cs === "UPCOMING" || cs === "CLOSED") return cs as any;
    return "";
  };

  // ✅ สถานะที่เอาไปแสดง/นับ/กรอง
  const getDisplayStatus = (p: Poll): StatusName => {
    const base = getBaseStatus(p);
    if (base !== "PUBLISHED") return base;

    const cs = getComputedStatus(p);
    if (cs === "CLOSED") return "CLOSED";
    if (cs === "UPCOMING") return "UPCOMING";
    if (cs === "OPEN") return "OPEN";
    return "PUBLISHED";
  };

  const getAllowMultiple = (p: Poll) =>
    Boolean((p as any)?.allow_multiple ?? (p as any)?.AllowMultiple ?? false);

  const getMaxChoice = (p: Poll) => (p as any)?.max_choice ?? (p as any)?.MaxChoice ?? null;

  const getStartAt = (p: Poll) => (p as any)?.start_at ?? (p as any)?.StartAt ?? null;
  const getEndAt = (p: Poll) => (p as any)?.end_at ?? (p as any)?.EndAt ?? null;

  // categories (รองรับทั้ง title / name / และ fallback เป็น *_id)
  const getMainCategory = (p: Poll) =>
    (p as any)?.main_category?.title ??
    (p as any)?.main_category?.name ??
    (p as any)?.MainCategory?.Title ??
    (p as any)?.MainCategory?.Name ??
    (p as any)?.main_category_title ??
    (p as any)?.MainCategoryTitle ??
    "";

  const getSub1Category = (p: Poll) =>
    (p as any)?.sub_category_l1?.title ??
    (p as any)?.sub_category_l1?.name ??
    (p as any)?.SubCategoryL1?.Title ??
    (p as any)?.SubCategoryL1?.Name ??
    (p as any)?.sub_category_l1_title ??
    (p as any)?.SubCategoryL1Title ??
    "";

  const getSub2Category = (p: Poll) =>
    (p as any)?.sub_category_l2?.title ??
    (p as any)?.sub_category_l2?.name ??
    (p as any)?.SubCategoryL2?.Title ??
    (p as any)?.SubCategoryL2?.Name ??
    (p as any)?.sub_category_l2_title ??
    (p as any)?.SubCategoryL2Title ??
    "";

  // optional: backend อาจส่งชื่อมา
  const getAuthorName = (p: Poll) =>
    (p as any).member?.name || (p as any).member?.username || (p as any).author_name || "";

  const getRejectReason = (p: Poll) =>
    (p as any)?.last_reject_reason ??
    (p as any)?.LastRejectReason ??
    (p as any)?.lastRejectReason ??
    "";

  // ✅ options: รองรับทั้ง poll_options / options
  const getOptions = (p: Poll) => (((p as any).poll_options || (p as any).options || []) as any[]);

  const optionLabel = (opt: any) =>
    opt?.label ?? opt?.text ?? opt?.title ?? opt?.option_text ?? opt?.OptionText ?? opt?.name ?? "-";

  const optionImgRaw = (opt: any) => opt?.img_url ?? opt?.ImgURL ?? opt?.image_url ?? opt?.imgUrl ?? "";

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
    const count = (s: StatusName) => all.filter((p) => getDisplayStatus(p) === s).length;

    // ✅ Published = OPEN + UPCOMING + PUBLISHED (fallback)
    const publishedLike = all.filter((p) => {
      const ds = getDisplayStatus(p);
      return ds === "OPEN" || ds === "UPCOMING" || ds === "PUBLISHED";
    }).length;

    return {
      total: all.length,
      pending: count("PENDING_REVIEW"),
      published: publishedLike,
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

  // Detail open/close
  const openDetail = (p: Poll) => {
    console.log("selectedPoll:", p);
    setSelectedPoll(p);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedPoll(null);
    closeImg();
  };

  const canApproveReject = (p: Poll) => getBaseStatus(p) === "PENDING_REVIEW";

  // ✅ ปุ่ม Close: เฉพาะโพลที่ยัง “เปิด/กำลังจะมา” (ยังไม่ CLOSED ตามเวลา)
  const canClose = (p: Poll) => {
    const base = getBaseStatus(p);
    const ds = getDisplayStatus(p);
    return base === "PUBLISHED" && ds !== "CLOSED";
  };

  const canDelete = (p: Poll) => {
    const s = getDisplayStatus(p);
    return s === "REJECTED" || s === "CLOSED" || s === "DRAFT";
  };

  const formatDT = (d: any) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

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
              <option value={1}>Draft</option>
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
                <th style={{ width: 160 }}>Created</th>
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
                  const s = getDisplayStatus(p);
                  const question = getQuestion(p);
                  const authorId = getAuthorId(p);
                  const authorName = getAuthorName(p);
                  const created = getCreatedAt(p);

                  return (
                    <tr key={id}>
                      <td className="mono">{id}</td>

                      <td className="question">
                        <button className="link-btn" onClick={() => openDetail(p)} type="button">
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
                          <button className="btn btn-outline" onClick={() => openDetail(p)} type="button">
                            👁 View
                          </button>

                          {getBaseStatus(p) === "PENDING_REVIEW" && (
                            <>
                              <button className="btn btn-primary" onClick={() => approve(id)} type="button">
                                ✅ Approve
                              </button>
                              <button className="btn btn-danger" onClick={() => openReject(id)} type="button">
                                ❌ Reject
                              </button>
                            </>
                          )}

                          {canClose(p) && (
                            <button className="btn btn-outline" onClick={() => closePoll(id)} type="button">
                              ⛔ Close
                            </button>
                          )}

                          {canDelete(p) && (
                            <button className="btn btn-ghost-danger" onClick={() => deletePoll(id)} type="button">
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

              {getDescription(selectedPoll) ? (
                <div className="detail-block">
                  <div className="detail-label">Description</div>
                  <div className="detail-value">{getDescription(selectedPoll)}</div>
                </div>
              ) : null}

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
                    <StatusBadge status={getDisplayStatus(selectedPoll)} />
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
                    {formatDT(getStartAt(selectedPoll))} → {formatDT(getEndAt(selectedPoll))}
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Created / Updated</div>
                  <div className="detail-value muted">
                    {formatDT(getCreatedAt(selectedPoll))} • {formatDT(getUpdatedAt(selectedPoll))}
                  </div>
                </div>
              </div>

              {/* Category (แบบเดียวกับ MyPoll detail) */}
              {(getMainCategory(selectedPoll) || getSub1Category(selectedPoll) || getSub2Category(selectedPoll)) && (
                <div className="detail-block" style={{ marginTop: 10 }}>
                  <div className="detail-label">Category</div>

                  <div className="detail-value cat-box">
                    {getMainCategory(selectedPoll) ? (
                      <div className="cat-row">
                        <span className="cat-k">หมวดหลัก:</span>
                        <span className="cat-v">{getMainCategory(selectedPoll)}</span>
                      </div>
                    ) : null}

                    {getSub1Category(selectedPoll) ? (
                      <div className="cat-row">
                        <span className="cat-k">หมวดย่อย 1:</span>
                        <span className="cat-v">{getSub1Category(selectedPoll)}</span>
                      </div>
                    ) : null}

                    {getSub2Category(selectedPoll) ? (
                      <div className="cat-row">
                        <span className="cat-k">หมวดย่อย 2:</span>
                        <span className="cat-v">{getSub2Category(selectedPoll)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Reject reason */}
              {getBaseStatus(selectedPoll) === "REJECTED" && (
                <div className="detail-block" style={{ marginTop: 10 }}>
                  <div className="detail-label">Reject Reason</div>
                  <div className="detail-value">{getRejectReason(selectedPoll)?.trim() || "-"}</div>
                </div>
              )}

              {/* ✅ Options (match member UI + clickable image) */}
              <div className="detail-block" style={{ marginTop: 10 }}>
                <div className="detail-label">
                  Options <span className="muted">({getOptions(selectedPoll).length})</span>
                </div>

                {getOptions(selectedPoll).length === 0 ? (
                  <div className="muted" style={{ marginTop: 8 }}>
                    No options in payload.
                  </div>
                ) : (
                  <div className="opt-grid">
                    {getOptions(selectedPoll).map((opt: any, idx: number) => {
                      const raw =
                        opt?.img_url ?? opt?.ImgURL ?? opt?.image_url ?? opt?.imageUrl ?? opt?.imgUrl ?? "";
                      const img = raw ? toFullUrl(raw) : "";

                      return (
                        <div className="opt-item" key={opt.ID || opt.id || idx}>
                          {/* ✅ ถ้าไม่มีรูป = ไม่ต้องโชว์อะไรเลย */}
                          {img ? (
                            <button
                              type="button"
                              className="opt-imgBtn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openImg(img); // ✅ เปิด overlay
                              }}
                              onMouseDown={(e) => {
                                // กันบางกรณีที่ parent ใช้ onMouseDown ปิด modal
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              title="ดูรูป"
                            >
                              <img
                                className="opt-img"
                                src={img}
                                alt={optionLabel(opt) || `Option ${idx + 1}`}
                                draggable={false}
                              />
                            </button>
                          ) : null}

                          <div className="opt-meta">
                            <div className="opt-title">Option {idx + 1}</div>
                            <div className="opt-text">{optionLabel(opt) || "-"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* actions */}
              <div className="card-actions">
                {canApproveReject(selectedPoll) && (
                  <>
                    <button className="btn btn-primary" onClick={() => approve(getId(selectedPoll))} type="button">
                      ✅ Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => openReject(getId(selectedPoll))} type="button">
                      ❌ Reject
                    </button>
                  </>
                )}

                {canClose(selectedPoll) && (
                  <button className="btn btn-outline" onClick={() => closePoll(getId(selectedPoll))} type="button">
                    ⛔ Close Poll
                  </button>
                )}

                {canDelete(selectedPoll) && (
                  <button className="btn btn-ghost-danger" onClick={() => deletePoll(getId(selectedPoll))} type="button">
                    🗑 Delete
                  </button>
                )}

                <button className="btn btn-outline" onClick={closeDetail} type="button">
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* lightbox */}
          {imgOpen && (
            <div className="img-overlay" onMouseDown={closeImg}>
              <div className="img-modal" onMouseDown={(e) => e.stopPropagation()}>
                <button type="button" className="img-close" onClick={closeImg}>
                  ✕
                </button>
                <img className="img-full" src={imgSrc} alt="poll option" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* REJECT MODAL */}
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
              <button className="btn btn-outline" onClick={() => setRejectOpen(false)} type="button">
                Cancel
              </button>
              <button className="btn btn-danger" onClick={submitReject} type="button">
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
