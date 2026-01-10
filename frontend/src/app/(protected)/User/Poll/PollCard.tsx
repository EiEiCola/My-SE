// frontend/src/app/(protected)/User/Poll/PollCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./PollList.css";

type AnyPoll = any;

type Props = {
  poll: AnyPoll;

  // ✅ NEW: id ของคนที่ login (เอามาเช็คว่าเป็นเจ้าของโพลไหม)
  currentMemberId?: number;

  getId: (p: AnyPoll) => number;
  getQuestion: (p: AnyPoll) => string;
  getDesc: (p: AnyPoll) => string;
  getCreatedAt: (p: AnyPoll) => any;
  getStartAt: (p: AnyPoll) => any;
  getEndAt: (p: AnyPoll) => any;

  getAuthorName: (p: AnyPoll) => string;

  // status ที่ส่งเข้ามา: "OPEN" | "UPCOMING" | "CLOSED"
  getStatus: (p: AnyPoll) => "OPEN" | "UPCOMING" | "CLOSED";

  getAllowMultiple: (p: AnyPoll) => boolean;
  getMaxChoice: (p: AnyPoll) => number | null;

  getOptions: (p: AnyPoll) => any[];
  optionId: (opt: any) => number;
  optionLabel: (opt: any) => string;
  optionVotes: (opt: any) => number | null;

  getCategoryTitle: (p: AnyPoll) => string;

  onOpenDetail: (pollId: number) => void;

  // ✅ selection/vote คุมจาก PollList
  selectedOptionIds: number[];
  onToggleOption: (optId: number) => void;
  onClearSelection?: () => void;

  // ✅ IMPORTANT: onConfirmVote ต้องบอกผลจริง (true/false)
  onConfirmVote: () => Promise<boolean> | boolean;

  submitting: boolean;
  canConfirm: boolean;

  // ✅ ใช้บังคับโชว์ผล (หน้า archive) — แต่ใน feed เราจะ “ไม่โชว์กราฟ” แล้ว
  forceResults?: boolean;

  // ✅ ถ้า backend ส่งมาว่า user เคยโหวตแล้ว (optional)
  initialHasVoted?: boolean;
  initialMyOptionIds?: number[];

  // ✅ NEW: map main_category_id -> title (จาก PollList)
  mainNameById?: Record<number, string>;

  // ✅ NEW: toast จาก PollList ต่อการ์ด
  toastMessage?: string;

  // ✅ NEW: delete function for poll owners
  onDelete?: () => void;
};

const optionImg = (opt: any) =>
  String(opt?.img_url ?? opt?.ImgURL ?? opt?.image_url ?? opt?.imageUrl ?? opt?.imgUrl ?? "").trim();

