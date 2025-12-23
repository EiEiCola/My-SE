import React, { useState, useEffect } from "react";
import { ReportService } from "../../../../services/http/report";
import type { CreateReportInput, Report as ReportType } from "../../../../services/http/report";
import "./Report.css";

const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"create" | "list" | "detail">("create");

  // Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState("system");
  const [targetId, setTargetId] = useState<string>("");
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // List State
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [filterStatus, setFilterStatus] = useState<number | "all">("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Detail State
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  // Load reports when tab changes or pagination changes
  useEffect(() => {
    if (activeTab === "list") {
      fetchReports();
    }
  }, [activeTab, page, pageSize, filterStatus, filterType]);

  const fetchReports = async () => {
    setLoading(true);
    setListError(null);
    try {
      const params: any = { page, page_size: pageSize };
      if (filterStatus !== "all") {
        params.status_id = filterStatus;
      }
      if (filterType !== "all") {
        params.target_type = filterType;
      }
      const res = await ReportService.getMyReports(params);
      if (res.data) {
        setReports(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalReports(res.data.total || 0);
      }
    } catch (err: any) {
      setListError(err.response?.data?.error || "ไม่สามารถโหลดรายงานได้");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (r: ReportType) => {
    setEditId(r.id);
    setTitle(r.title);
    setDescription(r.description);
    setTargetType(r.target_type);
    setTargetId(r.target_id?.toString() || "");
    if (r.media && r.media.length > 0) {
      setImage(r.media[0].url);
    } else {
      setImage("");
    }
    setActiveTab("create");
    setFormError(null);
    setFormSuccess(null);
  };

  const handleViewDetail = (r: ReportType) => {
    setSelectedReport(r);
    setActiveTab("detail");
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("คุณต้องการลบรายงานนี้ใช่หรือไม่?")) return;
    try {
      await ReportService.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
      setFormSuccess("ลบรายงานเรียบร้อยแล้ว");
    } catch (err: any) {
      setFormError("ไม่สามารถลบรายงานได้ (อาจได้รับการดำเนินการแล้ว)");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setTargetType("system");
    setTargetId("");
    setImage("");
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim() || !description.trim()) {
      setFormError("กรุณากรอกหัวข้อและรายละเอียดให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateReportInput = {
        target_type: targetType,
        target_id: targetId ? parseInt(targetId) : undefined,
        title,
        description,
        medias: image ? [{ url: image, type: 'image', is_attachment: false }] : []
      };

      if (editId) {
        await ReportService.updateReport(editId, payload);
        setFormSuccess("แก้ไขรายงานเรียบร้อยแล้ว");
        setTimeout(() => {
          setActiveTab("list");
          resetForm();
          setPage(1);
        }, 1200);
      } else {
        await ReportService.createReport(payload);
        setFormSuccess("ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่แจ้งปัญหา!");
        setTimeout(() => resetForm(), 1200);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (statusId: number) => {
    const statuses: { [key: number]: { label: string; class: string } } = {
      1: { label: "รอตรวจสอบ", class: "pending" },
      2: { label: "กำลังดำเนินการ", class: "progress" },
      3: { label: "เสร็จสิ้น", class: "done" },
      4: { label: "ปฏิเสธ", class: "reject" },
    };
    const status = statuses[statusId] || { label: "ไม่ทราบ", class: "unknown" };
    return <span className={`status-badge ${status.class}`}>{status.label}</span>;
  };

  const totalPages = Math.ceil(totalReports / pageSize);

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="report-container">
        <div className="report-header">
          <h2 className="report-title">
            {activeTab === "create" && !editId && "แจ้งปัญหา / ร้องเรียน"}
            {editId && "แก้ไขรายงาน"}
            {activeTab === "list" && "ประวัติการแจ้งปัญหา"}
            {activeTab === "detail" && selectedReport?.title}
          </h2>
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'create' && !editId ? 'active' : ''}`}
              onClick={() => { setActiveTab('create'); resetForm(); }}
            >
              📝 แจ้งปัญหาใหม่
            </button>
            <button
              className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => { setActiveTab('list'); resetForm(); setPage(1); }}
            >
              📋 ประวัติการแจ้ง
            </button>
          </div>
        </div>

        {/* CREATE / EDIT TAB */}
        {(activeTab === 'create') && (
          <>
            <p className="report-subtitle">พบปัญหาการใช้งาน หรือต้องการแจ้งเบาะแสการกระทำผิด แจ้งเราได้ที่นี่</p>

            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
            {formError && <div className="alert alert-error">{formError}</div>}

            <form className="report-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">หัวข้อปัญหา *</label>
                <input
                  className="form-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น เว็บเข้าไม่ได้, พบเนื้อหาไม่เหมาะสม"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ประเภทปัญหา *</label>
                  <select
                    className="form-select"
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    required
                  >
                    <option value="system">ปัญหาการใช้งานระบบ (Bug)</option>
                    <option value="content">เนื้อหาไม่เหมาะสม</option>
                    <option value="user">รายงานผู้ใช้งาน</option>
                    <option value="post">แจ้งเรื่องโพสต์</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ID เป้าหมาย (ถ้ามี)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="เช่น 123 (ID ของโพสต์หรือผู้ใช้)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">รายละเอียด *</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="อธิบายปัญหาที่พบให้ชัดเจน (อย่างน้อย 10 ตัวอักษร)..."
                  rows={6}
                  required
                />
              </div>

              <div className="form-group">
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
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm();
                    setActiveTab("list");
                  }}
                  disabled={submitting}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "⏳ กำลังบันทึก..." : (editId ? "💾 บันทึกการแก้ไข" : "📤 ส่งรายงาน")}
                </button>
              </div>
            </form>
          </>
        )}

        {/* LIST TAB */}
        {activeTab === 'list' && (
          <div className="report-list-section">
            <div className="filters-section">
              <h3 className="filter-title">ตัวกรอง</h3>
              <div className="filter-row">
                <div className="filter-group">
                  <label>สถานะ:</label>
                  <select
                    value={filterStatus === "all" ? "all" : filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                    className="filter-select"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="1">รอตรวจสอบ</option>
                    <option value="2">กำลังดำเนินการ</option>
                    <option value="3">เสร็จสิ้น</option>
                    <option value="4">ปฏิเสธ</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>ประเภท:</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="system">ปัญหาระบบ</option>
                    <option value="content">เนื้อหา</option>
                    <option value="user">ผู้ใช้งาน</option>
                    <option value="post">โพสต์</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>
            </div>

            {listError && <div className="alert alert-error">{listError}</div>}

            {loading ? (
              <div className="loading-state">⏳ กำลังโหลดข้อมูล...</div>
            ) : reports.length === 0 ? (
              <div className="empty-state">
                <p>😢 คุณยังไม่มีประวัติการแจ้งปัญหา</p>
                <button className="btn btn-primary" onClick={() => setActiveTab("create")}>
                  สร้างรายงานใหม่
                </button>
              </div>
            ) : (
              <div className="history-list">
                {reports.map((report) => (
                  <div key={report.id} className="history-item">
                    <div className="history-header">
                      <div className="history-title-section">
                        <h4 className="history-title">{report.title}</h4>
                        <span className="history-type">[{report.target_type}]</span>
                      </div>
                      {getStatusLabel(report.status_id)}
                    </div>
                    <p className="history-meta">
                      ID: #{report.id} | สร้างเมื่อ: {new Date(report.created_at).toLocaleString('th-TH')}
                    </p>
                    <p className="history-desc">{report.description.substring(0, 150)}...</p>
                    {report.media && report.media.length > 0 && (
                      <div className="history-media">
                        📎 มีไฟล์แนบ ({report.media.length} ไฟล์)
                      </div>
                    )}
                    <div className="history-actions">
                      <button
                        className="btn-action view"
                        onClick={() => handleViewDetail(report)}
                        title="ดูรายละเอียด"
                      >
                        👁️ ดู
                      </button>
                      {report.status_id === 1 && (
                        <>
                          <button
                            className="btn-action edit"
                            onClick={() => handleEditClick(report)}
                            title="แก้ไข"
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDeleteClick(report.id)}
                            title="ลบ"
                          >
                            🗑️ ลบ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  ← ก่อนหน้า
                </button>
                <span className="pagination-info">
                  หน้า {page} จาก {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary"
                >
                  ถัดไป →
                </button>
              </div>
            )}
          </div>
        )}

        {/* DETAIL TAB */}
        {activeTab === 'detail' && selectedReport && (
          <div className="detail-view">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveTab("list")}
            >
              ← กลับไปรายการ
            </button>

            <div className="detail-card">
              <div className="detail-header">
                <h3 className="detail-title">{selectedReport.title}</h3>
                {getStatusLabel(selectedReport.status_id)}
              </div>

              <div className="detail-meta">
                <p><strong>ID:</strong> #{selectedReport.id}</p>
                <p><strong>ประเภท:</strong> {selectedReport.target_type}</p>
                {selectedReport.target_id && <p><strong>เป้าหมาย ID:</strong> {selectedReport.target_id}</p>}
                <p><strong>สถานะ:</strong> {getStatusLabel(selectedReport.status_id)}</p>
                <p><strong>สร้างเมื่อ:</strong> {new Date(selectedReport.created_at).toLocaleString('th-TH')}</p>
                {selectedReport.updated_at !== selectedReport.created_at && (
                  <p><strong>แก้ไขล่าสุด:</strong> {new Date(selectedReport.updated_at).toLocaleString('th-TH')}</p>
                )}
              </div>

              <div className="detail-description">
                <h4>รายละเอียด</h4>
                <p>{selectedReport.description}</p>
              </div>

              {selectedReport.media && selectedReport.media.length > 0 && (
                <div className="detail-media">
                  <h4>ไฟล์แนบ</h4>
                  {selectedReport.media.map((m, i) => (
                    <div key={i} className="media-item">
                      {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer">📎 {m.type}</a>}
                    </div>
                  ))}
                </div>
              )}

              {selectedReport.status && (
                <div className="detail-admin">
                  <h4>ข้อมูลการตรวจสอบ</h4>
                  <p><strong>สถานะ:</strong> {selectedReport.status.status_name}</p>
                  {selectedReport.admin_id && <p><strong>ผู้ดำเนินการ:</strong> Admin #{selectedReport.admin_id}</p>}
                </div>
              )}

              {selectedReport.status_id === 1 && (
                <div className="detail-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEditClick(selectedReport)}
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (window.confirm("ยืนยันการลบรายงานนี้?")) {
                        handleDeleteClick(selectedReport.id).then(() => setActiveTab("list"));
                      }
                    }}
                  >
                    🗑️ ลบ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ReportPage;
