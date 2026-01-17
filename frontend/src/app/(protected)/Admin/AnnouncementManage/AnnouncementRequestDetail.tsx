import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Modal, message } from "antd";
import "./AnnouncementManage.css";

const AnnouncementRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null); // Use proper interface based on backend entity
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>("pending");
  const [processing, setProcessing] = useState(false);

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url;
    return `${API_BASE}/uploads/${url}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/admin/pr-submissions/${id}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch submission");
        const json = await res.json();
        setData(json);
        setTitle(json.title);
        setContent(json.content);
        // Assuming backend sends RFC3339, slice to YYYY-MM-DD for input type=date
        if (json.req_start_at) setDate(new Date(json.req_start_at).toISOString().split('T')[0]);
        if (json.req_end_at) setEndDate(new Date(json.req_end_at).toISOString().split('T')[0]);

        // Map status ID to string for UI
        if (json.status_id === 1) setStatus('pending'); // Fixed: 1 is Pending
        else if (json.status_id === 2) setStatus('approved'); // 2 is Approved
        else if (json.status_id === 3) setStatus('rejected'); // 3 is Rejected
        else setStatus('pending');

      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleApprove = async () => {
    Modal.confirm({
      title: "ยืนยันการอนุมัติ",
      content: "คุณต้องการอนุมัติคำขอนี้ใช่หรือไม่?",
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      onOk: async () => {
        setProcessing(true);
        try {
          const token = localStorage.getItem("token");
          const headers: HeadersInit = { "Content-Type": "application/json" };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const res = await fetch(`/api/admin/pr-submissions/${id}/review`, {
            method: "POST",
            headers,
            body: JSON.stringify({ status_id: 2, create_announcement: true, comment: "Approved via Admin UI" }),
          });
          if (!res.ok) throw new Error("Failed to approve");
          setStatus('approved');
          message.success("อนุมัติเรียบร้อย");
        } catch (err) {
          message.error("เกิดข้อผิดพลาดในการอนุมัติ");
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const handleRejectClick = () => {
    setShowRejectInput(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      message.warning("กรุณาระบุเหตุผลการปฏิเสธ");
      return;
    }
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/admin/pr-submissions/${id}/review`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status_id: 3, create_announcement: false, comment: rejectReason }), // Status 3 = Rejected
      });
      if (!res.ok) throw new Error("Failed to reject");
      setStatus('rejected');
      setShowRejectInput(false);
      message.success("ปฏิเสธคำขอเรียบร้อย");
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการปฏิเสธ");
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      message.warning("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setProcessing(true);
    try {
      const payload = {
        title,
        content,
        req_start_at: date ? new Date(date).toISOString() : null,
        req_end_at: endDate ? new Date(endDate).toISOString() : null,
      };

      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/admin/pr-submissions/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update");
      const json = await res.json();
      message.success("บันทึกการแก้ไขเรียบร้อย");
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error || !data) return <div>Error: {error}</div>;

  return (
    <main className="flex-1 bg-transparent p-6">
      <div className="detail-minimal">
        <div className="detail-header">
          <button className="back-link" onClick={() => navigate('/Admin/AnnouncementManage')}>← ย้อนกลับ</button>
          <h3 className="detail-h3">จัดการคำขอประกาศ #{id}</h3>
        </div>

        <div className="detail-card">
          <div className="detail-meta-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
            {data.member?.member_picture ? (
              <img src={resolveMediaUrl(data.member.member_picture)} alt="Member" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {data.member?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{data.member?.username || `Member #${data.member_id}`}</div>
              {data.member?.email && <div style={{ color: '#666', fontSize: '0.9em' }}>{data.member.email}</div>}
              <div style={{ color: '#888', fontSize: '0.85em' }}>ID: {data.member_id} • ส่งเมื่อ: {new Date(data.req_start_at).toLocaleDateString('th-TH')}</div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>หัวข้อประกาศ</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
          </div>

          {/* Media Section - Large Cover Style */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>รูปภาพปก</label>
            <div className="media-preview-container">
              {data.media && data.media.length > 0 ? (
                data.media.map((m: any, idx: number) => (
                  <div key={idx} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={resolveMediaUrl(m.url)} alt={`Media ${idx}`} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
                  </div>
                ))
              ) : (
                <div style={{ padding: 40, background: '#f5f5f5', borderRadius: 8, textAlign: 'center', color: '#999', border: '2px dashed #ddd' }}>
                  ไม่มีรูปภาพประกอบ
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">วันที่ที่ต้องการให้แสดง</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">วันที่สิ้นสุด</label>
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <label className="form-label" style={{ marginTop: 20 }}>เนื้อหาประกาศ</label>
          <textarea className="form-textarea" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />

          {/* Rejection Modal */}
          <Modal
            title="ระบุเหตุผลที่ปฏิเสธ"
            open={showRejectInput}
            onOk={confirmReject}
            onCancel={() => setShowRejectInput(false)}
            okText="ยืนยันการปฏิเสธ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true, loading: processing }}
          >
            <textarea
              className="form-textarea"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เช่น เนื้อหาไม่เหมาะสม, ข้อมูลไม่ครบถ้วน..."
              style={{ width: '100%', marginTop: 10 }}
            />
          </Modal>

          {/* Action Buttons */}
          <div className="detail-actions" style={{ marginTop: 30, borderTop: '1px solid #eee', paddingTop: 20 }}>
            <button className="btn btn-primary small" onClick={handleSave} disabled={processing} style={{ backgroundColor: '#faad14', borderColor: '#faad14', marginRight: 8 }}>บันทึกการแก้ไข</button>

            <button className="btn btn-primary small" onClick={handleApprove} disabled={processing || status === 'approved' || status === 'rejected'}>
              {status === 'approved' ? 'อนุมัติแล้ว' : 'อนุมัติคำขอ'}
            </button>

            <button className="btn small" onClick={handleRejectClick} disabled={processing || status === 'rejected' || status === 'approved'} style={{ background: status === 'rejected' ? '#ccc' : '#ff4d4f', color: 'white', border: 'none' }}>
              {status === 'rejected' ? 'ปฏิเสธแล้ว' : 'ปฏิเสธคำขอ'}
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status-badge status-${status}`} style={{
                padding: '4px 12px', borderRadius: 12, fontSize: '0.9em',
                background: status === 'approved' ? '#f6ffed' : status === 'rejected' ? '#fff1f0' : '#e6f7ff',
                color: status === 'approved' ? '#52c41a' : status === 'rejected' ? '#cf1322' : '#1890ff',
                border: `1px solid ${status === 'approved' ? '#b7eb8f' : status === 'rejected' ? '#ffa39e' : '#91d5ff'}`
              }}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AnnouncementRequestDetail;
