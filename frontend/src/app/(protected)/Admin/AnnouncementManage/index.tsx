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

const mockRequests: RequestRow[] = [
  { id: 1, user: "user01", title: "ขอเชิญร่วมงานปฐมนิเทศ", submittedAt: "2025-12-01", displayFrom: "2025-12-05", displayTo: "2025-12-10", status: "pending" },
  { id: 2, user: "user02", title: "อบรมเทคโนโลยีสารสนเทศ", submittedAt: "2025-12-02", displayFrom: "2025-12-12", displayTo: "2025-12-15", status: "pending" },
  { id: 3, user: "user03", title: "ขอประชาสัมพันธ์ข่าวดี", submittedAt: "2025-12-03", displayFrom: "2025-12-04", displayTo: "2025-12-06", status: "approved" },
];

const AnnouncementManage: React.FC = () => {
  const navigate = useNavigate();

  const handleRowClick = (id: number) => {
    navigate(`/Admin/AnnouncementManage/${id}`);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="admin-announcement-manage">
        <h2 className="page-title">คำขอประชาสัมพันธ์</h2>

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
              {mockRequests.map((r) => (
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