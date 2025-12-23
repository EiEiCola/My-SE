import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportService } from "../../../../services/http/report";
import type { CreateReportInput, Report as ReportType } from "../../../../services/http/report";
import "./Report.css";

// Simple Tab Interface
const Report: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("system");
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List State
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(false);

  // Load reports when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await ReportService.getMyReports({ page_size: 50 });
      // API returns { data: [], total: ... }
      if (res.data && Array.isArray(res.data.data)) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (r: ReportType) => {
    setEditId(r.id);
    setTitle(r.title);
    setDescription(r.description);
    setCategory(r.target_type);
    if (r.media && r.media.length > 0) {
      setImage(r.media[0].url);
    } else {
      setImage("");
    }
    setActiveTab("create");
    setError(null);
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("คุณต้องการลบรายงานนี้ใช่หรือไม่?")) return;
    try {
      await ReportService.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      alert("ไม่สามารถลบรายงานได้ (อาจได้รับการดำเนินการแล้ว)");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setCategory("system");
    setImage("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("กรุณากรอกหัวข้อและรายละเอียดให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateReportInput = {
        target_type: category,
        title,
        description,
        medias: image ? [{ url: image, type: 'image', is_attachment: false }] : []
      };

      if (editId) {
        await ReportService.updateReport(editId, payload);
        alert("แก้ไขรายงานเรียบร้อยแล้ว");
        setActiveTab("history"); // Go to history to see changes
      } else {
        await ReportService.createReport(payload);
        alert("ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่แจ้งปัญหาครับ!");
        resetForm(); // Clear form on success
        // Optionally stay on create page or go to history
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    if (editId) {
      setActiveTab("history");
    } else {
      navigate("/User");
    }
  };

  // Helper to get status label
  const getStatusLabel = (statusId: number) => {
    switch (statusId) {
      case 1: return <span className="status-badge pending">รอตรวจสอบ</span>;
      case 2: return <span className="status-badge progress">กำลังดำเนินการ</span>;
      case 3: return <span className="status-badge done">เสร็จสิ้น</span>;
      case 4: return <span className="status-badge reject">ปฏิเสธ</span>;
      default: return <span className="status-badge unknown">ไม่ทราบสถานะ</span>;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="report-container">
        <div className="report-header">
          <h2 className="report-title">
            {editId ? "แก้ไขรายงาน" : "แจ้งปัญหา / ร้องเรียน"}
          </h2>
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => { setActiveTab('create'); if (!editId) resetForm(); }}
            >
              {editId ? 'แบบฟอร์มแก้ไข' : 'แจ้งปัญหาใหม่'}
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); resetForm(); }}
            >
              ประวัติการแจ้ง
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <>
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
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "กำลังบันทึก..." : (editId ? "บันทึกการแก้ไข" : "ส่งรายงาน")}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="report-history">
            {loading ? (
              <p className="loading-text">กำลังโหลดข้อมูล...</p>
            ) : reports.length === 0 ? (
              <div className="empty-state">
                <p>คุณยังไม่มีประวัติการแจ้งปัญหา</p>
              </div>
            ) : (
              <div className="history-list">
                {reports.map((report) => (
                  <div key={report.id} className="history-item">
                    <div className="history-header">
                      <span className="history-title">{report.title}</span>
                      {getStatusLabel(report.status_id)}
                    </div>
                    <p className="history-date">
                      เมื่อ: {new Date(report.created_at).toLocaleString('th-TH')}
                    </p>
                    <p className="history-desc">{report.description}</p>
                    {report.status_id === 1 && (
                      <div className="history-actions">
                        <button
                          className="btn-text edit"
                          onClick={() => handleEditClick(report)}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="btn-text delete"
                          onClick={() => handleDeleteClick(report.id)}
                        >
                          ลบ
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Report;