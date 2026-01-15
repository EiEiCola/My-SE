import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./CreateReviewPage.css";

import { createReview, uploadReviewImages } from "../../../../services/http/reviewApi";
import { categoryAPI } from "../../../../services/http/poll";

type CategoryItem = { id: number; title: string };

type ImageItem = {
  file: File | null;
  url: string; // objectURL หรือ URL ที่ได้จาก server
};

const MAX_TITLE = 100;
const MAX_CONTENT = 500;
const MAX_IMAGES = 10; // ✅ เพิ่มเป็น 10

const MY_USERNAME = "chaaim8dec";

const ratingText = (r: number) => {
  if (r <= 0) return "ยังไม่ได้ให้คะแนน";
  if (r === 1) return "แย่มาก";
  if (r === 2) return "พอใช้";
  if (r === 3) return "ปานกลาง";
  if (r === 4) return "ดี";
  return "ดีมาก";
};

const getMyUsername = () => {
  try {
    const rawUser = localStorage.getItem("userData");
    if (!rawUser) return "ผู้ใช้";

    const u = JSON.parse(rawUser);
    const name =
      u.username ??
      u.Username ??
      u.name ??
      u.Name ??
      u.display_name ??
      u.DisplayName;

    return String(name || "ผู้ใช้").trim() || "ผู้ใช้";
  } catch {
    return "ผู้ใช้";
  }
};

