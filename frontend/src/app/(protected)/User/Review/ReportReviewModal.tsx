import React from "react";
import "./ReportReviewModal.css";

type ReportReviewModalProps = {
  open: boolean;
  onClose: () => void;
  reasons: string[];
  selectedReason: string;
  setSelectedReason: (v: string) => void;
  otherReason: string;
  setOtherReason: (v: string) => void;
  onSubmit: () => void;
};

const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  open,
  onClose,
  reasons,
  selectedReason,
  setSelectedReason,
  otherReason,
  setOtherReason,
  onSubmit,
}) => {
  if (!open) return null;

  const isOtherReasonSelected = selectedReason === "เหตุผลอื่นๆ (ระบุเพิ่มเติม)";
  const isSubmitDisabled = !selectedReason || (isOtherReasonSelected && !otherReason.trim());

  return (
    <div
      className="rrm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rrm-modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rrm-head">
          <div className="rrm-icon" aria-hidden="true">
            !
          </div>

          <div className="rrm-headText">
            <h2 className="rrm-title">แจ้งรายงานปัญหารีวิว</h2>
            <p className="rrm-sub">
              เลือกเหตุผลที่เหมาะสมที่สุด (เพื่อช่วยให้ทีมงานตรวจสอบได้เร็วขึ้น)
            </p>
          </div>

          <button className="rrm-close" onClick={onClose} aria-label="close" type="button">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="rrm-body">
          <div className="rrm-reasons">
            {reasons.map((reason) => {
              const active = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  className={`rrm-reason ${active ? "is-active" : ""}`}
                  onClick={() => {
                    setSelectedReason(reason);
                    if (reason !== "เหตุผลอื่นๆ (ระบุเพิ่มเติม)") setOtherReason("");
                  }}
                >
                  <span className={`rrm-radio ${active ? "is-active" : ""}`} aria-hidden="true">
                    <span className="rrm-radioDot" />
                  </span>

                  <span className="rrm-reasonText">{reason}</span>
                </button>
              );
            })}
          </div>

          {isOtherReasonSelected && (
            <div className="rrm-other">
              <label className="rrm-label">ระบุเหตุผลเพิ่มเติม</label>

              <div className="rrm-textWrap">
                <textarea
                  autoFocus
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  rows={5}
                  placeholder="พิมพ์รายละเอียดให้ชัดเจน เช่น ส่วนที่ไม่เหมาะสมอยู่ตรงไหน…"
                  className="rrm-textarea"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <p className="rrm-hint">
                  แนะนำ: ระบุประโยค/ส่วนที่เป็นปัญหา จะช่วยให้ตรวจสอบได้เร็วขึ้น
                </p>
              </div>
            </div>
          )}

          <div className="rrm-warn">
            <span className="rrm-warnIcon" aria-hidden="true">
              ⚠️
            </span>
            <p className="rrm-warnText">
              หมายเหตุ: การรายงานเท็จอาจนำไปสู่การระงับบัญชีผู้ใช้
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="rrm-foot">
          <button
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            type="button"
            className={`rrm-submit ${isSubmitDisabled ? "is-disabled" : ""}`}
          >
            ส่งรายงาน
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewModal;
