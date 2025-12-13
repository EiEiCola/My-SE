import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateReviewPage.css";


import { createReview, uploadReviewImages } from "../../../../services/http/reviewApi";




type CategoryItem = {
  value: string;
  label: string;
  emoji: string;
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

const categories: CategoryItem[] = [
  { value: "โรงอาหารกลาง", label: "โรงอาหารกลาง", emoji: "🍚", hint: "อาหาร/ร้านค้า/ความสะอาด" },
  { value: "รายวิชาวิศวกรรมคอมพิวเตอร์", label: "วิชาคอมพิวเตอร์", emoji: "💻", hint: "อาจารย์/งาน/การเรียน" },
  { value: "สถานที่ออกกำลังกาย", label: "ออกกำลังกาย", emoji: "🏋️", hint: "ฟิตเนส/สนาม/อุปกรณ์" },
  { value: "หอพัก", label: "หอพัก", emoji: "🏢", hint: "ความสะอาด/ปลอดภัย" },
];

const ratingText = (r: number) => {
  if (r <= 0) return "ยังไม่ได้ให้คะแนน";
  if (r === 1) return "แย่มาก";
  if (r === 2) return "พอใช้";
  if (r === 3) return "ปานกลาง";
  if (r === 4) return "ดี";
  return "ดีมาก";
};

const MY_USERNAME = "chaaim8dec"; // TODO: ดึงจาก auth จริงภายหลัง

// ✅ แปลง category (string) -> main_category_id (number)
// ตอนนี้ใส่ “ตัวอย่าง” ก่อนนะ ต้องปรับให้ตรงกับ ID ใน DB ของทีม
const mapCategoryToMainCategoryID = (categoryValue: string): number => {
  const map: Record<string, number> = {
    "โรงอาหารกลาง": 1,
    "รายวิชาวิศวกรรมคอมพิวเตอร์": 2,
    "สถานที่ออกกำลังกาย": 3,
    "หอพัก": 4,
  };
  return map[categoryValue] ?? 1;
};

// ===== Confirm Modal =====
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
  open,
  onClose,
  onConfirm,
  displayName,
  category,
  rating,
  title,
  content,
}) => {
  if (!open) return null;

  return (
    <div
      className="crOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="crModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="crHead">
          <div className="crHeadTitle">ยืนยันการโพสต์รีวิว</div>
          <button type="button" className="crX" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        <div className="crBody">
          <div className="crRow">
            <span>ชื่อที่จะแสดง</span>
            <strong>{displayName}</strong>
          </div>
          <div className="crRow">
            <span>หมวดหมู่</span>
            <strong>{category || "-"}</strong>
          </div>
          <div className="crRow">
            <span>คะแนน</span>
            <strong>{rating > 0 ? `${rating}.0` : "-"}</strong>
          </div>

          <div className="crPreview">
            <div className="crPrevTitle">{title || "-"}</div>
            <div className="crPrevText">{content || "-"}</div>
          </div>

          <div className="crWarn">⚠️ โพสต์แล้วไม่สามารถแก้ไขได้ กรุณาตรวจสอบก่อนยืนยัน</div>
        </div>

        <div className="crFoot">
          <button type="button" className="crBtn crCancel" onClick={onClose}>
            กลับไปแก้ไข
          </button>
          <button type="button" className="crBtn crOk" onClick={onConfirm}>
            ยืนยันโพสต์
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateReviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    content: "",
    rating: 0,
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Identity
  const [identityMode, setIdentityMode] = useState<IdentityMode>("real");
  const [aliasName, setAliasName] = useState("");

  // Confirm modal
  const [openConfirm, setOpenConfirm] = useState(false);

  // ✅ เพิ่ม state สำหรับ submit จริง
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const displayName = useMemo(() => {
    if (identityMode === "real") return MY_USERNAME;
    if (identityMode === "anon") return "ไม่ระบุตัวตน";
    return aliasName.trim() || "นามแฝง";
  }, [identityMode, aliasName]);

  const canSubmit = useMemo(() => {
    const ok =
      !!formData.category &&
      formData.title.trim().length > 0 &&
      formData.content.trim().length > 0 &&
      formData.rating > 0;

    // ถ้าเลือกนามแฝง ต้องกรอกด้วย
    if (identityMode === "alias" && !aliasName.trim()) return false;

    return ok;
  }, [formData, identityMode, aliasName]);

  const openFilePicker = () => {
    if (images.length >= MAX_IMAGES) return;
    fileInputRef.current?.click();
  };

  const onPickImages: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remain = MAX_IMAGES - images.length;
    const take = files.slice(0, remain);

    const mapped: ImageItem[] = take.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));

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
    setFormData({ category: "", title: "", content: "", rating: 0 });
    setHoverRating(0);
    setIdentityMode("real");
    setAliasName("");
    setSubmitError("");
    setImages((prev) => {
      prev.forEach((it) => URL.revokeObjectURL(it.url));
      return [];
    });
  };

  // ✅ ยิง POST จริง
  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");

      const mainCategoryID = mapCategoryToMainCategoryID(formData.category);

      // backend รับ: title, content, rating, is_anonymous, main_category_id, sub_category...
      // ❌ ไม่ส่ง member_id
      await createReview({
        title: formData.title.trim(),
        content: formData.content.trim(),
        rating: Number(formData.rating),
        is_anonymous: identityMode === "anon", // ✅ anon เท่านั้นที่เป็น anonymous จริงใน backend
        main_category_id: mainCategoryID,

        // ตอนนี้ UI ยังไม่เลือก sub-category -> ส่งเป็น null/ไม่ส่งก็ได้
        sub_category_l1_id: null,
        sub_category_l2_id: null,

        // ถ้าทีมยังไม่ทำ hashtags/images endpoint จริง: ไม่ต้องส่ง
        // hashtags: [],
        // images: [],
      });

      const created = await createReview({
  title: formData.title.trim(),
  content: formData.content.trim(),
  rating: Number(formData.rating),
  is_anonymous: identityMode === "anon",
  main_category_id: mainCategoryID,
  sub_category_l1_id: null,
  sub_category_l2_id: null,
});

