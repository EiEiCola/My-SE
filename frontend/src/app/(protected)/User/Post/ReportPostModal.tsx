import React from "react";
import "./ReportPostModal.css";

type ReportPostModalProps = {
    open: boolean;
    onClose: () => void;
    reasons: string[];
    selectedReason: string;
    setSelectedReason: (v: string) => void;
    otherReason: string;
    setOtherReason: (v: string) => void;
    onSubmit: () => void;
};

const ReportPostModal: React.FC<ReportPostModalProps> = ({
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
            className="rpm-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="rpm-modal" onMouseDown={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="rpm-head">
                    <div className="rpm-icon" aria-hidden="true">
                        !
                    </div>

                    <div className="rpm-headText">
                        <h2 className="rpm-title">แจ้งรายงานปัญหารีวิว</h2>
                        <p className="rpm-sub">
                            เลือกเหตุผลที่เหมาะสมที่สุด (เพื่อช่วยให้ทีมงานตรวจสอบได้เร็วขึ้น)
                        </p>
                    </div>

                    <button className="rpm-close" onClick={onClose} aria-label="close" type="button">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="rpm-body">
                    <div className="rpm-reasons">
                        {reasons.map((reason) => {
                            const active = selectedReason === reason;
                            return (
                                <button
                                    key={reason}
                                    type="button"
                                    className={`rpm-reason ${active ? "is-active" : ""}`}
                                    onClick={() => {
                                        setSelectedReason(reason);
                                        if (reason !== "เหตุผลอื่นๆ (ระบุเพิ่มเติม)") setOtherReason("");
                                    }}
                                >
                                    <span className={`rpm-radio ${active ? "is-active" : ""}`} aria-hidden="true">
                                        <span className="rpm-radioDot" />
                                    </span>

                                    <span className="rpm-reasonText">{reason}</span>
                                </button>
                            );
                        })}
                    </div>

                    {isOtherReasonSelected && (
                        <div className="rpm-other">
                            <label className="rpm-label">ระบุเหตุผลเพิ่มเติม</label>

                            <div className="rpm-textWrap">
                                <textarea
                                    autoFocus
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                    rows={5}
                                    placeholder="พิมพ์รายละเอียดให้ชัดเจน เช่น ส่วนที่ไม่เหมาะสมอยู่ตรงไหน…"
                                    className="rpm-textarea"
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
                                <p className="rpm-hint">
                                    แนะนำ: ระบุประโยค/ส่วนที่เป็นปัญหา จะช่วยให้ตรวจสอบได้เร็วขึ้น
                                </p>
                            </div>
                        </div>
                    )}


                </div>

                {/* Footer */}
                <div className="rpm-foot">
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitDisabled}
                        type="button"
                        className={`rpm-submit ${isSubmitDisabled ? "is-disabled" : ""}`}
                    >
                        ส่งรายงาน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportPostModal;
