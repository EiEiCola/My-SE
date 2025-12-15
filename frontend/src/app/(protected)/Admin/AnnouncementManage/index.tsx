// Admin Announcement Management
import React from "react";
import { useNavigate } from "react-router-dom";
import "./AnnouncementManage.css";

interface RequestRow {
  id: number;
  user: string;
  title: string;
  submittedAt: string;
  displayFrom: string;
  displayTo?: string;
  status: "pending" | "approved" | "rejected";
}

const AnnouncementManage: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [requests, setRequests] = React.useState<RequestRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // Build query params
        let url = '/api/admin/pr-submissions?page_size=50';
        if (filterStatus === 'pending') url += '&status_id=1';
        else if (filterStatus === 'approved') url += '&status_id=2';
        else if (filterStatus === 'rejected') url += '&status_id=3';

        // Using Admin List API (Mock Admin Auth)
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const json = await response.json();
        const mapped = (json.data || []).map((item: any) => ({
          id: item.id,
          user: item.member?.username || `Member #${item.member_id}`,
          title: item.title,
          submittedAt: item.req_start_at ? new Date(item.req_start_at).toLocaleDateString('th-TH') : "-",
          // Note: Backend might return ISO, conversion needed.
          // displayFrom/To map to ReqStart/End
          displayFrom: item.req_start_at ? new Date(item.req_start_at).toLocaleDateString('th-TH') : "-",
          displayTo: item.req_end_at ? new Date(item.req_end_at).toLocaleDateString('th-TH') : "-",
          status: item.status_id === 1 ? "pending" : item.status_id === 2 ? "approved" : "rejected"
        }));
        setRequests(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [filterStatus]); // Re-fetch when filter changes

  // Client-side filter removed as we now filter on server
  const filteredRequests = requests;

  const handleRowClick = (id: number) => {
    navigate(`/Admin/AnnouncementManage/${id}`);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="admin-announcement-manage">
        <div className="flex justify-between items-center mb-6">
          <h2 className="page-title" style={{ margin: 0 }}>คำขอประชาสัมพันธ์</h2>
          <div className="flex gap-4">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d9d9d9' }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/User/Announcement/create')} // Can reuse user form or specific admin form
            >
              + สร้างประกาศทางการ
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ผู้ยื่นคำร้อง</th>
                <th>วันที่ยื่น</th>
                <th>ชื่อหัวข้อ</th>
                <th>ช่วงเผยแพร่</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r.id} className={`row-${r.status}`} onClick={() => handleRowClick(r.id)}>
                  <td>{r.id}</td>
                  <td>{r.user}</td>
                  <td>{r.submittedAt}</td>
                  <td>{r.title}</td>
                  <td>{r.displayFrom}{r.displayTo ? ` — ${r.displayTo}` : ''}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default AnnouncementManage;