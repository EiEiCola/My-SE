import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateReviewPage.css";

import { createReview, uploadReviewImages } from "../../../../services/http/reviewApi";

// ===== Types =====
type CategoryItem = {
  id: number;
  value: string;
  label: string;
  emoji: string;
  parent_id: number | null; // เพิ่ม parent_id เพื่อทำ Hierarchy
  hint?: string;
};

type ImageItem = {
  file: File | null;
  url: string;
};

type IdentityMode = "real" | "alias" | "anon";

const MAX_TITLE = 100;
const MAX_CONTENT = 500;
const MAX_IMAGES = 3;

// ✅ Mock ข้อมูลให้ตรงกับ Seed ใน Go ของคุณ (Main, L1, L2)
const categories: CategoryItem[] = [
  // Level 1: Main
  { id: 1, value: "หอพัก", label: "หอพัก", emoji: "🏢", parent_id: null, hint: "ความสะอาด/ปลอดภัย" },
  { id: 2, value: "โรงอาหารกลาง", label: "โรงอาหารกลาง", emoji: "🍚", parent_id: null, hint: "อาหาร/ร้านค้า/ความสะอาด" },
  { id: 3, value: "รายวิชาวิศวกรรมคอมพิวเตอร์", label: "วิชาคอมพิวเตอร์", emoji: "💻", parent_id: null, hint: "อาจารย์/งาน/การเรียน" },
  { id: 4, value: "สถานที่ออกกำลังกาย", label: "ออกกำลังกาย", emoji: "🏋️", parent_id: null, hint: "ฟิตเนส/สนาม/อุปกรณ์" },

  // Level 2: Sub L1 (ตัวอย่างหอพัก)
  { id: 10, value: "หอใน", label: "หอใน", emoji: "🏠", parent_id: 1 },
  { id: 11, value: "หอนอก", label: "หอนอก", emoji: "🏘️", parent_id: 1 },

  // Level 3: Sub L2 (ตัวอย่างหอใน)
  { id: 100, value: "โซน A", label: "โซน A", emoji: "📍", parent_id: 10 },
  { id: 101, value: "โซน B", label: "โซน B", emoji: "📍", parent_id: 10 },
];

const ratingText = (r: number) => {
  if (r <= 0) return "ยังไม่ได้ให้คะแนน";
  if (r === 1) return "แย่มาก";
  if (r === 2) return "พอใช้";
  if (r === 3) return "ปานกลาง";
  if (r === 4) return "ดี";
  return "ดีมาก";
};

const MY_USERNAME = "chaaim8dec";

// ===== Confirm Modal (ห้ามเปลี่ยนคำ) =====
type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  displayName: string;
  category: string;
  rating: number;
  title: string;
  content: string;
};

const ConfirmPostModal: React.FC<ConfirmModalProps> = ({
  open, onClose, onConfirm, displayName, category, rating, title, content,
}) => {
  if (!open) return null;
  return (
    <div className="crOverlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="crModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="crHead">
          <div className="crHeadTitle">ยืนยันการโพสต์รีวิว</div>
          <button type="button" className="crX" onClick={onClose} aria-label="close">✕</button>
        </div>
        <div className="crBody">
          <div className="crRow"><span>ชื่อที่จะแสดง</span><strong>{displayName}</strong></div>
          <div className="crRow"><span>หมวดหมู่</span><strong>{category || "-"}</strong></div>
          <div className="crRow"><span>คะแนน</span><strong>{rating > 0 ? `${rating}.0` : "-"}</strong></div>
          <div className="crPreview">
            <div className="crPrevTitle">{title || "-"}</div>
            <div className="crPrevText">{content || "-"}</div>
          </div>
          <div className="crWarn">⚠️ โพสต์แล้วไม่สามารถแก้ไขได้ กรุณาตรวจสอบก่อนยืนยัน</div>
        </div>
        <div className="crFoot">
          <button type="button" className="crBtn crCancel" onClick={onClose}>กลับไปแก้ไข</button>
          <button type="button" className="crBtn crOk" onClick={onConfirm}>ยืนยันโพสต์</button>
        </div>
      </div>
    </div>
  );
};

