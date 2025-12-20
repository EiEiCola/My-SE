import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import "./PollList.css";

type AnyPoll = any;

type Props = {
  poll: AnyPoll;

  getId: (p: AnyPoll) => number;
  getQuestion: (p: AnyPoll) => string;
  getDesc: (p: AnyPoll) => string;
  getCreatedAt: (p: AnyPoll) => any;
  getStartAt: (p: AnyPoll) => any;
  getEndAt: (p: AnyPoll) => any;

  // status ที่ส่งเข้ามา: "OPEN" | "UPCOMING" | "CLOSED"
  getStatus: (p: AnyPoll) => "OPEN" | "UPCOMING" | "CLOSED";

  getAllowMultiple: (p: AnyPoll) => boolean;
  getMaxChoice: (p: AnyPoll) => number | null;

  getOptions: (p: AnyPoll) => any[];
  optionId: (opt: any) => number;
  optionLabel: (opt: any) => string;
  optionVotes: (opt: any) => number | null;

  getCategoryTitle: (p: AnyPoll) => string;

  onVoted: (pollId: number, optionIds: number[]) => Promise<void>;
  onOpenDetail: (pollId: number) => void;

  // ✅ เพิ่ม: ใช้บังคับโชว์ผล (หน้า archive)
  forceResults?: boolean;

  // ✅ เพิ่ม: ถ้า backend ส่งมาว่า user เคยโหวตแล้ว (optional)
  initialHasVoted?: boolean;
  initialMyOptionIds?: number[];
};