/* =========================
   Confirm Modal (ห้ามเปลี่ยนคำ)
========================= */
type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;

  displayName: string;
  category: string;
  rating: number;
  title: string;
  content: string;

  images: string[]; // ✅ เพิ่ม: เอารูปไปโชว์ใน confirm + คลิกดู
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
  images,
}) => {
  // ✅ Gallery modal แบบเดียวกับ ReviewList/ReviewCard
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const openGallery = (idx: number) => {
    if (!images || images.length === 0) return;
    setCurrentIdx(idx);
    setIsGalleryOpen(true);
  };

  const nextImage = () => setCurrentIdx((p) => (p + 1) % images.length);
  const prevImage = () => setCurrentIdx((p) => (p - 1 + images.length) % images.length);

  if (!open) return null;

  const hasImgs = !!images?.length;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === (images?.length ?? 1) - 1;

  return (
    <div className="crOverlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
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


         {hasImgs && (
  <div className="crImgStrip">
    {images.map((u, i) => (
      <button
        key={i}
        type="button"
        className="crImgTile"
        onClick={() => openGallery(i)}
        aria-label={`confirm-open-${i + 1}`}
      >
        <img className="crThumb" src={u} alt={`confirm-${i}`} />
      </button>
    ))}
  </div>
)} 

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

      {/* ✅ Gallery Modal (ใช้ class เดิม rcm-*) */}
      {isGalleryOpen && hasImgs && (
        <div
          className="rcm-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsGalleryOpen(false);
          }}
        >
          <div className="rcm-wrap" onMouseDown={(e) => e.stopPropagation()}>
            <div className="rcm-view">
              <img className="rcm-img" src={images[currentIdx]} alt={`img-${currentIdx}`} />
            </div>

            <button
              type="button"
              className="rcm-close"
              onClick={() => setIsGalleryOpen(false)}
              aria-label="close"
            >
              ✕
            </button>

            <button
              type="button"
              className={`rcm-nav rcm-left ${isFirst ? "is-disabled" : ""}`}
              onClick={prevImage}
              disabled={isFirst}
              aria-label="prev"
            >
              ‹
            </button>

            <button
              type="button"
              className={`rcm-nav rcm-right ${isLast ? "is-disabled" : ""}`}
              onClick={nextImage}
              disabled={isLast}
              aria-label="next"
            >
              ›
            </button>

            <div className="rcm-count">
              {currentIdx + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const myUsername = useMemo(() => getMyUsername(), []);

  // Category (3 levels)
  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
  const [selectedL1Id, setSelectedL1Id] = useState<number | null>(null);
  const [selectedL2Id, setSelectedL2Id] = useState<number | null>(null);

  const [mainCats, setMainCats] = useState<CategoryItem[]>([]);
  const [l1Cats, setL1Cats] = useState<CategoryItem[]>([]);
  const [l2Cats, setL2Cats] = useState<CategoryItem[]>([]);

  useEffect(() => {
    (async () => {
      const rows = await categoryAPI.listMain();
      setMainCats(rows);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setL1Cats([]);
      setL2Cats([]);
      setSelectedL1Id(null);
      setSelectedL2Id(null);

      if (!selectedMainId) return;

      const rows = await categoryAPI.listSub1(selectedMainId);
      setL1Cats(rows);
    })();
  }, [selectedMainId]);

  useEffect(() => {
    (async () => {
      setL2Cats([]);
      setSelectedL2Id(null);

      if (!selectedL1Id) return;

      const rows = await categoryAPI.listSub2(selectedL1Id);
      setL2Cats(rows);
    })();
  }, [selectedL1Id]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    rating: 0,
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAnonymous, setIsAnonymous] = useState(false);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // หมวดหมู่ที่จะโชว์ใน Modal
  const categoryPathName = useMemo(() => {
    const m = mainCats.find((c) => c.id === selectedMainId)?.title || "";
    const s1 = l1Cats.find((c) => c.id === selectedL1Id)?.title || "";
    const s2 = l2Cats.find((c) => c.id === selectedL2Id)?.title || "";
    return [m, s1, s2].filter(Boolean).join(" > ");
  }, [mainCats, l1Cats, l2Cats, selectedMainId, selectedL1Id, selectedL2Id]);

  const displayName = useMemo(() => {
    return isAnonymous ? "ไม่ระบุตัวตน" : myUsername;
  }, [isAnonymous, myUsername]);

  const canSubmit = useMemo(() => {
    return (
      !!selectedMainId &&
      formData.title.trim().length > 0 &&
      formData.content.trim().length > 0 &&
      formData.rating > 0
    );
  }, [selectedMainId, formData]);

  const openFilePicker = () => {
    if (images.length < MAX_IMAGES) fileInputRef.current?.click();
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
    setSelectedMainId(null);
    setSelectedL1Id(null);
    setSelectedL2Id(null);

    setFormData({ title: "", content: "", rating: 0 });
    setHoverRating(0);

    setIsAnonymous(false);
    setSubmitError("");

    setImages((prev) => {
      prev.forEach((it) => URL.revokeObjectURL(it.url));
      return [];
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");

      const created = await createReview({
        title: formData.title.trim(),
        content: formData.content.trim(),
        rating: Number(formData.rating),
        is_anonymous: isAnonymous,
        main_category_id: selectedMainId, // required
        sub_category_l1_id: selectedL1Id ?? null, // optional
        sub_category_l2_id: selectedL2Id ?? null, // optional
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

  const handleClickPost = () => {
    if (canSubmit && !submitting) setOpenConfirm(true);
  };

  console.log("DEBUG myUsername =", myUsername);

  return (
    <div className="createPage">
      <div className="createWrap">
        <div className="createHeader">
          <button
            type="button"
            className="backBtn"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            <span className="backIcon">←</span> กลับ
          </button>

          <div className="headRow">
            <div>
              <h1 className="pageTitle">เขียนรีวิว ✍️</h1>
              <p className="pageSub">แบ่งปันประสบการณ์ของคุณให้เพื่อนๆ ได้รับรู้</p>
            </div>
           
          </div>

          <div className="warningCard">
            <div className="warnIcon">!</div>
            <div>
              <div className="warnTitle">โพสต์แล้วไม่สามารถแก้ไขได้</div>
              <div className="warnText">
                กรุณาตรวจสอบข้อความและคะแนนให้เรียบร้อยก่อนกด <b>“โพสต์รีวิว”</b>
              </div>
            </div>
          </div>

          {submitError && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: "#fee2e2",
                fontWeight: 800,
              }}
            >
              โพสต์ไม่สำเร็จ: {submitError}
            </div>
          )}
        </div>


        <div className="grid2">
          <div className="col">
            {/* Category */}
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">
                  หมวดหมู่ <span className="req">*</span>
                </div>
                <div className="pill">เลือกหมวดหมู่</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {/* MAIN */}
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>หมวดหมู่หลัก</div>
                  <select
                    className="input"
                    value={selectedMainId ?? ""}
                    onChange={(e) => setSelectedMainId(e.target.value ? Number(e.target.value) : null)}
                    disabled={submitting}
                  >
                    <option value="">— เลือก Main —</option>
                    {mainCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUB1 */}
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>หมวดย่อยหมู่1</div>
                  <select
                    className="input"
                    value={selectedL1Id ?? ""}
                    onChange={(e) => setSelectedL1Id(e.target.value ? Number(e.target.value) : null)}
                    disabled={submitting || !selectedMainId}
                  >
                    <option value="">{selectedMainId ? "— เลือก Sub1 —" : "เลือก Main ก่อน"}</option>
                    {l1Cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUB2 */}
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>หมวดหมู่ย่อย2</div>
                  <select
                    className="input"
                    value={selectedL2Id ?? ""}
                    onChange={(e) => setSelectedL2Id(e.target.value ? Number(e.target.value) : null)}
                    disabled={submitting || !selectedL1Id}
                  >
                    <option value="">{selectedL1Id ? "— เลือก Sub2 —" : "เลือก Sub1 ก่อน"}</option>
                    {l2Cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 10, color: "#64748b", fontWeight: 700, fontSize: 12 }}>
                Selected IDs: main={selectedMainId ?? "-"} sub1={selectedL1Id ?? "-"} sub2={selectedL2Id ?? "-"}
              </div>
            </div>
            
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
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value.slice(0, MAX_TITLE) }))
                }
                placeholder="เช่น อาหารอร่อย บรรยากาศดี"
                disabled={submitting}
              />
              <div className="helper">หัวข้อสั้น กระชับ อ่านแล้วเข้าใจทันที</div>
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
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`starBtn ${star <= (hoverRating || formData.rating) ? "on" : ""}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormData((p) => ({ ...p, rating: star }))}
                      disabled={submitting}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="ratingHint">แตะดาวเพื่อให้คะแนน (1-5 ดาว)</div>
              </div>
            </div>

            {/* Images (ดีไซน์ใหม่: แถบรูป + ปุ่มเพิ่ม) */}
<div className="card">
  <div className="cardHead">
    <div className="cardTitle">รูปภาพ (ไม่บังคับ)</div>
    <div className="pill">{images.length}/{MAX_IMAGES}</div>
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

  {/* ✅ ถ้ายังไม่มีรูป */}
  {images.length === 0 ? (
    <button
      type="button"
      className="imgAddBig"
      onClick={openFilePicker}
      disabled={submitting}
    >
      <div className="imgAddBigIcon">📷</div>
      <div className="imgAddBigText">+ เพิ่มรูปภาพ</div>
      <div className="imgAddBigSub">เลือกได้สูงสุด {MAX_IMAGES} รูป</div>
    </button>
  ) : (
    <>
      {/* ✅ มีรูปแล้ว: โชว์เป็นแถบเลื่อน */}
     <div className="imgStrip">
  {images.map((it, idx) => (
    <div key={idx} className="imgTile">
      <img src={it.url} alt={`img-${idx}`} />
      <button type="button" className="imgDel" onClick={() => removeImage(idx)} disabled={submitting}>
        ✕
      </button>
    </div>
  ))}

  {/* ✅ ปุ่มเพิ่มรูปเป็น 1 tile อยู่ท้าย grid (ไม่ดันคอลัมน์) */}
  {images.length < MAX_IMAGES && (
    <button type="button" className="imgTile imgAdd" onClick={openFilePicker} disabled={submitting}>
      <div className="imgAddIcon">＋</div>
      <div className="imgAddText">เพิ่มรูป</div>
    </button>
  )}
</div>


      {/* ✅ แถวปุ่มล่าง: เพิ่ม / ล้างรูปทั้งหมด */}
      <div className="imgActionsRow">
        <button
          type="button"
          className={`btnOutline ${images.length >= MAX_IMAGES ? "disabled" : ""}`}
          onClick={openFilePicker}
          disabled={images.length >= MAX_IMAGES || submitting}
        >
          + เพิ่มรูปภาพ
        </button>

        <button
          type="button"
          className="btnGray"
          onClick={() => {
            // ล้างรูปทั้งหมดแบบปลอดภัย
            setImages((prev) => {
              prev.forEach((it) => it.url && URL.revokeObjectURL(it.url));
              return [];
            });
          }}
          disabled={submitting}
        >
          ล้างรูป
        </button>
      </div>
    </>
  )}
</div>

          </div>

          <div className="col">
       
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
                onChange={(e) =>
                  setFormData((p) => ({ ...p, content: e.target.value.slice(0, MAX_CONTENT) }))
                }
                placeholder="เขียนรีวิวของคุณ..."
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

            {/* Anonymous Toggle */}
            <div className="card">
              <div className="cardHead">
                <div>
                  <div className="cardTitle">โพสต์แบบไม่เปิดเผยชื่อ</div>
                  <div className="mutedSmall">ถ้าเปิด ระบบจะแสดงเป็น “ไม่ระบุตัวตน”</div>
                </div>
              </div>

              <div className="anonRow">
                <div className="anonLeft">
                  <div className="anonName">{isAnonymous ? "ไม่ระบุตัวตน" : myUsername}</div>
                  <div className="anonHint">
                    {isAnonymous ? "คนอื่นจะไม่เห็นชื่อจริง" : "คนอื่นจะเห็นชื่อของคุณ"}
                  </div>
                </div>

                <label className={`anonSwitch ${isAnonymous ? "isOn" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    disabled={submitting}
                  />
                  <span className="anonSlider" />
                  <span className="anonText">{isAnonymous ? "เปิด" : "ปิด"}</span>
                </label>
              </div>
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
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>

      <ConfirmPostModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={async () => {
          setOpenConfirm(false);
          await handleSubmit();
        }}
        displayName={displayName}
        category={categoryPathName}
        rating={formData.rating}
        title={formData.title}
        content={formData.content}
        images={images.map((it) => it.url).filter(Boolean)} // ✅ ส่งรูปเข้า Confirm
      />
    </div>
  );
};

export default CreateReviewPage;
