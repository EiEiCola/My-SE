// frontend/src/app/(protected)/User/Poll/PollDetail.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./PollDetail.css";
import { createPortal } from "react-dom";

import {
  pollAPI,
  type Poll,
  type PollResultsResponse,
  type MyVoteResponse,
  toFullUrl,
} from "../../../../services/http/poll";

dayjs.extend(relativeTime);

type UiStatus = "UPCOMING" | "OPEN" | "CLOSED";

const clampStr = (s: any) => String(s ?? "").trim();

const base64UrlJson = (part: string) => {
  let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return JSON.parse(atob(b64));
};

const getMyIdFromToken = () => {
  const token = localStorage.getItem("token") || "";
  if (!token.includes(".")) return 0;

  try {
    const payload = base64UrlJson(token.split(".")[1]);
    const id = Number(
      payload?.member_id ??
        payload?.memberId ??
        payload?.user_id ??
        payload?.userId ??
        payload?.id ??
        payload?.sub ??
        0
    );
    return Number.isFinite(id) ? id : 0;
  } catch {
    return 0;
  }
};

const getAuthorName = (p: Poll | null) =>
  clampStr((p as any)?.author_name) || "ไม่เปิดเผยชื่อ";

const computeStatusFromDetail = (p: Poll | null): UiStatus => {
  if (!p) return "OPEN";

  // ถ้า backend ส่ง computed_status มา ใช้เลย
  const cs = clampStr((p as any).computed_status).toUpperCase();
  if (cs === "UPCOMING" || cs === "OPEN" || cs === "CLOSED") return cs as UiStatus;

  // fallback คำนวณเองจากเวลา
  const now = dayjs();
  const start = (p as any)?.start_at ? dayjs((p as any).start_at) : null;
  const end = (p as any)?.end_at ? dayjs((p as any).end_at) : null;

  if (end && now.isAfter(end)) return "CLOSED";
  if (start && now.isBefore(start)) return "UPCOMING";
  return "OPEN";
};

const isMulti = (p: Poll | null) => !!(p as any)?.allow_multiple;

