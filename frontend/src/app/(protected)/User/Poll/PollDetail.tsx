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

const getAuthorName = (p: Poll | null) =>
  clampStr(
    (p as any)?.author_name ??
      (p as any)?.authorName ??
      (p as any)?.member?.display_name ??
      (p as any)?.member?.username ??
      (p as any)?.creator?.display_name ??
      (p as any)?.creator?.name ??
      ""
  );

const computeStatusFromDetail = (p: Poll | null): UiStatus => {
  if (!p) return "OPEN";

  // ถ้า backend ส่ง computed_status มา ใช้เลย
  const cs = clampStr((p as any).computed_status).toUpperCase();
  if (cs === "UPCOMING" || cs === "OPEN" || cs === "CLOSED") return cs as UiStatus;

 

  // fallback คำนวณเองจากเวลา
  const now = dayjs();
  const start = p.start_at ? dayjs(p.start_at) : null;
  const end = p.end_at ? dayjs(p.end_at) : null;

  if (end && now.isAfter(end)) return "CLOSED";
  if (start && now.isBefore(start)) return "UPCOMING";
  return "OPEN";
};

const isMulti = (p: Poll | null) => !!p?.allow_multiple;

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
    return !!myVote?.has_voted;
  }, [poll, myVote]);

  const maxChoice = useMemo(() => {
    const v = (poll?.max_choice ?? undefined) as any;
    return typeof v === "number" ? v : undefined;
  }, [poll]);

  const canVote = useMemo(() => cs === "OPEN" && !voted, [cs, voted]);

  const optionRows = useMemo(() => {
    const opts = (poll?.options ?? []) as any[];
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
    if (mv?.has_voted && Array.isArray(mv.option_ids)) {
      setSelected(mv.option_ids);
      return;
    }
    const hv = !!(detail as any)?.has_voted;
    const ids = (((detail as any)?.my_option_ids ?? []) as number[]) ?? [];
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
          option_ids: (((detail as any).my_option_ids ?? []) as number[]) ?? [],
        };
        setMyVote(mvLocal);
      }

      // sync selected ทันที
      syncSelectedFromVote(mvLocal, detail);

      // 3) results (กติกา)
      // ⚠️ คำนวณจาก detail ทันที ไม่ใช้ state เพื่อกัน setPoll ยังไม่ทัน
      const localCs = computeStatusFromDetail(detail);
      const localVoted =
        typeof (detail as any)?.has_voted === "boolean"
          ? !!(detail as any).has_voted
          : !!mvLocal?.has_voted;

      if (localCs === "CLOSED" || (localCs === "OPEN" && localVoted)) {
        const rsRes = await pollAPI.getResults(pollID);
        const rs = (rsRes as any).data as PollResultsResponse;
        setResults(rs);
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

    const ids = Array.from(new Set(selected)).filter((x) => x > 0);

    if (ids.length === 0) {
      setToast("กรุณาเลือกตัวเลือกก่อน");
      clearToastLater();
      return;
    }

    if (!poll.allow_multiple && ids.length !== 1) {
      setToast("โพลนี้เลือกได้แค่ 1 ตัวเลือก");
      clearToastLater();
      return;
    }

    if (poll.allow_multiple && typeof maxChoice === "number" && maxChoice > 0 && ids.length > maxChoice) {
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
      const msg = String(e?.response?.data?.error || e?.message || "โหวตไม่สำเร็จ");
      if (msg.includes("already_voted")) setToast("โหวตไปแล้ว");
      else if (msg.includes("poll_not_started")) setToast("โพลยังไม่เริ่ม");
      else if (msg.includes("poll_closed")) setToast("โพลปิดแล้ว");
      else if (msg.includes("poll_not_open")) setToast("โพลยังไม่เปิดโหวต");
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

  const isSelected = (id: number) => selected.includes(id);

  const myChoiceText = useMemo(() => {
    if (!voted) return "";
    const ids = selected;
    if (!ids?.length) return "";
    if (!poll?.options?.length) return "";
    const map = new Map<number, string>();
    (poll.options as any[]).forEach((o) => map.set(Number(o.id), String(o.label ?? "")));
    const names = ids.map((id) => map.get(id) || String(id)).filter(Boolean);
    return names.join(", ");
  }, [poll, selected, voted]);

  const totalVotes = useMemo(() => {
    const t = (results as any)?.total_votes ?? (results as any)?.total ?? 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }, [results]);

  // ✅ โหมดแสดงผลโหวตใต้ option (เมื่อโหวตแล้ว หรือปิดโพล)
  const resultsMode = useMemo(() => {
    return cs === "CLOSED" || (cs === "OPEN" && voted);
  }, [cs, voted]);

  // ✅ map result per option_id
  const rsMap = useMemo(() => {
    const m = new Map<number, { count: number; percent: number; img_url?: string; label?: string }>();
    if (results?.items?.length) {
      results.items.forEach((it: any) => {
        m.set(Number(it.option_id), {
          count: Number(it.count ?? 0),
          percent: Number(it.percent ?? 0),
          img_url: it.img_url ? toFullUrl(it.img_url) : undefined,
          label: it.label,
        });
      });
    }
    return m;
  }, [results]);

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
            <div className="pd-title">{poll?.question || (loading ? "กำลังโหลด..." : "ไม่พบโพล")}</div>

           <div className="pd-sub">
  {authorName ? <span className="pd-author">by {authorName}</span> : null}
  {poll?.created_at ? ` • Created ${dayjs(poll.created_at).fromNow()}` : ""}
  {poll?.start_at ? ` • Start ${dayjs(poll.start_at).format("DD/MM/YYYY HH:mm")}` : ""}
  {poll?.end_at ? ` • End ${dayjs(poll.end_at).format("DD/MM/YYYY HH:mm")}` : ""}
</div>



            <div className="pd-row">
              {badge(cs)}
              {poll?.allow_multiple ? pill("MULTI CHOICE") : pill("SINGLE CHOICE")}
              {voted ? pill("VOTED") : null}
              {poll?.last_reject_reason ? <span className="pd-warn">⚠ {poll.last_reject_reason}</span> : null}
            </div>
          </div>

          <div className="pd-actions">
            <button className="pd-btn pd-outline" onClick={() => nav(-1)} type="button">
              ← Back
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
              const id = Number(o.id);
              const img = clampStr(o.img_url);
              const sel = isSelected(id);

              const r = rsMap.get(id);
              const pct = resultsMode ? Number(r?.percent ?? 0) : 0;
              const cnt = resultsMode ? Number(r?.count ?? 0) : 0;

              return (
                <button
                  key={o.id}
                  className={`opt ${sel ? "opt-selected" : ""} ${!canVote ? "opt-readonly" : ""}`}
                  onClick={() => togglePick(id)}
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
              {cs === "OPEN" &&
                !voted &&
                (poll?.allow_multiple
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

        {/* SUMMARY (แทนผลโหวตกล่องใหญ่) */}
        <div className="pd-card">
          <div className="pd-section-title"></div>

          {cs === "UPCOMING" ? (
            <div className="pd-muted">ยังไม่เปิดให้ดูผลโหวต</div>
          ) : cs === "OPEN" && !voted ? (
            <div className="pd-muted">ต้องโหวตก่อนถึงจะดูผลได้</div>
          ) : loading && resultsMode && !results ? (
            <div className="pd-muted">กำลังโหลดผลโหวต...</div>
          ) : results ? (
            <div className="pd-totalWrap">
              <div className="pd-total">Total Votes: {totalVotes}</div>
              {poll?.allow_multiple ? <div className="pd-totalHint">(เลือกได้หลายข้อ จึงอาจรวมเกิน 100%)</div> : null}
            </div>
          ) : (
            <div className="pd-muted">ยังไม่มีผลโหวต</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollDetail;
