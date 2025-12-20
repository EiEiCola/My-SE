import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "./PollList.css";

import { type Poll, pollAPI } from "../../../../services/http/poll";
import { PollCard } from "./PollCard";
import { PollCategoryDropdown, type CategoryOption } from "./PollCategoryDropdown";

const clampStr = (s: any) => String(s ?? "").trim();
type SortMode = "LATEST" | "POPULAR";

const PollArchive: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [sort, setSort] = useState<SortMode>("LATEST");

  // helpers
  const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
  const getQuestion = (p: Poll) => clampStr((p as any).question);
  const getDesc = (p: Poll) => clampStr((p as any).description);
  const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;

  const getOptions = (p: Poll) =>
    ((p as any).poll_options || (p as any).options || []) as any[];

  const optionId = (opt: any) => Number(opt?.ID ?? opt?.id ?? opt?.option_id ?? 0);
  const optionLabel = (opt: any) =>
    clampStr(opt?.label ?? opt?.Label ?? opt?.text ?? opt?.title ?? opt?.option_text ?? opt?.name ?? opt?.optionText);

  const optionVotes = (opt: any) => {
    const v = opt?.vote_count ?? opt?.VoteCount ?? opt?.votes ?? opt?.Votes ?? opt?.count ?? opt?.Count;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const getAllowMultiple = (p: Poll) => Boolean((p as any)?.allow_multiple ?? (p as any)?.AllowMultiple ?? false);
  const getMaxChoice = (p: Poll) => (p as any)?.max_choice ?? (p as any)?.MaxChoice ?? null;

  const getCategoryTitle = (p: Poll) =>
    clampStr(
      (p as any)?.main_category?.title ??
        (p as any)?.MainCategory?.Title ??
        (p as any)?.mainCategory?.title ??
        (p as any)?.category?.title ??
        (p as any)?.Category?.Title
    ) || "";

  // ✅ archive ถือว่า CLOSED ทั้งหมด
  const getStatus = (_: Poll) => "CLOSED" as const;
  const getStartAt = (_: Poll) => null;
  const getEndAt = (_: Poll) => null;

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

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      // ✅ ต้องมี method นี้ใน pollAPI
      const res = await (pollAPI as any).listClosed();
      const rows = (res as any)?.data ?? [];
      setPolls(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  const categories: CategoryOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of polls) {
      const t = getCategoryTitle(p);
      if (t) map.set(t, t);
    }
    const opts = Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    return [{ value: "ALL", label: "หมวดหมู่ทั้งหมด" }, ...opts.map((x) => ({ value: x, label: x }))];
  }, [polls]);

  const visible = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    let base = polls.slice();

    if (category !== "ALL") base = base.filter((p) => getCategoryTitle(p) === category);

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
    } else {
      base.sort((a, b) => (totalVotesFromOptions(b) ?? -1) - (totalVotesFromOptions(a) ?? -1));
    }

    return base;
  }, [polls, q, category, sort]);

  // ไม่ต้องโหวตแล้วใน archive
  const handleVoted = async () => {};

  return (
    <div className="pf-page">
      <div className="pf-hero">
        <div>
          <div className="pf-kicker">POLL ARCHIVE</div>
          <div className="pf-title">ผลโหวตที่ผ่านมา 🧾</div>
          <div className="pf-sub">โพลที่ปิดแล้ว ทุกคนดูผลได้เลย</div>
        </div>

        <div className="pf-hero-actions">
          <button className="btn btn-outline" type="button" onClick={() => (window.location.href = "/User/Polls")}>
            ← กลับไปหน้าโหวต
          </button>
        </div>
      </div>

      <div className="pf-sticky">
        <div className="pf-toolbar">
          <div className="pf-search">
            <span className="pf-search-ico">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาโพลที่ปิดแล้ว..." />
          </div>

          <div className="pf-toolbar-row">
            <PollCategoryDropdown value={category} onChange={setCategory} options={categories} />

            <div className="pf-select">
              <span className="pf-select-label">เรียง:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
                <option value="LATEST">ล่าสุด</option>
                <option value="POPULAR">ยอดนิยม</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pf-feed">
        {loading ? (
          <div className="pf-loading">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="pf-empty">
            <div className="empty-box">📦</div>
            <div className="empty-title">ยังไม่มีโพลปิดแล้ว</div>
            <div className="empty-sub">รอให้แอดมินปิดโพล หรือเพิ่ม seed CLOSED</div>
          </div>
        ) : (
          visible.map((p) => (
            <PollCard
              key={getId(p)}
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
              onVoted={handleVoted}
              onOpenDetail={(pid) => (window.location.href = `/User/Polls/${pid}`)}
              forceResults
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PollArchive;
