import React from "react";
import { listAdminAnnouncements, deleteAdminAnnouncement } from "../../../../services/http/announcementAdmin";

const AnnouncementsList: React.FC = () => {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [total, setTotal] = React.useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminAnnouncements({ page, page_size: pageSize });
      setItems(Array.isArray(data.data) ? data.data : []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e.message || "โหลดประกาศไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchData(); }, [page, pageSize]);

  const onDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบประกาศนี้?")) return;
    try {
      await deleteAdminAnnouncement(id);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "ลบไม่สำเร็จ");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="admin-announcement-manage">
        <div className="flex justify-between items-center mb-6">
          <h2 className="page-title" style={{ margin: 0 }}>รายการประกาศ</h2>
        </div>

        {loading ? (
          <p>กำลังโหลด...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <div className="table-wrap">
            <table className="request-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>หัวข้อ</th>
                  <th>ช่วงเผยแพร่</th>
                  <th>สถานะ</th>
                  <th style={{ width: 160 }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.id}</td>
                    <td>{it.title}</td>
                    <td>{new Date(it.publish_start_at).toLocaleDateString('th-TH')} — {new Date(it.publish_end_at).toLocaleDateString('th-TH')}</td>
                    <td>{it.status_id === 1 ? 'ใช้งาน' : 'ปิด'}</td>
                    <td>
                      <button className="btn" onClick={() => onDelete(it.id)} style={{ background: '#dc2626', color: '#fff' }}>ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: 16 }}>
                <button className="btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p-1))}>ก่อนหน้า</button>
                <span style={{ margin: '0 8px' }}>หน้า {page} จาก {totalPages}</span>
                <button className="btn" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>ถัดไป</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default AnnouncementsList;