const PollDetail: React.FC = () => {
  const nav = useNavigate();
  const params = useParams();
  const pollID = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const [poll, setPoll] = useState<Poll | null>(null);
  const [myVote, setMyVote] = useState<MyVoteResponse | null>(null);
  const [results, setResults] = useState<PollResultsResponse | null>(null);

  const [selected, setSelected] = useState<number[]>([]);
  const [imgModal, setImgModal] = useState<string | null>(null);

  const cs = useMemo(() => computeStatusFromDetail(poll), [poll]);
  const authorName = useMemo(() => getAuthorName(poll), [poll]);

  const voted = useMemo(() => {
    // priority: detail.has_voted (เพราะ backend เติมให้ได้)
    if (typeof (poll as any)?.has_voted === "boolean") return !!(poll as any).has_voted;
    return !!(myVote as any)?.has_voted;
  }, [poll, myVote]);

  const maxChoice = useMemo(() => {
    const v = ((poll as any)?.max_choice ?? undefined) as any;
    return typeof v === "number" ? v : undefined;
  }, [poll]);

  // ===========================
  // ✅ NEW: prevent owner voting
  // ===========================
const myMemberId = getMyIdFromToken();


const ownerId = useMemo(() => {
  const v = Number(
    (poll as any)?.created_by_id ??
      (poll as any)?.CreatedByID ??
      (poll as any)?.created_by ??
      (poll as any)?.creator_id ??
      (poll as any)?.creatorId ??
      (poll as any)?.owner_id ??
      (poll as any)?.member_id ??
      (poll as any)?.MemberID ??
      (poll as any)?.member?.id ??
      (poll as any)?.Member?.ID ??
      0
  );
  return Number.isFinite(v) ? v : 0;
}, [poll]);


const isOwner = useMemo(() => myMemberId > 0 && ownerId > 0 && myMemberId === ownerId, [myMemberId, ownerId]);

const ownerLocked = isOwner; // ✅ เจ้าของกดเลือกไม่ได้
const canVote = useMemo(() => cs === "OPEN" && !voted && !isOwner && myMemberId > 0, [cs, voted, isOwner, myMemberId]);

  const optionRows = useMemo(() => {
    const opts = (((poll as any)?.options ?? []) as any[]) || [];
    // แปลง img_url เป็น full url
    return opts.map((o) => ({
      ...o,
      img_url: toFullUrl(o.img_url),
    }));
  }, [poll]);

  const clearToastLater = () => {
    window.clearTimeout((clearToastLater as any)._t);
    (clearToastLater as any)._t = window.setTimeout(() => setToast(""), 2200);
  };

  const syncSelectedFromVote = (mv: MyVoteResponse | null, detail: Poll | null) => {
    if ((mv as any)?.has_voted && Array.isArray((mv as any)?.option_ids)) {
      setSelected((mv as any).option_ids);
      return;
    }
    const hv = !!(detail as any)?.has_voted;
    const ids = ((((detail as any)?.my_option_ids ?? []) as number[]) ?? []) as number[];
    if (hv && Array.isArray(ids)) setSelected(ids);
  };

  const load = async () => {
    if (!pollID || Number.isNaN(pollID)) {
      setErr("poll id ไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    setErr("");
    setToast("");

    try {
      // 1) detail (published/closed)
      const detailRes = await pollAPI.getPublishedById(pollID);
      const detail = (detailRes as any).data as Poll;
      setPoll(detail);

      // 2) my-vote (optional แต่ช่วยให้ UI เสถียร)
      let mvLocal: MyVoteResponse | null = null;
      try {
        const mvRes = await pollAPI.getMyVote(pollID);
        mvLocal = (mvRes as any).data as MyVoteResponse;
        setMyVote(mvLocal);
      } catch {
        // fallback ใช้จาก detail
        mvLocal = {
          has_voted: !!(detail as any).has_voted,
          option_ids: ((((detail as any).my_option_ids ?? []) as number[]) ?? []) as number[],
        } as any;
        setMyVote(mvLocal);
      }

      // sync selected ทันที
      syncSelectedFromVote(mvLocal, detail);

      // 3) results (กติกา)
      // ⚠️ คำนวณจาก detail ทันที ไม่ใช้ state เพื่อกัน setPoll ยังไม่ทัน
     // ... หลัง syncSelectedFromVote(mvLocal, detail);

// 3) results (กติกา)
const localCs = computeStatusFromDetail(detail);
const localVoted =
  typeof (detail as any)?.has_voted === "boolean"
    ? !!(detail as any).has_voted
    : !!(mvLocal as any)?.has_voted;

const localOwnerId =
  Number(
    (detail as any)?.created_by_id ??
      (detail as any)?.CreatedByID ??
      (detail as any)?.created_by ??
      (detail as any)?.creator_id ??
      (detail as any)?.owner_id ??
      (detail as any)?.member_id ??
      (detail as any)?.MemberID ??
      0
  ) || 0;

const localMyId = getMyIdFromToken();
const localIsOwner = localOwnerId > 0 && localMyId > 0 && localOwnerId === localMyId;

const shouldFetchResults = localCs === "CLOSED" || (localCs === "OPEN" && (localVoted || localIsOwner));

if (shouldFetchResults) {
  try {
    const rsRes = await pollAPI.getResults(pollID);
    const rs = (rsRes as any).data as PollResultsResponse;
    setResults(rs);
  } catch (e: any) {
    console.warn("[PollDetail] getResults failed:", e?.response?.status, e?.response?.data || e?.message);

    // ✅ สำคัญ: ห้ามทำให้ทั้งหน้า fail
    setResults(null);

    // เธออยากให้เจ้าของดูได้ → ถ้า fail ให้โชว์ข้อความเตือนนิดหน่อย
    if (localIsOwner) {
      setToast("ดูผลโหวตไม่ได้ (API /results ตอบ error) — ต้องแก้ฝั่ง backend");
      clearToastLater();
    }
  }
} else {
  setResults(null);
}



    } catch (e: any) {
      setErr(e?.message || "โหลดรายละเอียดโพลไม่สำเร็จ");
      setPoll(null);
      setResults(null);
      setMyVote(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollID]);

  const togglePick = (optID: number) => {
    if (!canVote) return;
    if (!poll) return;

    if (!isMulti(poll)) {
      setSelected([optID]);
      return;
    }

    setSelected((prev) => {
      const has = prev.includes(optID);
      const next = has ? prev.filter((x) => x !== optID) : [...prev, optID];

      if (typeof maxChoice === "number" && maxChoice > 0 && next.length > maxChoice) {
        setToast(`เลือกได้สูงสุด ${maxChoice} ตัวเลือก`);
        clearToastLater();
        return prev;
      }
      return next;
    });
  };

  const submitVote = async () => {
    if (!poll) return;
    if (!canVote) return;

    // ✅ NEW: guard (extra safety)
    if (isOwner) {
      setToast("คุณเป็นเจ้าของโพล จึงโหวตโพลของตัวเองไม่ได้");
      clearToastLater();
      return;
    }

    const ids = Array.from(new Set(selected)).filter((x) => x > 0);

    if (ids.length === 0) {
      setToast("กรุณาเลือกตัวเลือกก่อน");
      clearToastLater();
      return;
    }

    if (!(poll as any)?.allow_multiple && ids.length !== 1) {
      setToast("โพลนี้เลือกได้แค่ 1 ตัวเลือก");
      clearToastLater();
      return;
    }

    if ((poll as any)?.allow_multiple && typeof maxChoice === "number" && maxChoice > 0 && ids.length > maxChoice) {
      setToast(`เลือกได้สูงสุด ${maxChoice} ตัวเลือก`);
      clearToastLater();
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setToast("");

      await pollAPI.vote(pollID, { option_ids: ids });

      setToast("โหวตสำเร็จ ✅");
      clearToastLater();

      // หลังโหวต: โหลด detail + my-vote + results ใหม่ให้ครบ
      await load();
    } catch (e: any) {
      const msg = String((e as any)?.response?.data?.error || (e as any)?.message || "โหวตไม่สำเร็จ");

      if (msg.includes("already_voted")) setToast("โหวตไปแล้ว");
      else if (msg.includes("poll_not_started")) setToast("โพลยังไม่เริ่ม");
      else if (msg.includes("poll_closed")) setToast("โพลปิดแล้ว");
      else if (msg.includes("poll_not_open")) setToast("โพลยังไม่เปิดโหวต");
      else if (msg.includes("owner_cannot_vote")) setToast("คุณเป็นเจ้าของโพล จึงโหวตโพลของตัวเองไม่ได้");
      else if ((e as any)?.response?.status === 403) setToast("คุณไม่มีสิทธิ์โหวตโพลนี้");
      else setToast(msg);

      clearToastLater();
    } finally {
      setLoading(false);
    }
  };

  const badge = (s: UiStatus) => {
    if (s === "OPEN") return <span className="pd-badge pd-open">OPEN</span>;
    if (s === "UPCOMING") return <span className="pd-badge pd-upcoming">UPCOMING</span>;
    return <span className="pd-badge pd-closed">CLOSED</span>;
  };

  const pill = (text: string) => <span className="pd-pill">{text}</span>;

  const catPath = useMemo(() => {
    const mc = (poll as any)?.main_category?.title;
    const l1 = (poll as any)?.sub_category_l1?.title;
    const l2 = (poll as any)?.sub_category_l2?.title;

    const parts = [mc, l1, l2].map((x) => clampStr(x)).filter(Boolean);
    return parts;
  }, [poll]);

  const isSelected = (id: number) => selected.includes(id);

  const myChoiceText = useMemo(() => {
    if (!voted) return "";
    const ids = selected;
    if (!ids?.length) return "";
    const opts = (((poll as any)?.options ?? []) as any[]) || [];
    if (!opts.length) return "";
    const map = new Map<number, string>();
    opts.forEach((o) => map.set(Number(o.id ?? o.ID), String(o.label ?? o.Label ?? "")));
    const names = ids.map((id) => map.get(id) || String(id)).filter(Boolean);
    return names.join(", ");
  }, [poll, selected, voted]);

  const totalVotes = useMemo(() => {
    const t = (results as any)?.total_votes ?? (results as any)?.total ?? 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }, [results]);

const resultsMode = useMemo(() => {
  return cs === "CLOSED" || (cs === "OPEN" && (voted || isOwner));
}, [cs, voted, isOwner]);


  // ✅ map result per option_id
  const rsMap = useMemo(() => {
    const m = new Map<number, { count: number; percent: number; img_url?: string; label?: string }>();
    if ((results as any)?.items?.length) {
      (results as any).items.forEach((it: any) => {
        m.set(Number(it.option_id ?? it.optionId), {
          count: Number(it.count ?? 0),
          percent: Number(it.percent ?? 0),
          img_url: it.img_url ? toFullUrl(it.img_url) : undefined,
          label: it.label,
        });
      });
    }
    return m;
  }, [results]);

  // ✅ สรุปอันดับ 1 (รองรับ tie)
  const topSummary = useMemo(() => {
    const items = ((results as any)?.items ?? []) as any[];
    if (!items.length) return null;

    const sorted = [...items].sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0));
    const topCount = Number(sorted[0]?.count ?? 0);
    const tops = sorted.filter((it) => Number(it.count ?? 0) === topCount);

    return { topCount, tops };
  }, [results]);

  const summaryLabel = useMemo(() => {
    if (!poll) return "ผลสรุป";
    return (poll as any)?.allow_multiple ? "ตัวเลือกยอดนิยม" : "โหวตมากที่สุด";
  }, [poll]);

  return (
    <div className="pd-page">
      {/* image modal */}
      {imgModal
        ? createPortal(
            <div className="img-modal" onClick={() => setImgModal(null)} role="presentation">
              <div className="img-modal-body" onClick={(e) => e.stopPropagation()} role="presentation">
                <button className="img-modal-close" onClick={() => setImgModal(null)} type="button">
                  ✕
                </button>
                <img className="img-modal-img" src={imgModal} alt="option" />
              </div>
            </div>,
            document.body
          )
        : null}

      <div className="pd-wrap">
        {/* HERO */}
        <div className="pd-hero">
          <div>
            <div className="pd-kicker">POLL DETAIL</div>
            <div className="pd-title">{(poll as any)?.question || (loading ? "กำลังโหลด..." : "ไม่พบโพล")}</div>

            <div className="pd-sub">
              {authorName ? <span className="pd-author">by {authorName}</span> : null}
              {(poll as any)?.created_at ? ` • Created ${dayjs((poll as any).created_at).fromNow()}` : ""}
              {(poll as any)?.start_at ? ` • Start ${dayjs((poll as any).start_at).format("DD/MM/YYYY HH:mm")}` : ""}
              {(poll as any)?.end_at ? ` • End ${dayjs((poll as any).end_at).format("DD/MM/YYYY HH:mm")}` : ""}
            </div>

            {catPath.length ? (
              <div className="pd-catRow" title={catPath.join(" / ")}>
                <span className="pd-catIcon">🏷️</span>
                {catPath.map((t, i) => (
                  <React.Fragment key={`${t}-${i}`}>
                    <span className="pd-catChip">{t}</span>
                    {i < catPath.length - 1 ? <span className="pd-catSep">›</span> : null}
                  </React.Fragment>
                ))}
              </div>
            ) : null}

            <div className="pd-row">
              {badge(cs)}
              {(poll as any)?.allow_multiple ? pill("MULTI CHOICE") : pill("SINGLE CHOICE")}
              {voted ? pill("VOTED") : null}
              {(poll as any)?.last_reject_reason ? (
                <span className="pd-warn">⚠ {(poll as any).last_reject_reason}</span>
              ) : null}
            </div>
          </div>

          <div className="pd-actions">
            <button className="pd-btn pd-outline" onClick={() => nav(-1)} type="button">
              ← กลับ
            </button>
          </div>
        </div>

        {/* OPTIONS */}
        <div className="pd-card">
          <div className="pd-sectionHead">
            <div className="pd-section-title">ตัวเลือก</div>
            {cs === "CLOSED" ? <span className="pd-badgeClosed">โพลปิดแล้ว</span> : null}
          </div>

          <div className="pd-options">
            {optionRows.map((o: any) => {
              const id = Number(o.id ?? o.ID);
              const img = clampStr(o.img_url);
              const sel = isSelected(id);

              const r = rsMap.get(id);
              const pct = resultsMode ? Number(r?.percent ?? 0) : 0;
              const cnt = resultsMode ? Number(r?.count ?? 0) : 0;

              return (
                <button
                  key={String(o.id ?? o.ID)}
                  className={`opt ${sel ? "opt-selected" : ""} ${(!canVote || ownerLocked) ? "opt-readonly" : ""} ${ownerLocked ? "opt-ownerLocked" : ""}`}

                 onClick={() => {
  if (ownerLocked) return;
  togglePick(id);
}}
                  type="button"
                  aria-disabled={!canVote}
                >
                  <div className="opt-dot">{sel ? "✓" : ""}</div>

                  {img ? (
                    <span className="opt-thumbWrap" onClick={(e) => e.stopPropagation()} role="presentation">
                      <img
                        src={img}
                        alt={o.label}
                        className="opt-thumb opt-thumb-click"
                        onClick={() => setImgModal(img)}
                        draggable={false}
                      />
                    </span>
                  ) : null}

                  <div className="opt-main">
                    <div className="opt-text">{o.label}</div>

                    {/* ✅ โชว์ผลโหวตใต้ option เมื่อโหวตแล้ว/ปิดโพล */}
                    {resultsMode ? (
                      <>
                        <div className="opt-resultTop">
                          <div className="opt-count">{cnt} votes</div>
                          <div className="opt-percent">{pct.toFixed(0)}%</div>
                        </div>
                        <div className="opt-bar">
                          <div className="opt-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                        </div>
                      </>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* action */}
          <div className="pd-bottom">
            <div className="pd-hint">
              {cs === "UPCOMING" && "⏳ โพลยังไม่เริ่ม"}

              {/* ✅ NEW: owner hint */}
              {cs === "OPEN" && isOwner && "คุณเป็นเจ้าของโพล จึงโหวตโพลของตัวเองไม่ได้"}

              {cs === "OPEN" &&
                !voted &&
                !isOwner &&
                ((poll as any)?.allow_multiple
                  ? `เลือกได้หลายข้อ${typeof maxChoice === "number" ? ` (สูงสุด ${maxChoice})` : ""}`
                  : "เลือกได้ 1 ข้อ")}

              {cs === "OPEN" && voted && (myChoiceText ? `คุณโหวต: ${myChoiceText}` : "คุณโหวตแล้ว")}
              {cs === "CLOSED" && "โหวตไม่ได้แล้ว (ปิดโพล)"}
            </div>

            <div className="pd-bottom-right">
              {toast ? <div className="pd-toast">{toast}</div> : null}
              {err ? <div className="pd-error">{err}</div> : null}

              {canVote ? (
                <button className="pd-btn pd-primary" onClick={submitVote} disabled={loading} type="button">
                  {loading ? "กำลังส่ง..." : "โหวต"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="pd-card">
          <div className="pd-section-title"></div>

          {cs === "UPCOMING" ? (
            <div className="pd-muted">ยังไม่เปิดให้ดูผลโหวต</div>
          ) : cs === "OPEN" && !voted && !isOwner ? (
  <div className="pd-muted">ต้องโหวตก่อนถึงจะดูผลได้</div>
)
          : loading && resultsMode && !results ? (
            <div className="pd-muted">กำลังโหลดผลโหวต...</div>
          ) : results ? (
            <>
              {/* ✅ Winner / Top summary (เฉพาะ CLOSED) */}
              {cs === "CLOSED" && topSummary ? (
                <div className="pd-winnerBox">
                  <div className="pd-winnerTitle">🏆 {summaryLabel}</div>

                  {topSummary.topCount === 0 ? (
                    <div className="pd-muted">ยังไม่มีคนโหวต</div>
                  ) : (
                    <>
                      <div className="pd-winnerText">
                        {topSummary.tops.length === 1 ? "อันดับ 1:" : "เสมออันดับ 1:"}
                      </div>

                      <div className="pd-winnerChips">
                        {topSummary.tops.map((it: any) => (
                          <span key={String(it.option_id ?? it.optionId)} className="pd-winnerChip">
                            {it.label ?? `#${it.option_id ?? it.optionId}`} ({Number(it.count ?? 0)} โหวต)
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              <div className="pd-totalWrap">
                <div className="pd-total">Total Votes: {totalVotes}</div>
                {(poll as any)?.allow_multiple ? (
                  <div className="pd-totalHint">(เลือกได้หลายข้อ จึงอาจรวมเกิน 100%)</div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="pd-muted">ยังไม่มีผลโหวต</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollDetail;