export const PollCard: React.FC<Props> = (props) => {
  const p = props.poll;
  const navigate = useNavigate();

  const id = props.getId(p);
  const status = props.getStatus(p);
  const question = props.getQuestion(p);
  const desc = props.getDesc(p);
  const created = props.getCreatedAt(p);

  // ===== category: show only MAIN (short) =====
  // ✅ display deepest category: Sub2 > Sub1 > Main
  const sub2Title = String(p?.sub_category_l2?.title ?? p?.SubCategoryL2?.Title ?? "").trim();
  const sub1Title = String(p?.sub_category_l1?.title ?? p?.SubCategoryL1?.Title ?? "").trim();

  const mainId =
    Number(p?.main_category_id ?? p?.MainCategoryID ?? p?.mainCategoryID ?? p?.main_category?.id ?? 0) || 0;

  const mainTitle =
    (mainId && props.mainNameById?.[mainId]) ||
    String(p?.main_category?.title ?? p?.MainCategory?.Title ?? "").trim() ||
    "";

  const displayCategory = sub2Title || sub1Title || mainTitle;

  // (keep legacy variable, but we will show mainBadgeText)
  const cat = props.getCategoryTitle(p);

  const author = props.getAuthorName(p);

  // ✅ NEW: ดึง avatar + is_anonymous
  const isAnonymous = Boolean(p?.is_anonymous ?? p?.IsAnonymous ?? false);
  const avatarUrl = String(p?.author_avatar_url ?? p?.AuthorAvatarURL ?? "").trim();
  const ANON_AVATAR = "/avatars/anon.png";

  const allowMultiple = props.getAllowMultiple(p);
  const maxChoice = props.getMaxChoice(p);

  const options = props.getOptions(p) || [];
  const [expanded, setExpanded] = useState(false);

  // ✅ preview image modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const closeImg = () => setPreviewUrl(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeImg();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);



  // ✅ lock scroll when modal opens
  useEffect(() => {
    if (!previewUrl) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewUrl]);

  // backend ของเธอส่งมาเป็น snake_case: has_voted / my_option_ids
  const derivedHasVoted = useMemo(() => {
    if (typeof props.initialHasVoted === "boolean") return props.initialHasVoted;
    if (typeof p?.has_voted === "boolean") return p.has_voted;
    if (typeof p?.hasVoted === "boolean") return p.hasVoted;
    return false;
  }, [p, props.initialHasVoted]);

  const derivedMyOptionIds = useMemo(() => {
    const v = Array.isArray(props.initialMyOptionIds)
      ? props.initialMyOptionIds
      : Array.isArray(p?.my_option_ids)
        ? p.my_option_ids
        : Array.isArray(p?.myOptionIds)
          ? p.myOptionIds
          : [];
    return v.filter((x: any) => typeof x === "number" && x > 0);
  }, [p, props.initialMyOptionIds]);

  // ✅ internal state (ใช้สำหรับ “เคยโหวตแล้ว / จำคำตอบเรา”)
  const [hasVoted, setHasVoted] = useState<boolean>(derivedHasVoted);
  const [selected, setSelected] = useState<number[]>(derivedMyOptionIds);

  useEffect(() => {
    setHasVoted(derivedHasVoted);
    setSelected(derivedMyOptionIds);
  }, [id, derivedHasVoted, derivedMyOptionIds]);



  const [localSubmitting, setLocalSubmitting] = useState(false);
  const submitting = Boolean(props.submitting) || localSubmitting;

  const DEFAULT_VISIBLE = 5;
  const visibleOptions = useMemo(
    () => (expanded ? options : options.slice(0, DEFAULT_VISIBLE)),
    [expanded, options]
  );


  const totalVotes = useMemo(() => {
    // ✅ NEW: Prefer total_voters from backend (unique voters)
    const tv = (p as any)?.total_voters ?? (p as any)?.totalVoters ?? (p as any)?.TotalVoters;
    if (typeof tv === 'number') return tv;

    // Fallback: sum of option votes (might count selections, not voters)
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
  }, [options, props, p]);

  const timeHint = useMemo(() => {
    const startAt = props.getStartAt(p) ? dayjs(props.getStartAt(p)) : null;
    const endAt = props.getEndAt(p) ? dayjs(props.getEndAt(p)) : null;

    if (status === "OPEN" && endAt) return `⏱ ปิด ${dayjs().to(endAt)}`;
    if (status === "UPCOMING" && startAt) return `⏱ เริ่ม ${dayjs().to(startAt)}`;
    if (status === "CLOSED" && endAt) return `จบเมื่อ ${dayjs(endAt).fromNow()}`;

    return "";
  }, [p, props, status]);

  const badgeCls =
    status === "OPEN" ? "badge badge-open" : status === "UPCOMING" ? "badge badge-upcoming" : "badge badge-closed";
  const badgeText = status === "OPEN" ? "เปิดอยู่" : status === "UPCOMING" ? "กำลังจะมา" : "ปิดแล้ว";

  // ✅ NEW: ตรวจว่าเป็นเจ้าของโพลไหม (กันกดโหวตตั้งแต่ UI)
  // ✅ NEW: ตรวจว่าเป็นเจ้าของโพลไหม (กันกดโหวตตั้งแต่ UI)
  const ownerId =
    Number(
      // แนะนำให้ “ย้าย member_id ไปท้ายสุด” เผื่อ backend ใช้ member_id อย่างอื่น
      p?.created_by_id ??
      p?.CreatedByID ??
      p?.created_by ??
      p?.creator_id ??
      p?.creatorId ??
      p?.author_id ??
      p?.owner_id ??
      p?.member_id ??
      p?.MemberID ??
      p?.member?.id ??
      p?.Member?.ID ??
      0
    ) || 0;

  const myId = Number(props.currentMemberId ?? 0) || 0;

  const isOwner = ownerId > 0 && myId > 0 && ownerId === myId;
  const isMine = isOwner;

  // ✅ Handle username click (navigate to profile)
  const handleUsernameClick = () => {
    if (isAnonymous) return;

    // ✅ ถ้าเป็นของตัวเอง ให้ไป /User/Profile เสมอ
    if (isMine) {
      navigate("/User/Profile");
      return;
    }

    // ✅ ของคนอื่น -> /User/Profile/:memberId
    if (ownerId) navigate(`/User/Profile/${ownerId}`);
  };

  // ✅ ล็อกเฉพาะเจ้าของจริง ๆ เท่านั้น
  const ownerLocked = isOwner;

  // ✅ ให้โหวตได้เฉพาะ: OPEN + ยังไม่โหวต + ไม่ใช่เจ้าของ + ต้องมี myId
  const canVote = status === "OPEN" && !hasVoted && !isOwner && myId > 0;

  // ✅ ใส่ตรงนี้เลย (ก่อน return)
  useEffect(() => {
    console.log("[PollCard debug]", {
      pollId: id,
      ownerId,
      myId,
      isOwner,
      raw: { member_id: p?.member_id, created_by: p?.created_by, created_by_id: p?.created_by_id },
    });
  }, [id, ownerId, myId, isOwner, p]);




  const selectedNow = canVote ? props.selectedOptionIds : selected;

  const submit = async () => {
    if (!canVote) return;
    if (props.selectedOptionIds.length === 0) return;

    const snapshot = props.selectedOptionIds.slice();
    try {
      setLocalSubmitting(true);

      // ✅ IMPORTANT: ต้องได้ผลจริงจาก parent
      const ok = await props.onConfirmVote();

      // ✅ ถ้าไม่สำเร็จ ห้าม set ว่าโหวตแล้ว
      if (!ok) return;

      setHasVoted(true);
      setSelected(snapshot);
    } catch (e) {
      console.error(e);
      // ❌ ไม่ใช้ alert แล้ว (ให้ parent โชว์ toastMessage)
    } finally {
      setLocalSubmitting(false);
    }
  };

  const toggle = (optId: number) => {
    if (ownerLocked) return;
    if (!canVote || submitting) return;
    props.onToggleOption(optId);
  };

  const myChoiceText = useMemo(() => {
    if (!hasVoted) return "";
    if (!selected?.length) return "";
    if (!options?.length) return "";

    const map = new Map<number, string>();
    for (const o of options) map.set(Number(props.optionId(o)), String(props.optionLabel(o) ?? ""));
    const names = selected.map((id) => map.get(id) || String(id)).filter(Boolean);
    return names.join(", ");
  }, [hasVoted, options, selected, props]);

  useEffect(() => {
    console.log("[PollCard debug]", { pollId: id, ownerId, myId, raw: { member_id: p?.member_id, created_by: p?.created_by } });
  }, [id, ownerId, myId]);


  return (
    <div className="pc-card" onClick={() => props.onOpenDetail(id)}>
      <div className="pc-head">
        <div className="pc-left">
          {/* ✅ Avatar with profile picture */}
          <div className="pc-avatar">
            {isAnonymous || author === "ไม่เปิดเผยชื่อ" || author === "ไม่ระบุตัวตน" ? (
              <img src={ANON_AVATAR} alt="anonymous" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <span>{(author || "P").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="pc-row">
              {/* ✅ Clickable username for non-anonymous polls */}
              {!isAnonymous && ownerId ? (
                <div
                  className="pc-author pc-author-clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUsernameClick();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUsernameClick();
                    }
                  }}
                >
                  {author}
                </div>
              ) : (
                <div className="pc-author">{author}</div>
              )}
              <span className={badgeCls}>{badgeText}</span>
            </div>

            <div className="pc-meta">
              <span className="pc-date">{created ? dayjs(created).format("DD/MM/YYYY HH:mm") : "-"}</span>

              {timeHint ? (
                <span className={`pc-timePill pc-timePill-${status.toLowerCase()}`}>
                  <span className="pc-timeDot" />
                  {timeHint}
                </span>
              ) : null}

              {totalVotes !== null ? <span className="pc-hint">• 🗳 {totalVotes} votes</span> : null}
            </div>
          </div>
        </div>

        <div className="pc-topRight" onClick={(e) => e.stopPropagation()}>
          {displayCategory && <span className="pc-catPill">{displayCategory}</span>}

          {/* ✅ Delete button for poll owner */}
          {isOwner && props.onDelete && (
            <button
              type="button"
              className="pc-del"
              onClick={(e) => {
                e.stopPropagation();
                props.onDelete?.();
              }}
              title="ลบโพล"
              aria-label="delete poll"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="pc-delIcon"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V5.25h4.5a.75.75 0 0 1 0 1.5h-.69l-1.02 13.2A2.25 2.25 0 0 1 15.55 22.5H8.45a2.25 2.25 0 0 1-2.24-2.55L5.19 6.75H4.5a.75.75 0 0 1 0-1.5H9V3.75Zm1.5 1.5h3V3.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v1.5ZM7.7 6.75l.99 12.9a.75.75 0 0 0 .75.7h5.12a.75.75 0 0 0 .75-.7l.99-12.9H7.7Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="pc-question">{question}</div>
      {desc ? <div className="pc-desc">{desc}</div> : null}

      {/* vote / summary (NO RESULTS BARS IN FEED) */}
      <div className="pc-vote" onClick={(e) => e.stopPropagation()}>
        {/* ===== title line ===== */}
        <div className="pc-vote-title">
          {status === "UPCOMING" ? (
            <span>ตัวเลือก (โพลยังไม่เริ่ม):</span>
          ) : status === "CLOSED" ? (
            <span>ตัวเลือก (โพลปิดแล้ว):</span>
          ) : canVote ? (
            allowMultiple ? (
              <span>เลือกได้หลายข้อ{maxChoice ? ` (สูงสุด ${maxChoice})` : ""}:</span>
            ) : (
              <span>เลือก 1 ข้อ:</span>
            )
          ) : isOwner ? (
            <span>ตัวเลือก (เจ้าของโพลโหวตไม่ได้):</span>
          ) : hasVoted ? (
            <span>ตัวเลือก (คุณโหวตแล้ว):</span>
          ) : (
            <span>ตัวเลือก:</span>
          )}

          {submitting ? <span className="pc-loading">กำลังส่ง...</span> : null}
        </div>

        {/* ===== options list (ALWAYS show in feed) ===== */}
        <div className={isOwner ? "pc-options pc-options-ownerLocked" : "pc-options"}>
          {visibleOptions.map((o) => {
            const oid = props.optionId(o);
            const label = props.optionLabel(o);
            const isSel = selectedNow.includes(oid);
            const img = optionImg(o);

            return (
              <button
                key={oid}
                type="button"
                className={[
                  isSel ? "opt opt-selected" : "opt",
                  ownerLocked ? "opt-ownerLocked" : "",
                  !canVote ? "opt-disabled" : "",
                ].join(" ")}
                disabled={submitting || ownerLocked}   // ✅ owner กดไม่ได้เลย
                onClick={(e) => {
                  // ถ้า owner => ไม่ทำอะไร
                  if (ownerLocked) return;
                  const target = e.target as HTMLElement;
                  if (target?.closest?.(".opt-thumb-click")) return;

                  if (!canVote || submitting) return;
                  toggle(oid);
                }}
                title={label}
              >
                <span className="opt-dot">{isSel ? "✓" : ""}</span>

                {img ? (
                  <img
                    className="opt-thumb opt-thumb-click"
                    src={img}
                    alt={label}
                    draggable={false}
                    loading="lazy"
                    onClick={(e) => {
                      // ✅ owner ห้ามกดรูปด้วย
                      if (ownerLocked) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewUrl(img);
                    }}
                  />
                ) : null}

                <span className="opt-text">{label}</span>
              </button>

            );
          })}
        </div>

        {/* ===== expand / collapse (if more than 5) ===== */}
        {options.length > 5 ? (
          <button className="link-btn" type="button" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "ย่อรายการ" : `ดูตัวเลือกเพิ่มเติม (${options.length})`}
          </button>
        ) : null}

        {/* ===== actions ===== */}
        {canVote ? (
          <div className="pc-actions">
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => props.onClearSelection?.()}
              disabled={submitting || props.selectedOptionIds.length === 0}
            >
              ล้างที่เลือก
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={submit}
              disabled={!canVote || submitting || !props.canConfirm}
            >
              ✅ ยืนยันโหวต
            </button>
          </div>
        ) : (
          <div className="pc-actions" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" type="button" onClick={() => props.onOpenDetail(id)}>
              {status === "UPCOMING" ? "ดูรายละเอียด" : "📊 ดูรายละเอียด"}
            </button>
          </div>
        )}

        {/* ===== bottom summary (small) ===== */}
        {ownerLocked ? (
          <div className="pc-voteSummary pc-voteSummary-owner">
            เจ้าของโพลไม่สามารถโหวตโพลของตนเองได้
          </div>
        ) : hasVoted && myChoiceText ? (
          <div className="pc-voteSummary">คุณโหวต: {myChoiceText}</div>
        ) : null}


        {/* ✅ Toast message (เดิมของเธอ) */}
        {props.toastMessage ? (
          <div
            className="pc-toast"
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,122,24,.25)",
              background: "rgba(255,122,24,.10)",
              fontWeight: 800,
              color: "rgba(31,35,40,.85)",
            }}
          >
            {props.toastMessage}
          </div>
        ) : null}
      </div>


      {/* ✅ Image Preview Modal */}
      {previewUrl
        ? createPortal(
          <div
            className="pc-imgModal"
            onClick={() => setPreviewUrl(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999999,
              background: "rgba(0,0,0,.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 18,
            }}
          >
            <div
              className="pc-imgModalBody"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                width: "min(980px, 96vw)",
                maxHeight: "92vh",
                background: "#fff",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 22px 60px rgba(0,0,0,.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <button
                className="pc-imgModalClose"
                type="button"
                onClick={() => setPreviewUrl(null)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(31,35,40,.12)",
                  background: "rgba(255,255,255,.92)",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                ✕
              </button>

              <img
                className="pc-imgModalImg"
                src={previewUrl}
                alt="preview"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "92vh",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>,
          document.body
        )
        : null}
    </div>
  );
};