const CreateReviewPage: React.FC = () => {
  const navigate = useNavigate();

  // ปรับการเก็บ State Category จาก string เป็น ID (เพื่อรองรับ 3 ระดับ)
  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
  const [selectedL1Id, setSelectedL1Id] = useState<number | null>(null);
  const [selectedL2Id, setSelectedL2Id] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    rating: 0,
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [identityMode, setIdentityMode] = useState<IdentityMode>("real");
  const [aliasName, setAliasName] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Filter หมวดหมู่แต่ละระดับ
  const mainCats = useMemo(() => categories.filter(c => c.parent_id === null), []);
  const l1Cats = useMemo(() => categories.filter(c => c.parent_id === selectedMainId), [selectedMainId]);
  const l2Cats = useMemo(() => categories.filter(c => c.parent_id === selectedL1Id), [selectedL1Id]);

  // ชื่อหมวดหมู่ที่จะไปโชว์ใน Modal
  const categoryPathName = useMemo(() => {
    const m = categories.find(c => c.id === selectedMainId)?.label || "";
    const s1 = categories.find(c => c.id === selectedL1Id)?.label || "";
    const s2 = categories.find(c => c.id === selectedL2Id)?.label || "";
    return [m, s1, s2].filter(Boolean).join(" > ");
  }, [selectedMainId, selectedL1Id, selectedL2Id]);

  const displayName = useMemo(() => {
    if (identityMode === "real") return MY_USERNAME;
    if (identityMode === "anon") return "ไม่ระบุตัวตน";
    return aliasName.trim() || "นามแฝง";
  }, [identityMode, aliasName]);

  const canSubmit = useMemo(() => {
    const ok =
      !!selectedMainId && // ต้องเลือกหมวดหมู่หลัก
      formData.title.trim().length > 0 &&
      formData.content.trim().length > 0 &&
      formData.rating > 0;
    if (identityMode === "alias" && !aliasName.trim()) return false;
    return ok;
  }, [selectedMainId, formData, identityMode, aliasName]);

  const openFilePicker = () => { if (images.length < MAX_IMAGES) fileInputRef.current?.click(); };

  const onPickImages: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remain = MAX_IMAGES - images.length;
    const take = files.slice(0, remain);
    const mapped: ImageItem[] = take.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const removed = copy.splice(idx, 1);
      if (removed[0]?.url) URL.revokeObjectURL(removed[0].url);
      return copy;
    });
  };

  const handleReset = () => {
    setSelectedMainId(null); setSelectedL1Id(null); setSelectedL2Id(null);
    setFormData({ title: "", content: "", rating: 0 });
    setHoverRating(0); setIdentityMode("real"); setAliasName(""); setSubmitError("");
    setImages((prev) => { prev.forEach((it) => URL.revokeObjectURL(it.url)); return []; });
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    try {
      setSubmitting(true);
      setSubmitError("");

      // ส่ง ID ทั้ง 3 ระดับไปที่ Backend
      const created = await createReview({
        title: formData.title.trim(),
        content: formData.content.trim(),
        rating: Number(formData.rating),
        is_anonymous: identityMode === "anon",
        main_category_id: selectedMainId,
        sub_category_l1_id: selectedL1Id,
        sub_category_l2_id: selectedL2Id,
      });

      const reviewId = created?.ID ?? created?.id ?? created?.Id;
      if (!reviewId) throw new Error("createReview success แต่ไม่เจอ reviewId");

      const files = images.map((it) => it.file).filter(Boolean) as File[];
      if (files.length > 0) await uploadReviewImages(Number(reviewId), files);

      handleReset();
      navigate("/User/Review");
    } catch (e: any) {
      setSubmitError(e.message || "โพสต์ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClickPost = () => { if (canSubmit && !submitting) setOpenConfirm(true); };

  return (
    <div className="createPage">
      <div className="createWrap">
        <div className="createHeader">
          <button type="button" className="backBtn" onClick={() => navigate(-1)} disabled={submitting}>
            <span className="backIcon">←</span> กลับ
          </button>
          <div className="headRow">
            <div>
              <h1 className="pageTitle">เขียนรีวิว ✍️</h1>
              <p className="pageSub">แบ่งปันประสบการณ์ของคุณให้เพื่อนๆ ได้รับรู้</p>
            </div>
            <div className="badge"><span className="dot" /> Community Review</div>
          </div>
          <div className="warningCard">
            <div className="warnIcon">!</div>
            <div>
              <div className="warnTitle">โพสต์แล้วไม่สามารถแก้ไขได้</div>
              <div className="warnText">กรุณาตรวจสอบข้อความและคะแนนให้เรียบร้อยก่อนกด <b>“โพสต์รีวิว”</b></div>
            </div>
          </div>
          {submitError && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fee2e2", fontWeight: 800 }}>
              โพสต์ไม่สำเร็จ: {submitError}
            </div>
          )}
        </div>

        <div className="grid2">
          <div className="col">
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">หมวดหมู่ <span className="req">*</span></div>
                <div className="pill">เลือกหมวดหมู่</div>
              </div>

              {/* Level 1 Grid */}
              <div className="catGrid">
                {mainCats.map((cat) => (
                  <button key={cat.id} type="button" className={`catBtn ${selectedMainId === cat.id ? "active" : ""}`}
                    onClick={() => { setSelectedMainId(cat.id); setSelectedL1Id(null); setSelectedL2Id(null); }} disabled={submitting}>
                    <div className="catEmoji">{cat.emoji}</div>
                    <div className="catLabel">{cat.label}</div>
                    <div className="catHint">{cat.hint}</div>
                    {selectedMainId === cat.id && <div className="check">✓</div>}
                  </button>
                ))}
              </div>

              {/* Level 2 & 3 (แสดงเมื่อเลือก Main แล้ว) */}
              {selectedMainId && l1Cats.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eee" }}>
                  <div className="cardTitle" style={{ fontSize: 14, marginBottom: 10 }}>ระบุประเภท</div>
                  <div className="catGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {l1Cats.map(cat => (
                      <button key={cat.id} type="button" className={`catBtn ${selectedL1Id === cat.id ? "active" : ""}`}
                        onClick={() => { setSelectedL1Id(cat.id); setSelectedL2Id(null); }}>
                        <div className="catLabel" style={{ marginTop: 0 }}>{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedL1Id && l2Cats.length > 0 && (
                <div style={{ marginTop: 15 }}>
                  <div className="cardTitle" style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>รายละเอียดเพิ่มเติม</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {l2Cats.map(cat => (
                      <button key={cat.id} type="button" className={`catBtn ${selectedL2Id === cat.id ? "active" : ""}`}
                        style={{ padding: "8px 12px" }} onClick={() => setSelectedL2Id(cat.id)}>
                        <div className="catLabel" style={{ marginTop: 0, fontSize: 12 }}>{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">คะแนน <span className="req">*</span></div>
                <div className="ratingMeta">
                  <span className="ratingText">{ratingText(hoverRating || formData.rating)}</span>
                  <span className="ratingPill">{formData.rating > 0 ? `${formData.rating}.0` : "-"}</span>
                </div>
              </div>
              <div className="ratingBox">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" className={`starBtn ${star <= (hoverRating || formData.rating) ? "on" : ""}`}
                      onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormData((p) => ({ ...p, rating: star }))} disabled={submitting}>★</button>
                  ))}
                </div>
                <div className="ratingHint">แตะดาวเพื่อให้คะแนน (1-5 ดาว)</div>
              </div>
            </div>

            {/* Images */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">รูปภาพ (ไม่บังคับ)</div>
                <div className="pill">{images.length}/{MAX_IMAGES}</div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hiddenInput" onChange={onPickImages} disabled={submitting} />
              <div className="imgGrid">
                {Array.from({ length: MAX_IMAGES }).map((_, idx) => {
                  const item = images[idx];
                  return (
                    <div key={idx} className={`imgSlot ${item ? "has" : ""}`}>
                      {item ? (
                        <><img src={item.url} alt="upload" /><button type="button" className="imgDel" onClick={() => removeImage(idx)} disabled={submitting}>✕</button></>
                      ) : (
                        <button type="button" className="imgAdd" onClick={openFilePicker} disabled={images.length >= MAX_IMAGES || submitting}>
                          <div className="imgAddIcon">📷</div><div className="imgAddText">เพิ่มรูป</div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" className={`btnOutline ${images.length >= MAX_IMAGES ? "disabled" : ""}`} onClick={openFilePicker} disabled={images.length >= MAX_IMAGES || submitting}>+ เพิ่มรูปภาพ</button>
            </div>
          </div>

          <div className="col">
            {/* Title */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">หัวข้อรีวิว <span className="req">*</span></div>
                <div className="mutedSmall">{formData.title.length}/{MAX_TITLE}</div>
              </div>
              <input className="input" type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value.slice(0, MAX_TITLE) }))} placeholder="เช่น อาหารอร่อย บรรยากาศดี" disabled={submitting} />
              <div className="helper">หัวข้อสั้น กระชับ อ่านแล้วเข้าใจทันที</div>
            </div>

            {/* Content */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">เนื้อหารีวิว <span className="req">*</span></div>
                <div className="mutedSmall">{formData.content.length}/{MAX_CONTENT}</div>
              </div>
              <textarea className="textarea" value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value.slice(0, MAX_CONTENT) }))} placeholder="เขียนรีวิวของคุณ..." rows={12} disabled={submitting} />
              <div className="tipBox"><div className="tipIcon">💡</div><div className="tipText"><b>เขียนให้ชัดเจน:</b> อะไรดี / อะไรควรหลีกเลี่ยง / แนะนำช่วงเวลา</div></div>
            </div>

            {/* Identity */}
            <div className="card">
              <div className="cardHead"><div><div className="cardTitle">การแสดงชื่อ</div><div className="mutedSmall">เลือกว่าคนอื่นจะเห็นชื่อคุณแบบไหน</div></div></div>
              <div className="idOptions">
                {(["real", "alias", "anon"] as IdentityMode[]).map(mode => (
                  <label key={mode} className={`idOpt ${identityMode === mode ? "active" : ""}`}>
                    <input type="radio" checked={identityMode === mode} onChange={() => setIdentityMode(mode)} disabled={submitting} />
                    <div className="idText">
                      <div className="idMain">{mode === "real" ? "แสดงชื่อจริง" : mode === "alias" ? "ใช้นามแฝง" : "ไม่ระบุตัวตน"}</div>
                      <div className="idHint">{mode === "real" ? `จะขึ้นชื่อ: ${MY_USERNAME}` : mode === "alias" ? "ใส่ชื่อเล่น/นามแฝง" : "จะแสดงเป็น “ไม่ระบุตัวตน”"}</div>
                    </div>
                  </label>
                ))}
              </div>
              {identityMode === "alias" && (
                <div className="aliasBox">
                  <input value={aliasName} onChange={(e) => setAliasName(e.target.value.slice(0, 20))} placeholder="เช่น เพื่อนใจดี, น้องปี1" disabled={submitting} />
                  <div className="aliasCount">{aliasName.length}/20</div>
                </div>
              )}
            </div>

            {/* Submit Section */}
            <div className="card">
              <div className="actions">
                <button type="button" className="btnGray" onClick={handleReset} disabled={submitting}>ล้างฟอร์ม</button>
                <button type="button" className={`btnPrimary ${!canSubmit || submitting ? "disabled" : ""}`} onClick={handleClickPost} disabled={!canSubmit || submitting}>
                  {submitting ? "กำลังโพสต์..." : "โพสต์รีวิว 🚀"}
                </button>
              </div>
              {!canSubmit && (
                <div className="note">กรุณากรอก <b>หมวดหมู่ / คะแนน / ชื่อที่แสดง / หัวข้อ / เนื้อหา</b> ให้ครบ</div>
              )}
            </div>
          </div>
        </div>
        <div style={{ height: 16 }} />
      </div>

      <ConfirmPostModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={async () => { setOpenConfirm(false); await handleSubmit(); }}
        displayName={displayName}
        category={categoryPathName}
        rating={formData.rating}
        title={formData.title}
        content={formData.content}
      />
    </div>
  );
};

export default CreateReviewPage;