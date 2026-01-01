import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

interface Announcement {
  id: number;
  title: string;
  description: string;
  image?: string;
  date: string;
  status: "active" | "archived";
  content?: string;
  category?: string;
}

const Announcement: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get JWT token from localStorage
        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('/api/members/announcements?page_size=20', { headers });
        if (!response.ok) throw new Error("Failed to fetch announcements");
        const json = await response.json();

        // Map backend data to frontend
        const mappedData = (json.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.content ? item.content.slice(0, 100) + (item.content.length > 100 ? "..." : "") : "",
          // Use cover url if available
          image: item.media?.find((m: any) => m.is_cover)?.url || item.media?.[0]?.url || "https://via.placeholder.com/300x200?text=No+Image",
          date: item.publish_start_at,
          status: item.status_id === 1 ? "active" : "archived",
          content: item.content,
          // Backend currently has no explicit category; try common fields then default to "general" to make filter usable
          category: (item.category || item.category_name || item.main_category?.name || "general")?.toLowerCase(),
        }));

        setAnnouncements(mappedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleCardClick = (id: number) => {
    navigate(`/User/Announcement/${id}`);
  };



  /* Search & Filter State */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || (item.category || "").toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  /* New State for Tab Switching */
  const [activeTab, setActiveTab] = useState<'feed' | 'my_requests'>('feed');

  /* My Requests State */
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'my_requests') {
      const fetchMySubmissions = async () => {
        try {
          setSubmissionsLoading(true);

          // Get JWT token from localStorage
          const token = localStorage.getItem("token");
          const headers: HeadersInit = { "Content-Type": "application/json" };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const res = await fetch('/api/members/pr-submissions', { headers });
          if (!res.ok) throw new Error("Failed to fetch submissions");
          const json = await res.json();
          // Map response
          const mapped = (json.data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            submittedAt: item.req_start_at ? new Date(item.req_start_at).toLocaleDateString('th-TH') : "-",
            status: item.status_id === 1 ? 'pending' : item.status_id === 2 ? 'approved' : 'rejected',
            reason: item.reject_reason || "-"
          }));
          setMySubmissions(mapped);
        } catch (err) {
          console.error(err);
        } finally {
          setSubmissionsLoading(false);
        }
      };
      fetchMySubmissions();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-transparent p-8">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto bg-transparent p-8">
        <div className="error-container">
          <p className="error-text">⚠️ {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-8">
      <div className="announcement-container">
        <div className="announcement-header">
          <div className="header-top">
            <h1 className="announcement-title">ประกาศ</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="ค้นหาประกาศ..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
              />
              <select
                className="filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
              >
                <option value="">ทั้งหมด</option>
                <option value="general">ทั่วไป</option>
                <option value="activity">กิจกรรม</option>
                <option value="scholarship">ทุนการศึกษา</option>
                <option value="urgent">ด่วน</option>
              </select>
              <button
                className="create-btn"
                onClick={() => navigate('/User/Announcement/create')}
              >
                + สร้างประกาศ
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tabs" style={{ display: 'flex', gap: 16, marginTop: 16, borderBottom: '1px solid #eee' }}>
            <button
              onClick={() => setActiveTab('feed')}
              style={{ padding: '8px 16px', borderBottom: activeTab === 'feed' ? '2px solid #ff7a45' : 'none', fontWeight: activeTab === 'feed' ? 'bold' : 'normal', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
            >
              ข่าวประชาสัมพันธ์
            </button>
            <button
              onClick={() => setActiveTab('my_requests')}
              style={{ padding: '8px 16px', borderBottom: activeTab === 'my_requests' ? '2px solid #ff7a45' : 'none', fontWeight: activeTab === 'my_requests' ? 'bold' : 'normal', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
            >
              ประวัติคำขอของฉัน
            </button>
          </div>
        </div>

        {activeTab === 'feed' ? (
          /* Feed View */
          filteredAnnouncements.length === 0 ? (
            <div className="empty-state">
              <p>ไม่พบประกาศที่ค้นหา</p>
            </div>
          ) : (
            <div className="announcement-grid" style={{ marginTop: 20 }}>
              {filteredAnnouncements.map((item) => (
                <div
                  key={item.id}
                  className="announcement-card"
                  onClick={() => handleCardClick(item.id)}
                >
                  <div className="card-image-container">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="card-image"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-description">{item.description}</p>
                    <p className="card-date">{new Date(item.date).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Requests View */
          <div className="my-requests-table" style={{ marginTop: 20, overflowX: 'auto' }}>
            {submissionsLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>กำลังโหลดข้อมูล...</div>
            ) : mySubmissions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#999', border: '1px dashed #ddd', borderRadius: 8 }}>ไม่พบประวัติคำขอ</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', textAlign: 'left' }}>
                    <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>หัวข้อ</th>
                    <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>วันที่ส่ง</th>
                    <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>สถานะ</th>
                    <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>เหตุผล (ถ้าถูกปฏิเสธ)</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubmissions.map((req) => (
                    <tr key={req.id}>
                      <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{req.title}</td>
                      <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{req.submittedAt}</td>
                      <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          background: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                          color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#991b1b' : '#374151'
                        }}>
                          {req.status === 'approved' ? 'อนุมัติ' : req.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                        </span>
                      </td>
                      <td style={{ padding: 12, borderBottom: '1px solid #eee', color: '#666' }}>{req.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Announcement;