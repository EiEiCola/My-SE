// frontend/src/app/(protected)/User/Poll/PollList.tsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./PollList.css";

import { type Poll, pollAPI } from "../../../../services/http/poll";
import { PollCard } from "./PollCard";
import { PollCategoryDropdown, type CategoryOption } from "./PollCategoryDropdown";

dayjs.extend(relativeTime);

type StatusFilter = "ALL" | "OPEN" | "UPCOMING" | "CLOSED";
type SortMode = "LATEST" | "POPULAR" | "CLOSING_SOON";

const clampStr = (s: any) => String(s ?? "").trim();

const PollList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("LATEST");
  const [category, setCategory] = useState<string>("ALL");

  // ✅ selection per poll (ยังไม่ยิงโหวตจนกดยืนยัน)
  const [selectedByPoll, setSelectedByPoll] = useState<Record<number, number[]>>({});
  const [submittingByPoll, setSubmittingByPoll] = useState<Record<number, boolean>>({});

  // ---------- helpers กัน field ไม่ตรง ----------
  const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
  const getQuestion = (p: Poll) => clampStr((p as any).question ?? (p as any).Question);
  const getDesc = (p: Poll) => clampStr((p as any).description ?? (p as any).Description);
  const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;
  const getStartAt = (p: Poll) => (p as any).start_at ?? (p as any).StartAt ?? null;
  const getEndAt = (p: Poll) => (p as any).end_at ?? (p as any).EndAt ?? null;

  const getAllowMultiple = (p: Poll) =>
    Boolean((p as any)?.allow_multiple ?? (p as any)?.AllowMultiple ?? false);

  const getMaxChoice = (p: Poll) => (p as any)?.max_choice ?? (p as any)?.MaxChoice ?? null;

  const getOptions = (p: Poll) => ((p as any).poll_options || (p as any).options || []) as any[];

  const optionId = (opt: any) => Number(opt?.ID ?? opt?.id ?? opt?.option_id ?? 0);
  const optionLabel = (opt: any) =>
    clampStr(
      opt?.text ??
        opt?.title ??
        opt?.option_text ??
        opt?.optionText ??
        opt?.OptionText ??
        opt?.name ??
        opt?.label ??
        opt?.Label
    );

  const optionVotes = (opt: any) => {
    const v =
      opt?.vote_count ?? opt?.VoteCount ?? opt?.votes ?? opt?.Votes ?? opt?.count ?? opt?.Count;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const getCategoryTitle = (p: Poll) =>
    clampStr(
      (p as any)?.main_category?.title ??
        (p as any)?.MainCategory?.Title ??
        (p as any)?.mainCategory?.title ??
        (p as any)?.category?.title ??
        (p as any)?.Category?.Title
    ) || "";

      const getAuthorName = (p: Poll) =>
  clampStr(
    (p as any)?.author_name ??        // ✅ ตัวนี้คือของจริงจาก backend
    (p as any)?.authorName ??
    (p as any)?.creator?.display_name ??
    (p as any)?.creator?.name ??
    (p as any)?.member?.display_name ??
    (p as any)?.member?.username ??
    (p as any)?.member_user?.display_name ??
    (p as any)?.member_user?.username ??
    (p as any)?.created_by_name ??
    (p as any)?.createdByName ??
    (p as any)?.owner_name ??
    (p as any)?.ownerName ??
    ""
  );


  const getStatus = (p: Poll): Exclude<StatusFilter, "ALL"> => {
  const cs = String((p as any)?.computed_status ?? (p as any)?.computedStatus ?? "").toUpperCase();
  if (cs === "OPEN" || cs === "UPCOMING" || cs === "CLOSED") return cs as any;

  // fallback เดิม (เผื่อ backend ยังไม่ปล่อย field)
  const now = dayjs();
  const s = getStartAt(p) ? dayjs(getStartAt(p)) : null;
  const e = getEndAt(p) ? dayjs(getEndAt(p)) : null;

  if (e && now.isAfter(e)) return "CLOSED";
  if (s && now.isBefore(s)) return "UPCOMING";
  return "OPEN";
};


  const totalVotesFromOptions = (p: Poll) => {
    const opts = getOptions(p);
    let sum = 0;
    let hasAny = false;
    for (const o of opts) {
      const v = optionVotes(o);
      if (v !== null) {
        sum += v;
        hasAny = true;
      }
    }
    return hasAny ? sum : null;
  };

  const endAtTime = (p: Poll) => {
    const e = getEndAt(p);
    return e ? dayjs(e).valueOf() : null;
  };

  // ---------- load ----------
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await pollAPI.listPublished();
      const rows = (res as any)?.data ?? [];
      setPolls(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------- categories for dropdown ----------
  const categories: CategoryOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of polls) {
      const t = getCategoryTitle(p);
      if (t) map.set(t, t);
    }
    const opts = Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    return [{ value: "ALL", label: "หมวดหมู่ทั้งหมด" }, ...opts.map((x) => ({ value: x, label: x }))];
  }, [polls]);

  // ---------- filtered + sorted ----------
  const visible = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    let base = polls.slice();

    if (category !== "ALL") base = base.filter((p) => getCategoryTitle(p) === category);
    if (status !== "ALL") base = base.filter((p) => getStatus(p) === status);

    if (keyword) {
      base = base.filter((p) => {
        const idStr = String(getId(p));
        const question = getQuestion(p).toLowerCase();
        const desc = getDesc(p).toLowerCase();
        return idStr.includes(keyword) || question.includes(keyword) || desc.includes(keyword);
      });
    }

    if (sort === "LATEST") {
      base.sort((a, b) => {
        const ta = getCreatedAt(a) ? dayjs(getCreatedAt(a)).valueOf() : 0;
        const tb = getCreatedAt(b) ? dayjs(getCreatedAt(b)).valueOf() : 0;
        return tb - ta;
      });
    } else if (sort === "POPULAR") {
      base.sort((a, b) => {
        const va = totalVotesFromOptions(a) ?? -1;
        const vb = totalVotesFromOptions(b) ?? -1;
        if (vb !== va) return vb - va;
        const ta = getCreatedAt(a) ? dayjs(getCreatedAt(a)).valueOf() : 0;
        const tb = getCreatedAt(b) ? dayjs(getCreatedAt(b)).valueOf() : 0;
        return tb - ta;
      });
    } else if (sort === "CLOSING_SOON") {
      base.sort((a, b) => {
        const sa = getStatus(a);
        const sb = getStatus(b);
        if (sa !== sb) {
          if (sa === "OPEN") return -1;
          if (sb === "OPEN") return 1;
        }

        const ea = endAtTime(a) ?? Number.MAX_SAFE_INTEGER;
        const eb = endAtTime(b) ?? Number.MAX_SAFE_INTEGER;
        if (ea !== eb) return ea - eb;

        const ta = getCreatedAt(a) ? dayjs(getCreatedAt(a)).valueOf() : 0;
        const tb = getCreatedAt(b) ? dayjs(getCreatedAt(b)).valueOf() : 0;
        return tb - ta;
      });
    }

    return base;
  }, [polls, q, category, status, sort]);

  const stats = useMemo(() => {
    const total = polls.length;
    const open = polls.filter((p) => getStatus(p) === "OPEN").length;
    const upcoming = polls.filter((p) => getStatus(p) === "UPCOMING").length;
    const closed = polls.filter((p) => getStatus(p) === "CLOSED").length;
    return { total, open, upcoming, closed };
  }, [polls]);

  const resetFilters = () => {
    setQ("");
    setCategory("ALL");
    setStatus("ALL");
    setSort("LATEST");
  };

  // ---------- vote adapter ----------
  const votePollAdapter = async (pollId: number, optionIds: number[]) => {
    const apiAny: any = pollAPI as any;

    // backend ต้องการ { option_ids: [...] }
    if (typeof apiAny.vote === "function") return apiAny.vote(pollId, { option_ids: optionIds });
    if (typeof apiAny.votePoll === "function") return apiAny.votePoll({ poll_id: pollId, option_ids: optionIds });
    if (typeof apiAny.submitVote === "function") return apiAny.submitVote({ poll_id: pollId, option_ids: optionIds });

    throw new Error("No vote method found in pollAPI");
  };

  // ✅ click option = แค่เลือก/ยกเลิกเลือก (ไม่ยิงโหวต)
  const toggleOption = (pollId: number, optId: number, allowMultiple: boolean, maxChoice: number | null) => {
    setSelectedByPoll((prev) => {
      const cur = prev[pollId] ?? [];

      // single choice: เลือกใหม่ = ทับของเก่า (และกดซ้ำ = unselect)
      if (!allowMultiple) {
        if (cur.length === 1 && cur[0] === optId) return { ...prev, [pollId]: [] };
        return { ...prev, [pollId]: [optId] };
      }

      // multiple choice
      const exists = cur.includes(optId);
      const next = exists ? cur.filter((x) => x !== optId) : [...cur, optId];

      if (!exists && maxChoice != null && maxChoice > 0 && next.length > maxChoice) {
        // เกิน max_choice -> ไม่เพิ่ม
        return prev;
      }

      return { ...prev, [pollId]: next };
    });
  };

  const clearSelection = (pollId: number) => {
    setSelectedByPoll((p) => ({ ...p, [pollId]: [] }));
  };

  const confirmVote = async (pollId: number) => {
    const optionIds = selectedByPoll[pollId] ?? [];
    if (optionIds.length === 0) return;

    setSubmittingByPoll((p) => ({ ...p, [pollId]: true }));
    try {
      await votePollAdapter(pollId, optionIds);
      // เคลียร์ selection หลังโหวตสำเร็จ
      setSelectedByPoll((p) => ({ ...p, [pollId]: [] }));
      await load();
    } catch (e) {
      console.error(e);
      alert("โหวตไม่สำเร็จ");
    } finally {
      setSubmittingByPoll((p) => ({ ...p, [pollId]: false }));
    }
  };

  return (
    <div className="pf-page">
      {/* HERO */}
      <div className="pf-hero">
        <div>
          <div className="pf-kicker">COMMUNITY POLLS</div>
          <div className="pf-title">
            โพลในชุมชน <span className="pf-emoji">🗳️</span>
          </div>
          <div className="pf-sub">โหวตได้เลยบนฟีด (เลือกก่อน แล้วค่อยกดยืนยัน)</div>

          <div className="pf-stats">
            <div className="stat">
              <div className="k">Total</div>
              <div className="v">{stats.total}</div>
            </div>
            <div className="stat">
              <div className="k">Open</div>
              <div className="v">{stats.open}</div>
            </div>
            <div className="stat">
              <div className="k">Upcoming</div>
              <div className="v">{stats.upcoming}</div>
            </div>
            <div className="stat">
              <div className="k">Closed</div>
              <div className="v">{stats.closed}</div>
            </div>
          </div>
        </div>

        <div className="pf-hero-actions">
          <button className="btn btn-primary" type="button" onClick={() => (window.location.href = "/User/Polls/create")}>
            ➕ สร้างโพล
          </button>
        </div>
      </div>

      {/* STICKY TOOLBAR */}
      <div className="pf-sticky">
        <div className="pf-toolbar">
          <div className="pf-search">
            <span className="pf-search-ico">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาโพล..." />
          </div>

          <div className="pf-toolbar-row">
            <PollCategoryDropdown value={category} onChange={setCategory} options={categories} />

            <div className="pf-chips">
              <button className={status === "ALL" ? "chip chip-active" : "chip"} onClick={() => setStatus("ALL")}>
                ทั้งหมด
              </button>
              <button className={status === "OPEN" ? "chip chip-active" : "chip"} onClick={() => setStatus("OPEN")}>
                เปิดอยู่
              </button>
              <button className={status === "UPCOMING" ? "chip chip-active" : "chip"} onClick={() => setStatus("UPCOMING")}>
                กำลังจะมา
              </button>
              <button className={status === "CLOSED" ? "chip chip-active" : "chip"} onClick={() => setStatus("CLOSED")}>
                ปิดแล้ว
              </button>
            </div>

            <div className="pf-select">
              <span className="pf-select-label">เรียง:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
                <option value="LATEST">ล่าสุด</option>
                <option value="POPULAR">ยอดนิยม</option>
                <option value="CLOSING_SOON">ใกล้ปิด</option>
              </select>
            </div>

            <button className="btn btn-outline" type="button" onClick={() => (window.location.href = "/User/Polls/archive")}>
              📌 โพลปิดแล้ว (ดูผล)
            </button>

            <button className="btn btn-outline" type="button" onClick={resetFilters}>
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>

      {/* FEED */}
      <div className="pf-feed">
        {loading ? (
          <div className="pf-loading">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="pf-empty">
            <div className="empty-box">📦</div>
            <div className="empty-title">ไม่พบโพล</div>
            <div className="empty-sub">ลองเปลี่ยนตัวกรอง หรือค้นหาด้วยคำอื่น</div>
          </div>
        ) : (
          visible.map((p) => {
            const pid = getId(p);
            const allowMultiple = getAllowMultiple(p);
            const maxChoice = getMaxChoice(p);
            const selectedOptionIds = selectedByPoll[pid] ?? [];
            const submitting = Boolean(submittingByPoll[pid]);
            const canConfirm = selectedOptionIds.length > 0 && !submitting;

            // ✅ NEW: read vote state from backend response (snake_case / camelCase)
            const initialHasVoted =
              typeof (p as any)?.has_voted === "boolean"
                ? (p as any).has_voted
                : typeof (p as any)?.hasVoted === "boolean"
                  ? (p as any).hasVoted
                  : false;

            const initialMyOptionIds: number[] = Array.isArray((p as any)?.my_option_ids)
              ? (p as any).my_option_ids
              : Array.isArray((p as any)?.myOptionIds)
                ? (p as any).myOptionIds
                : [];

            return (
              <PollCard
                key={pid}
                poll={p}
                getId={getId}
                getQuestion={getQuestion}
                getDesc={getDesc}
                getCreatedAt={getCreatedAt}
                getStartAt={getStartAt}
                getEndAt={getEndAt}
                getStatus={getStatus}
                getAllowMultiple={getAllowMultiple}
                getMaxChoice={getMaxChoice}
                getOptions={getOptions}
                optionId={optionId}
                optionLabel={optionLabel}
                optionVotes={optionVotes}
                getCategoryTitle={getCategoryTitle}
                getAuthorName={getAuthorName}
                onOpenDetail={(id) => (window.location.href = `/User/Polls/${id}`)}
                // ✅ selection + vote
                selectedOptionIds={selectedOptionIds}
                onToggleOption={(optId) => toggleOption(pid, optId, allowMultiple, maxChoice)}
                onClearSelection={() => clearSelection(pid)}
                onConfirmVote={() => confirmVote(pid)}
                submitting={submitting}
                canConfirm={canConfirm}
                // ✅ NEW: ส่งให้ PollCard รู้ว่าโหวตแล้วตั้งแต่โหลด
                initialHasVoted={initialHasVoted}
                initialMyOptionIds={initialMyOptionIds}
              />
            );
          })
        )}
      </div>

      {/* Floating create */}
      <button className="pf-fab" type="button" title="Create Poll" onClick={() => (window.location.href = "/User/Polls/create")}>
        ➕
      </button>
    </div>
  );
};

export default PollList;
