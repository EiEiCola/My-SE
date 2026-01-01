import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AnnouncementCreate.css";

const AnnouncementCreate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Sanitize inputs
    const sanitizedTitle = title.trim();
    const sanitizedContent = content.trim();

    if (!sanitizedTitle) {
      setError("กรุณากรอกหัวข้อประกาศ");
      return;
    }
    if (!sanitizedContent) {
      setError("กรุณากรอกเนื้อหาประกาศ");
      return;
    }

    setSubmitting(true);
    try {
      // Validate end date is not before start date
      if (endDate && endDate < date) {
        throw new Error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น");
      }

      // Convert dates to ISO string for backend
      const reqStart = date ? new Date(date).toISOString() : null;
      const reqEnd = endDate ? new Date(endDate).toISOString() : null;

      const payload = {
        title: sanitizedTitle,
        content: sanitizedContent,
        req_start_at: reqStart,
        req_end_at: reqEnd,
        medias: image ? [{ url: image, type: 'image', is_cover: true }] : []
      };

      // Get JWT token from localStorage
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Send to Member PR Submission endpoint
      const res = await fetch(`/api/members/pr-submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create submission");
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
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ใส่หัวข้อประกาศ"
          />

          <label className="form-label">หมวดหมู่</label>
          <select
            id="category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option value="general">ทั่วไป</option>
            <option value="activity">กิจกรรม</option>
            <option value="scholarship">ทุนการศึกษา</option>
            <option value="urgent">ด่วน</option>
          </select>

          <label className="form-label">คำอธิบายสั้นๆ</label>
          <input
            id="description"
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="คำอธิบายสั้น ๆ"
          />

          <label className="form-label">รูปภาพปก</label>
          <div className="file-upload-wrapper">
            <input
              id="image"
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Validate file size (5MB max)
                  const maxSize = 5 * 1024 * 1024; // 5MB
                  if (file.size > maxSize) {
                    setError("ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ที่เล็กกว่า");
                    e.target.value = ""; // Reset input
                    return;
                  }

                  // Validate file type
                  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                  if (!allowedTypes.includes(file.type)) {
                    setError("รองรับเฉพาะไฟล์ .jpg, .png, .gif, .webp เท่านั้น");
                    e.target.value = ""; // Reset input
                    return;
                  }

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImage(reader.result as string);
                    setError(null); // Clear error on successful load
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {image && <img src={image} alt="Preview" className="image-preview" />}
          </div>

          <label className="form-label">วันที่ต้องการให้แสดง</label>
          <input
            id="start-date"
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="form-label">วันที่สิ้นสุด</label>
          <input
            id="end-date"
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <label className="form-label">เนื้อหาประกาศ</label>
          <textarea
            id="content"
            className="form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="รายละเอียดประกาศ"
            rows={8}
          />

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
              id="submit-btn"
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
