import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Report.css";

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("system"); // Default to system
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("กรุณากรอกหัวข้อและรายละเอียดให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      // Construct payload matching createReportRequest in backend
      const payload = {
        target_type: category, // Mapping category to target_type
        title,
        description,
        medias: image ? [{ url: image, type: 'image', is_attachment: false }] : []
      };

      const res = await fetch(`/api/members/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to submit report");
      }

      alert("ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่แจ้งปัญหาครับ!");
      navigate("/User"); // Redirect to home or stay?
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="report-container">
        <h2 className="report-title">แจ้งปัญหา / ร้องเรียน</h2>
        <p className="report-subtitle">พบปัญหาการใช้งาน หรือต้องการแจ้งเบาะแสการกระทำผิด แจ้งเราได้ที่นี่</p>

        <form className="report-form" onSubmit={handleSubmit}>
          <label className="form-label">หัวข้อปัญหา</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น เว็บเข้าไม่ได้, พบเนื้อหาไม่เหมาะสม"
            required
          />

          <label className="form-label">ประเภทปัญหา</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="system">ปัญหาการใช้งานระบบ (Bug)</option>
            <option value="content">เนื้อหาไม่เหมาะสม</option>
            <option value="user">รายงานผู้ใช้งาน</option>
            <option value="other">อื่นๆ</option>
          </select>

          <label className="form-label">รายละเอียด</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายปัญหาที่พบให้ชัดเจน..."
            rows={5}
            required
          />

          <label className="form-label">รูปภาพประกอบ (ถ้ามี)</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {image && (
              <div className="preview-container">
                <img src={image} alt="Preview" className="image-preview" />
                <button type="button" className="remove-img-btn" onClick={() => setImage("")}>✕</button>
              </div>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/User")}
              disabled={submitting}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "กำลังส่ง..." : "ส่งรายงาน"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Report;