import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AnnouncementManage.css";

const mockDetail: {
  id: number;
  user: string;
  title: string;
  submittedAt: string;
  date: string;
  endDate: string;
  description: string;
  content: string;
} = {
  id: 1,
  user: "user01",
  title: "ขอเชิญร่วมงานปฐมนิเทศ",
  submittedAt: "2025-12-01",
  date: "2025-12-05",
  endDate: "2025-12-10",
  description: "คำอธิบายสั้น ๆ ของประกาศ",
  content: "เนื้อหาประกาศเต็มรูปแบบที่ผู้ใช้ส่งมา",
};

const AnnouncementRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>("pending");
  const [processing, setProcessing] = useState(false);

  // editable fields (initialized from mock data)
  const [title, setTitle] = useState<string>(mockDetail.title);
  const [description, setDescription] = useState<string>(mockDetail.description);
  const [content, setContent] = useState<string>(mockDetail.content);
  const [date, setDate] = useState<string>(mockDetail.date);
  const [endDate, setEndDate] = useState<string | undefined>(mockDetail.endDate);

  // minimal: mock data used for display of other info
  const data = mockDetail;

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    // ... same as before
    setProcessing(true);
    setTimeout(() => { setStatus('approved'); setProcessing(false); }, 500);
  };

  const handleRejectClick = () => {
    setShowRejectInput(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert("กรุณาระบุเหตุผลการปฏิเสธ");
      return;
    }
    setProcessing(true);
    // In real app: send reject status + reason
    setTimeout(() => {
      setStatus('rejected');
      setProcessing(false);
      setShowRejectInput(false);
    }, 500);
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      // client-side validation
      if (!title.trim()) throw new Error('กรุณากรอกหัวข้อ');
      if (endDate && endDate < date) throw new Error('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม');

      // TODO: call backend to save edited fields (PUT/PATCH)
      // payload example: { title, description, content, date, endDate }
      await new Promise((res) => setTimeout(res, 600));

      // on success, show updated values (we already set them locally)
      alert("บันทึกการแก้ไขเรียบร้อยแล้ว");
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 bg-transparent p-6">
      {/* ... header keys ... */}
      <div className="detail-minimal">
        <div className="detail-header">
          <button className="back-link" onClick={() => navigate('/Admin/AnnouncementManage')}>← ย้อนกลับ</button>
          <h3 className="detail-h3">จัดการคำขอประกาศ #{id}</h3>
        </div>

        <div className="detail-card">
          {/* ... inputs ... */}
          <label className="form-label">หัวข้อ</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />

          <div className="detail-meta">ผู้ส่ง: {data.user} · ยื่น: {data.submittedAt}</div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">วันที่เริ่มแสดง</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">วันที่สิ้นสุด</label>
              <input type="date" className="form-input" value={endDate || ''} onChange={(e) => setEndDate(e.target.value || undefined)} />
            </div>
          </div>

          <label className="form-label" style={{ marginTop: 10 }}>คำอธิบายสั้น</label>
          <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} />

          <label className="form-label" style={{ marginTop: 10 }}>เนื้อหาประกาศ</label>
          <textarea className="form-textarea" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />

          {/* Rejection Reason Input Section */}
          {showRejectInput && status !== 'rejected' && (
            <div style={{ marginTop: 20, padding: 16, background: '#fff1f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
              <label className="form-label" style={{ color: '#cf1322' }}>ระบุเหตุผลที่ปฏิเสธ *</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น เนื้อหาไม่เหมาะสม, ข้อมูลไม่ครบถ้วน..."
                autoFocus
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn small btn-secondary" onClick={() => setShowRejectInput(false)}>ยกเลิก</button>
                <button className="btn small" style={{ background: '#cf1322', color: '#fff' }} onClick={confirmReject}>ยืนยันการปฏิเสธ</button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showRejectInput && (
            <div className="detail-actions">
              <button className="btn btn-primary small" onClick={handleSave} disabled={processing}>บันทึกการแก้ไข</button>

              <button className="btn btn-primary small" onClick={handleApprove} disabled={processing || status === 'approved' || status === 'rejected'}>
                {status === 'approved' ? 'อนุมัติแล้ว' : 'อนุมัติ'}
              </button>

              <button className="btn small" onClick={handleRejectClick} disabled={processing || status === 'rejected' || status === 'approved'}>
                {status === 'rejected' ? 'ปฏิเสธแล้ว' : 'ปฏิเสธ'}
              </button>

              <span className="detail-status">สถานะ: <strong>{status}</strong></span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AnnouncementRequestDetail;
