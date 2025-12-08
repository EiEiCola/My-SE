import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AnnouncementCreate.css";

const AnnouncementCreate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [date, setDate] = useState<string>(() => {
    // default to today in yyyy-mm-dd for input[type=date]
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // default end date to today
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  // Users should not set status; backend will decide. Default to active when sending.
  // Keep no UI control for status.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("กรุณากรอกหัวข้อประกาศ");
      return;
    }

    setSubmitting(true);
    try {
      // Replace endpoint with your backend API
      // Validate end date is not before start date
      if (endDate && endDate < date) {
        throw new Error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น");
      }

      const payload = { title, description, content, image, date, endDate, status: "active" };

      // Example POST - adjust URL as needed (env or proxy)
      const res = await fetch(`/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create announcement");
      }

      // On success, go back to announcement list
      navigate("/User/Announcement");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="announcement-create-container">
        <h2 className="create-title">สร้างประกาศใหม่</h2>

        <form className="create-form" onSubmit={handleSubmit}>
          <label className="form-label">หัวข้อประกาศ</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ใส่หัวข้อประกาศ"
          />

          <label className="form-label">คำอธิบายสั้นๆ</label>
          <input
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="คำอธิบายสั้น ๆ"
          />

          <label className="form-label">รูปภาพ (URL)</label>
          <input
            className="form-input"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />

          <label className="form-label">วันที่ที่ต้องการให้แสดง</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="form-label">วันที่สิ้นสุด</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <label className="form-label">เนื้อหาประกาศ</label>
          <textarea
            className="form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="รายละเอียดประกาศ"
            rows={8}
          />

          {/* Status is not editable by users */}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/User/Announcement")}
              disabled={submitting}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "กำลังส่ง..." : "สร้างประกาศ"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AnnouncementCreate;
