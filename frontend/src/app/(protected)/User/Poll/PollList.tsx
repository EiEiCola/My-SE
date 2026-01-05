// frontend/src/app/(protected)/User/Poll/PollList.tsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./PollList.css";

import { type Poll, pollAPI, categoryAPI } from "../../../../services/http/poll";
import { PollCard } from "./PollCard";
import { PollCategoryDropdown, type CategoryOption } from "./PollCategoryDropdown";

dayjs.extend(relativeTime);

type StatusFilter = "ALL" | "OPEN" | "UPCOMING" | "CLOSED";
type SortMode = "LATEST" | "POPULAR" | "CLOSING_SOON";

const clampStr = (s: any) => String(s ?? "").trim();
const base64UrlToJson = (part: string) => {
  // base64url -> base64
  let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  // padding
  while (b64.length % 4) b64 += "=";
  // decode
  const json = atob(b64);
  return JSON.parse(json);
};

const getCurrentMemberId = () => {
  const token = localStorage.getItem("token") || "";
  if (!token.includes(".")) return 0;

  try {
    const payload = base64UrlToJson(token.split(".")[1]);

    // ✅ สำคัญ: ของเธอน่าจะใช้ user_id (ดูจากรูป)
    const id = Number(
      payload?.member_id ??
        payload?.memberId ??
        payload?.user_id ??        // ✅ เพิ่มตัวนี้
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



const extractApiError = (e: any) => {
  const err =
    e?.response?.data?.error ??
    e?.response?.data?.message ??
    e?.message ??
    "โหวตไม่สำเร็จ";
  return String(err);
};

const prettyVoteError = (raw: string) => {
  const s = String(raw || "").toLowerCase();
  if (s.includes("owner_cannot_vote")) return "คุณเป็นเจ้าของโพลนี้ จึงโหวตไม่ได้";
  if (s.includes("already_voted")) return "คุณโหวตไปแล้ว";
  if (s.includes("poll_not_started")) return "โพลยังไม่เริ่ม";
  if (s.includes("poll_closed")) return "โพลปิดแล้ว";
  if (s.includes("poll_not_open")) return "โพลยังไม่เปิดให้โหวต";
  if (s.includes("unauthorized") || s.includes("invalid token")) return "กรุณาเข้าสู่ระบบใหม่";
  return raw || "โหวตไม่สำเร็จ";
};

const PollList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);

  const currentMemberId = getCurrentMemberId();

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortMode>("LATEST");

  // ✅ category filter 3 levels (0 = ALL)
  const [mainId, setMainId] = useState<number>(0);
  const [sub1Id, setSub1Id] = useState<number>(0);
  const [sub2Id, setSub2Id] = useState<number>(0);

  // dropdown options for 3-level category
  const [mainOpts, setMainOpts] = useState<any[]>([]);
  const [sub1Opts, setSub1Opts] = useState<any[]>([]);
  const [sub2Opts, setSub2Opts] = useState<any[]>([]);

  const mainNameById = useMemo<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    for (const x of mainOpts) {
      const id = Number((x as any)?.id ?? (x as any)?.ID ?? 0);
      const title = String((x as any)?.title ?? (x as any)?.Title ?? (x as any)?.name ?? "").trim();
      if (id) out[id] = title;
    }
    return out;
  }, [mainOpts]);

  const sub1NameById = useMemo<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    for (const x of sub1Opts) {
      const id = Number((x as any)?.id ?? (x as any)?.ID ?? 0);
      const title = String((x as any)?.title ?? (x as any)?.Title ?? (x as any)?.name ?? "").trim();
      if (id) out[id] = title;
    }
    return out;
  }, [sub1Opts]);

  const sub2NameById = useMemo<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    for (const x of sub2Opts) {
      const id = Number((x as any)?.id ?? (x as any)?.ID ?? 0);
      const title = String((x as any)?.title ?? (x as any)?.Title ?? (x as any)?.name ?? "").trim();
      if (id) out[id] = title;
    }
    return out;
  }, [sub2Opts]);

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
      (p as any)?.author_name ?? // ✅ ตัวนี้คือของจริงจาก backend
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

  // ✅ category id helpers (กัน field ไม่ตรง)
  const getMainCategoryId = (p: Poll) =>
    Number(
      (p as any)?.main_category_id ??
        (p as any)?.MainCategoryID ??
        (p as any)?.mainCategoryID ??
        (p as any)?.main_category?.id ??
        0
    ) || 0;

  const getSubCategoryL1Id = (p: Poll) =>
    Number(
      (p as any)?.sub_category_l1_id ??
        (p as any)?.SubCategoryL1ID ??
        (p as any)?.subCategoryL1ID ??
        (p as any)?.sub_category_l1?.id ??
        0
    ) || 0;

  const getSubCategoryL2Id = (p: Poll) =>
    Number(
      (p as any)?.sub_category_l2_id ??
        (p as any)?.SubCategoryL2ID ??
        (p as any)?.subCategoryL2ID ??
        (p as any)?.sub_category_l2?.id ??
        0
    ) || 0;

  const getCatTextFromIds = (p: Poll) => {
    const mid = getMainCategoryId(p);
    const s1 = getSubCategoryL1Id(p);
    const s2 = getSubCategoryL2Id(p);

    const t1 = mid ? (mainNameById[mid] ?? "") : "";
    const t2 = s1 ? (sub1NameById[s1] ?? "") : "";
    const t3 = s2 ? (sub2NameById[s2] ?? "") : "";

    return `${t1} ${t2} ${t3}`.trim().toLowerCase();
  };

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

  const getTotalVoters = (p: Poll) => {
    const v =
      (p as any)?.total_voters ??
      (p as any)?.totalVoters ??
      (p as any)?.total_votes ??
      (p as any)?.totalVotes ??
      null;

    const n = Number(v);
    return Number.isFinite(n) ? n : null;
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

  // ---------- load category dropdown data ----------
  useEffect(() => {
    const loadMain = async () => {
      try {
        const mains = await (categoryAPI as any).listMain();
        setMainOpts(Array.isArray(mains) ? mains : []);
      } catch (e) {
        console.error(e);
        setMainOpts([]);
      }
    };
    loadMain();
  }, []);

  useEffect(() => {
    const loadSub1 = async () => {
      if (!mainId) {
        setSub1Opts([]);
        setSub2Opts([]);
        setSub1Id(0);
        setSub2Id(0);
        return;
      }
      try {
        const sub1s = await (categoryAPI as any).listSub1(mainId);
        setSub1Opts(Array.isArray(sub1s) ? sub1s : []);
      } catch (e) {
        console.error(e);
        setSub1Opts([]);
      } finally {
        // reset lower level when main changes
        setSub1Id(0);
        setSub2Id(0);
        setSub2Opts([]);
      }
    };

    loadSub1();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainId]);

  useEffect(() => {
    const loadSub2 = async () => {
      if (!sub1Id) {
        setSub2Opts([]);
        setSub2Id(0);
        return;
      }
      try {
        const sub2s = await (categoryAPI as any).listSub2(sub1Id);
        setSub2Opts(Array.isArray(sub2s) ? sub2s : []);
      } catch (e) {
        console.error(e);
        setSub2Opts([]);
      }
    };

    loadSub2();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub1Id]);

  // ---------- categories for dropdown (ของเดิม — ยังเก็บไว้ ไม่ลบ) ----------
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

    // ✅ 3-level category filter
    if (mainId) base = base.filter((p) => getMainCategoryId(p) === mainId);
    if (sub1Id) base = base.filter((p) => getSubCategoryL1Id(p) === sub1Id);
    if (sub2Id) base = base.filter((p) => getSubCategoryL2Id(p) === sub2Id);

    if (status !== "ALL") base = base.filter((p) => getStatus(p) === status);

    if (keyword) {
      base = base.filter((p) => {
        const idStr = String(getId(p));

        const question = String(getQuestion(p) ?? "").toLowerCase();
        const desc = String(getDesc(p) ?? "").toLowerCase();

        // ✅ 1) ค้นชื่อผู้สร้างโพล
        const author = String(getAuthorName(p) ?? "").toLowerCase();

        // ✅ 2) ค้นชื่อหมวดหมู่
        // 2.1 จาก map (id -> title) ที่โหลดจาก dropdown
        const catFromIds = getCatTextFromIds(p);

        // 2.2 fallback: จาก object ที่ backend แนบมา
        const catFromObj = [
          (p as any)?.main_category?.title,
          (p as any)?.main_category?.name,
          (p as any)?.sub_category_l1?.title,
          (p as any)?.sub_category_l1?.name,
          (p as any)?.sub_category_l2?.title,
          (p as any)?.sub_category_l2?.name,

          (p as any)?.MainCategory?.Title,
          (p as any)?.MainCategory?.Name,
          (p as any)?.SubCategoryL1?.Title,
          (p as any)?.SubCategoryL1?.Name,
          (p as any)?.SubCategoryL2?.Title,
          (p as any)?.SubCategoryL2?.Name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          idStr.includes(keyword) ||
          question.includes(keyword) ||
          desc.includes(keyword) ||
          author.includes(keyword) ||
          catFromIds.includes(keyword) ||
          catFromObj.includes(keyword)
        );
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
        const va = getTotalVoters(a) ?? totalVotesFromOptions(a) ?? -1;
        const vb = getTotalVoters(b) ?? totalVotesFromOptions(b) ?? -1;

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
  }, [
    polls,
    q,
    status,
    sort,
    mainId,
    sub1Id,
    sub2Id,
    mainNameById,
    sub1NameById,
    sub2NameById,
  ]);

  const stats = useMemo(() => {
    const total = polls.length;
    const open = polls.filter((p) => getStatus(p) === "OPEN").length;
    const upcoming = polls.filter((p) => getStatus(p) === "UPCOMING").length;
    const closed = polls.filter((p) => getStatus(p) === "CLOSED").length;
    return { total, open, upcoming, closed };
  }, [polls]);

  const resetFilters = () => {
    setQ("");
    setStatus("ALL");
    setSort("LATEST");

    // ✅ reset 3-level category filter
    setMainId(0);
    setSub1Id(0);
    setSub2Id(0);
    setSub1Opts([]);
    setSub2Opts([]);
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

  // ✅ สำคัญ: ถ้าโหวต fail ต้อง throw ออกไปให้ PollCard รู้ว่า fail
const confirmVote = async (pollId: number): Promise<boolean> => {
  const optionIds = selectedByPoll[pollId] ?? [];
  if (optionIds.length === 0) {
    setToast(pollId, "กรุณาเลือกตัวเลือกก่อน");
    return false;
  }

  setSubmittingByPoll((p) => ({ ...p, [pollId]: true }));

  try {
    await votePollAdapter(pollId, optionIds);

    setToast(pollId, "โหวตสำเร็จ ✅");
    setSelectedByPoll((p) => ({ ...p, [pollId]: [] }));
    await load();
    return true;
  } catch (e: any) {
    console.error(e);

    // ✅ เอา error code จาก backend ก่อนเสมอ
    const backendErr =
      e?.response?.data?.error ??
      e?.response?.data?.message ??
      e?.response?.data?.detail ??
      "";

    // ✅ ค่อย fallback เป็น e.message ทีหลัง
    const fallbackMsg = e?.message ?? "";

    const raw = String(backendErr || fallbackMsg || "โหวตไม่สำเร็จ").trim();

    const nice =
      raw.includes("owner_cannot_vote")
        ? "คุณไม่มีสิทธิ์โหวตโพลนี้ (เจ้าของโพล)"
        : raw.includes("already_voted")
        ? "คุณโหวตไปแล้ว"
        : raw.includes("poll_not_started")
        ? "โพลยังไม่เริ่ม"
        : raw.includes("poll_closed") || raw.includes("poll_not_open")
        ? "โพลปิดแล้ว / ยังไม่เปิดโหวต"
        : raw.includes("403")
        ? "คุณไม่มีสิทธิ์ทำรายการนี้"
        : raw;

    setToast(pollId, nice);
    return false;
  } finally {
    setSubmittingByPoll((p) => ({ ...p, [pollId]: false }));
  }
};



// ✅ toast ต่อ poll (id -> message)
const [toastByPoll, setToastByPoll] = useState<Record<number, string>>({});

// ✅ timeout ต่อ poll (กันทับกัน)
const toastTimersRef = React.useRef<Record<number, number>>({});

const setToast = (pollId: number, msg: string, ms = 2200) => {
  setToastByPoll((p) => ({ ...p, [pollId]: msg }));

  // clear timer เก่า
  const prev = toastTimersRef.current[pollId];
  if (prev) window.clearTimeout(prev);

  // auto clear
  toastTimersRef.current[pollId] = window.setTimeout(() => {
    setToastByPoll((p) => {
      const next = { ...p };
      delete next[pollId];
      return next;
    });
  }, ms);
};

// ✅ cleanup timers ตอน unmount
useEffect(() => {
  return () => {
    Object.values(toastTimersRef.current).forEach((t) => window.clearTimeout(t));
  };
}, []);



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
            {/* ✅ NOTE: ของเดิมยัง import/ยังมีไว้ ไม่ได้ตัดทิ้ง (แต่ตอนนี้เราใช้ 3 ชั้นแทน) */}
            {/* <PollCategoryDropdown value={"ALL"} onChange={() => {}} options={categories} /> */}
            {/* ✅ keep legacy dropdown used (hidden) to avoid TS unused imports */}
            <div style={{ display: "none" }}>
              <PollCategoryDropdown value={"ALL"} onChange={() => {}} options={categories} />
            </div>

            {/* ✅ Category filter 3 levels */}
            <div className="pf-select">
              <span className="pf-select-label">🏷️ หมวดหลัก:</span>
              <select value={mainId} onChange={(e) => setMainId(Number(e.target.value))}>
                <option value={0}>ทั้งหมด</option>
                {mainOpts.map((x: any) => {
                  const id = Number(x?.id ?? x?.ID ?? 0);
                  const title = String(x?.title ?? x?.name ?? "").trim();
                  return (
                    <option key={id} value={id}>
                      {title || `#${id}`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="pf-select">
              <span className="pf-select-label">หมวดย่อย1:</span>
              <select value={sub1Id} onChange={(e) => setSub1Id(Number(e.target.value))} disabled={!mainId}>
                <option value={0}>ทั้งหมด</option>
                {sub1Opts.map((x: any) => {
                  const id = Number(x?.id ?? x?.ID ?? 0);
                  const title = String(x?.title ?? x?.name ?? "").trim();
                  return (
                    <option key={id} value={id}>
                      {title || `#${id}`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="pf-select">
              <span className="pf-select-label">หมวดย่อย2:</span>
              <select value={sub2Id} onChange={(e) => setSub2Id(Number(e.target.value))} disabled={!sub1Id}>
                <option value={0}>ทั้งหมด</option>
                {sub2Opts.map((x: any) => {
                  const id = Number(x?.id ?? x?.ID ?? 0);
                  const title = String(x?.title ?? x?.name ?? "").trim();
                  return (
                    <option key={id} value={id}>
                      {title || `#${id}`}
                    </option>
                  );
                })}
              </select>
            </div>

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
                currentMemberId={currentMemberId}
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
                getAuthorName={(p: any) => String(p?.author_name ?? "").trim() || "ไม่เปิดเผยชื่อ"}
                mainNameById={mainNameById}
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
                toastMessage={toastByPoll[pid] ?? ""}
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