// ✅ ดึง id ให้ชัวร์ (เพราะ backend บางทีส่ง ID/Id/id)
const reviewId =
  created?.ID ?? created?.id ?? created?.Id;

if (!reviewId) throw new Error("createReview success แต่ไม่เจอ reviewId");

// ✅ upload รูป (ถ้ามี)
const files = images.map((it) => it.file).filter(Boolean) as File[];
if (files.length > 0) {
  await uploadReviewImages(Number(reviewId), files);
}


      // สำเร็จ: เคลียร์ฟอร์ม + กลับหน้า list
      handleReset();
      navigate("/User/Review");
    } catch (e: any) {
      setSubmitError(e.message || "โพสต์ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClickPost = () => {
    if (!canSubmit || submitting) return;
    setOpenConfirm(true);
  };

  return (
    <div className="createPage">
      <div className="createWrap">
        {/* Header */}
        <div className="createHeader">
          <button type="button" className="backBtn" onClick={() => navigate(-1)} disabled={submitting}>
            <span className="backIcon">←</span>
            กลับ
          </button>

          <div className="headRow">
            <div>
              <h1 className="pageTitle">เขียนรีวิว ✍️</h1>
              <p className="pageSub">แบ่งปันประสบการณ์ของคุณให้เพื่อนๆ ได้รับรู้</p>
            </div>

            <div className="badge">
              <span className="dot" />
              Community Review
            </div>
          </div>

          {/* Warning */}
          <div className="warningCard">
            <div className="warnIcon">!</div>
            <div>
              <div className="warnTitle">โพสต์แล้วไม่สามารถแก้ไขได้</div>
              <div className="warnText">
                กรุณาตรวจสอบข้อความและคะแนนให้เรียบร้อยก่อนกด <b>“โพสต์รีวิว”</b>
              </div>
            </div>
          </div>

          {/* ✅ error จาก backend */}
          {submitError && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fee2e2", fontWeight: 800 }}>
              โพสต์ไม่สำเร็จ: {submitError}
            </div>
          )}
        </div>

        {/* 2 Column */}
        <div className="grid2">
          {/* LEFT */}
          <div className="col">
            {/* Category */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">
                  หมวดหมู่ <span className="req">*</span>
                </div>
                <div className="pill">เลือก 1 หมวด</div>
              </div>

              <div className="catGrid">
                {categories.map((cat) => {
                  const active = formData.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      className={`catBtn ${active ? "active" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, category: cat.value }))}
                      disabled={submitting}
                    >
                      <div className="catEmoji">{cat.emoji}</div>
                      <div className="catLabel">{cat.label}</div>
                      <div className="catHint">{cat.hint}</div>
                      {active && <div className="check">✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">
                  คะแนน <span className="req">*</span>
                </div>
                <div className="ratingMeta">
                  <span className="ratingText">{ratingText(hoverRating || formData.rating)}</span>
                  <span className="ratingPill">{formData.rating > 0 ? `${formData.rating}.0` : "-"}</span>
                </div>
              </div>

              <div className="ratingBox">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || formData.rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`starBtn ${active ? "on" : ""}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormData((p) => ({ ...p, rating: star }))}
                        aria-label={`rate-${star}`}
                        disabled={submitting}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <div className="ratingHint">แตะดาวเพื่อให้คะแนน (1-5 ดาว)</div>
              </div>
            </div>

            {/* Images */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">รูปภาพ (ไม่บังคับ)</div>
                <div className="pill">
                  {images.length}/{MAX_IMAGES}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hiddenInput"
                onChange={onPickImages}
                disabled={submitting}
              />

              <div className="imgGrid">
                {Array.from({ length: MAX_IMAGES }).map((_, idx) => {
                  const item = images[idx];
                  return (
                    <div key={idx} className={`imgSlot ${item ? "has" : ""}`}>
                      {item ? (
                        <>
                          <img src={item.url} alt={`upload-${idx}`} />
                          <button
                            type="button"
                            className="imgDel"
                            onClick={() => removeImage(idx)}
                            aria-label="remove"
                            disabled={submitting}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="imgAdd"
                          onClick={openFilePicker}
                          disabled={images.length >= MAX_IMAGES || submitting}
                        >
                          <div className="imgAddIcon">📷</div>
                          <div className="imgAddText">เพิ่มรูป</div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className={`btnOutline ${images.length >= MAX_IMAGES ? "disabled" : ""}`}
                onClick={openFilePicker}
                disabled={images.length >= MAX_IMAGES || submitting}
              >
                + เพิ่มรูปภาพ
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col">
            {/* Title */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">
                  หัวข้อรีวิว <span className="req">*</span>
                </div>
                <div className="mutedSmall">
                  {formData.title.length}/{MAX_TITLE}
                </div>
              </div>

              <input
                className="input"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value.slice(0, MAX_TITLE) }))}
                placeholder="เช่น อาหารอร่อย บรรยากาศดี"
                disabled={submitting}
              />
              <div className="helper">หัวข้อสั้น กระชับ อ่านแล้วเข้าใจทันที</div>
            </div>

            {/* Content */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">
                  เนื้อหารีวิว <span className="req">*</span>
                </div>
                <div className="mutedSmall">
                  {formData.content.length}/{MAX_CONTENT}
                </div>
              </div>

              <textarea
                className="textarea"
                value={formData.content}
                onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value.slice(0, MAX_CONTENT) }))}
                placeholder="เขียนรีวิวของคุณ... เช่น จุดเด่น/ข้อควรระวัง/แนะนำเวลาไป"
                rows={12}
                disabled={submitting}
              />

              <div className="tipBox">
                <div className="tipIcon">💡</div>
                <div className="tipText">
                  <b>เขียนให้ชัดเจน:</b> อะไรดี / อะไรควรหลีกเลี่ยง / แนะนำช่วงเวลา
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="card">
              <div className="cardHead">
                <div>
                  <div className="cardTitle">การแสดงชื่อ</div>
                  <div className="mutedSmall">เลือกว่าคนอื่นจะเห็นชื่อคุณแบบไหน</div>
                </div>
              </div>

              <div className="idOptions">
                <label className={`idOpt ${identityMode === "real" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="identity"
                    checked={identityMode === "real"}
                    onChange={() => setIdentityMode("real")}
                    disabled={submitting}
                  />
                  <div className="idText">
                    <div className="idMain">แสดงชื่อจริง</div>
                    <div className="idHint">จะขึ้นชื่อ: {MY_USERNAME}</div>
                  </div>
                </label>

                <label className={`idOpt ${identityMode === "alias" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="identity"
                    checked={identityMode === "alias"}
                    onChange={() => setIdentityMode("alias")}
                    disabled={submitting}
                  />
                  <div className="idText">
                    <div className="idMain">ใช้นามแฝง</div>
                    <div className="idHint">ใส่ชื่อเล่น/นามแฝง (ไม่เกิน 20 ตัว)</div>
                  </div>
                </label>

                <label className={`idOpt ${identityMode === "anon" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="identity"
                    checked={identityMode === "anon"}
                    onChange={() => setIdentityMode("anon")}
                    disabled={submitting}
                  />
                  <div className="idText">
                    <div className="idMain">ไม่ระบุตัวตน</div>
                    <div className="idHint">จะแสดงเป็น “ไม่ระบุตัวตน”</div>
                  </div>
                </label>
              </div>

              {identityMode === "alias" && (
                <div className="aliasBox">
                  <input
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value.slice(0, 20))}
                    placeholder="เช่น เพื่อนใจดี, น้องปี1, นักศึกษาSUT"
                    disabled={submitting}
                  />
                  <div className="aliasCount">{aliasName.length}/20</div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="card">
              <div className="actions">
                <button type="button" className="btnGray" onClick={handleReset} disabled={submitting}>
                  ล้างฟอร์ม
                </button>

                <button
                  type="button"
                  className={`btnPrimary ${!canSubmit || submitting ? "disabled" : ""}`}
                  onClick={handleClickPost}
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? "กำลังโพสต์..." : "โพสต์รีวิว 🚀"}
                </button>
              </div>

              {!canSubmit && (
                <div className="note">
                  กรุณากรอก <b>หมวดหมู่ / คะแนน / ชื่อที่แสดง / หัวข้อ / เนื้อหา</b> ให้ครบ
                  {identityMode === "alias" && !aliasName.trim() ? " (ยังไม่กรอกนามแฝง)" : ""}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>

      {/* Confirm modal */}
      <ConfirmPostModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={async () => {
          setOpenConfirm(false);
          await handleSubmit();
        }}
        displayName={displayName}
        category={formData.category}
        rating={formData.rating}
        title={formData.title}
        content={formData.content}
      />
    </div>
  );
};

export default CreateReviewPage;