export const PollCard: React.FC<Props> = (props) => {
  const p = props.poll;

  const id = props.getId(p);
  const status = props.getStatus(p);
  const question = props.getQuestion(p);
  const desc = props.getDesc(p);
  const created = props.getCreatedAt(p);
  const cat = props.getCategoryTitle(p);

  const allowMultiple = props.getAllowMultiple(p);
  const maxChoice = props.getMaxChoice(p);

  const options = props.getOptions(p) || [];

  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ เคยโหวตไหม (ถ้า OPEN แล้วยังไม่โหวต => ไม่ให้เห็นผล)
  const [hasVoted, setHasVoted] = useState<boolean>(Boolean(props.initialHasVoted));
  const [selected, setSelected] = useState<number[]>(props.initialMyOptionIds ?? []);

  const visibleOptions = useMemo(() => (expanded ? options : options.slice(0, 4)), [expanded, options]);

  const totalVotes = useMemo(() => {
    let sum = 0;
    let hasAny = false;
    for (const o of options) {
      const v = props.optionVotes(o);
      if (v !== null) {
        sum += v;
        hasAny = true;
      }
    }
    return hasAny ? sum : null;
  }, [options, props]);

  const timeHint = useMemo(() => {
    const startAt = props.getStartAt(p) ? dayjs(props.getStartAt(p)) : null;
    const endAt = props.getEndAt(p) ? dayjs(props.getEndAt(p)) : null;

    if (status === "OPEN" && endAt) return `⏱ ปิด ${dayjs().to(endAt)}`;
    if (status === "UPCOMING" && startAt) return `⏱ เริ่ม ${dayjs().to(startAt)}`;
    if (status === "CLOSED" && endAt) return `⏱ จบแล้ว ${dayjs(endAt).fromNow()}`;
    return "";
  }, [p, props, status]);

  const badgeCls =
    status === "OPEN" ? "badge badge-open" : status === "UPCOMING" ? "badge badge-upcoming" : "badge badge-closed";
  const badgeText = status === "OPEN" ? "เปิดอยู่" : status === "UPCOMING" ? "กำลังจะมา" : "ปิดแล้ว";

  // ✅ policy ใหม่
  const showResults = Boolean(props.forceResults) || status === "CLOSED" || (status === "OPEN" && hasVoted);
  const canVote = status === "OPEN" && !hasVoted; // โหวตได้ครั้งเดียว

  const submit = async (optionIds: number[]) => {
    if (!canVote) return;
    if (optionIds.length === 0) return;

    try {
      setSubmitting(true);
      await props.onVoted(id, optionIds);

      // หลังโหวต -> ถือว่าโหวตแล้ว และแสดงผลทันที
      setHasVoted(true);
      setSelected(optionIds);
    } catch (e) {
      console.error(e);
      alert("โหวตไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (optId: number) => {
    if (!canVote || submitting) return;

    if (!allowMultiple) {
      setSelected([optId]);
      void submit([optId]);
      return;
    }

    setSelected((prev) => {
      const has = prev.includes(optId);
      let next = has ? prev.filter((x) => x !== optId) : [...prev, optId];
      if (maxChoice && next.length > maxChoice) next = next.slice(0, maxChoice);
      return next;
    });
  };

  return (
    <div className="pc-card" onClick={() => props.onOpenDetail(id)}>
      <div className="pc-head">
        <div className="pc-left">
          <div className="pc-avatar">P</div>
          <div>
            <div className="pc-row">
              <div className="pc-author">Community Poll</div>
              {cat ? <span className="chip chip-orange">{cat}</span> : null}
              <span className={badgeCls}>{badgeText}</span>
            </div>
            <div className="pc-meta">
              <span className="pc-date">{created ? dayjs(created).format("DD/MM/YYYY HH:mm") : "-"}</span>
              {timeHint ? <span className="pc-hint">{timeHint}</span> : null}
              {totalVotes !== null ? <span className="pc-hint">• 🗳 {totalVotes} votes</span> : null}
            </div>
          </div>
        </div>

        <button className="icon-btn" type="button" onClick={(e) => e.stopPropagation()} title="More">
          ⋯
        </button>
      </div>

      <div className="pc-question">{question}</div>
      <div className="pc-desc">{desc?.trim() ? desc : "ไม่มีคำอธิบาย"}</div>

      {/* vote / results */}
      <div className="pc-vote" onClick={(e) => e.stopPropagation()}>
        {!showResults ? (
          <>
            <div className="pc-vote-title">
              {status === "UPCOMING" ? <span>โพลนี้ยังไม่เริ่ม</span> : allowMultiple ? (
                <span>เลือกได้หลายข้อ{maxChoice ? ` (สูงสุด ${maxChoice})` : ""}:</span>
              ) : (
                <span>เลือก 1 ข้อ:</span>
              )}
              {submitting ? <span className="pc-loading">กำลังส่ง...</span> : null}
            </div>

            {status === "UPCOMING" ? (
              <div className="pc-actions">
                <button className="btn btn-primary" type="button" onClick={() => props.onOpenDetail(id)}>
                  ดูรายละเอียด
                </button>
              </div>
            ) : (
              <>
                <div className="pc-options">
                  {visibleOptions.map((o) => {
                    const oid = props.optionId(o);
                    const label = props.optionLabel(o);
                    const isSelected = selected.includes(oid);
                    return (
                      <button
                        key={oid}
                        type="button"
                        className={isSelected ? "opt opt-selected" : "opt"}
                        onClick={() => toggle(oid)}
                        disabled={submitting}
                        title={label}
                      >
                        <span className="opt-dot">
                          {allowMultiple ? (isSelected ? "☑" : "☐") : isSelected ? "◉" : "○"}
                        </span>
                        <span className="opt-text">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {options.length > 4 ? (
                  <button className="link-btn" type="button" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? "ย่อรายการ" : `ดูตัวเลือกทั้งหมด (${options.length})`}
                  </button>
                ) : null}

                {allowMultiple ? (
                  <div className="pc-actions">
                    <button className="btn btn-outline" type="button" onClick={() => setSelected([])} disabled={submitting}>
                      ล้างที่เลือก
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => submit(selected)}
                      disabled={submitting || selected.length === 0}
                    >
                      ✅ ยืนยันโหวต
                    </button>
                  </div>
                ) : (
                  <div className="pc-actions">
                    <button className="btn btn-outline" type="button" onClick={() => props.onOpenDetail(id)}>
                      ดูรายละเอียด
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="pc-vote-title">ผลโหวต</div>

            {/* ถ้า backend ยังไม่ส่ง vote_count -> จะเห็น bar ว่าง (0%) */}
            <div className="pc-results">
              {options.map((o) => {
                const label = props.optionLabel(o);
                const v = props.optionVotes(o);
                const pct = totalVotes && v !== null ? Math.round((v / totalVotes) * 100) : null;

                const isMine = selected.includes(props.optionId(o)); // ไฮไลต์ที่เลือก (ถ้ามี)
                return (
                  <div className="rs-row" key={props.optionId(o)}>
                    <div className="rs-top">
                      <span className="rs-label">{isMine ? `✅ ${label}` : label}</span>
                      <span className="rs-val">{v !== null && totalVotes ? `${v} (${pct}%)` : v !== null ? `${v}` : "—"}</span>
                    </div>
                    <div className="rs-bar">
                      <div className="rs-fill" style={{ width: pct !== null ? `${pct}%` : "0%" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pc-actions">
              <button className="btn btn-primary" type="button" onClick={() => props.onOpenDetail(id)}>
                📊 ดูรายละเอียด
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
