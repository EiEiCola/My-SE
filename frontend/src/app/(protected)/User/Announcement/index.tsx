import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Typography, Spin, Empty, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import "./index.css";

const { Title, Text } = Typography;

interface Announcement {
  id: number;
  title: string;
  description: string;
  image?: string;
  date: string;
  status: "active" | "archived";
  content?: string;
  category?: string;
  categoryObj?: { id: number; title: string }; // New field
}

interface PRSubmission {
  id: number;
  title: string;
  submittedAt: string;
  status: string;
  reason: string;
}

// Backend API Response Interfaces
interface BackendAnnouncement {
  id: number;
  title: string;
  content: string;
  publish_start_at: string;
  status_id: number;
  media?: { url: string; is_cover: boolean }[];
  category?: string;
  category_name?: string;
  main_category?: { name: string };
  AnnouncementCategory?: { id: number; title: string }; // New relation
}

interface BackendPRSubmission {
  id: number;
  title: string;
  req_start_at: string;
  status_id: number;
  reject_reason?: string;
}

const Announcement: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; title: string }[]>([]);

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories/announcement");
        const json = await res.json();
        if (json.data) {
          setCategories(json.data.map((c: any) => ({ id: c.ID, title: c.title })));
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchCats();
  }, []);

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
        const mappedData = (json.data || []).map((item: BackendAnnouncement) => ({
          id: item.id,
          title: item.title,
          description: item.content ? item.content.slice(0, 100) + (item.content.length > 100 ? "..." : "") : "",
          // Use cover url if available
          image: item.media?.find((m) => m.is_cover)?.url || item.media?.[0]?.url || "https://via.placeholder.com/300x200?text=No+Image",
          date: item.publish_start_at,
          status: item.status_id === 1 ? "active" : "archived",
          content: item.content,
          // Use dynamic category if available
          categoryObj: item.AnnouncementCategory ? { id: item.AnnouncementCategory.id, title: item.AnnouncementCategory.title } : undefined,
          // Fallback string for legacy support
          category: (item.AnnouncementCategory?.title || item.category || item.category_name || item.main_category?.name || "general")?.toLowerCase(),
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

    // Filter by Category ID if selected, matching against categoryObj.id
    // If filterCategory is a string/number ID
    const matchesCategory = !filterCategory ||
      (item.categoryObj && item.categoryObj.id.toString() === filterCategory) ||
      (item.category || "").toLowerCase() === filterCategory.toLowerCase(); // Legacy fallback
    return matchesSearch && matchesCategory;
  });

  /* New State for Tab Switching */
  const [activeTab, setActiveTab] = useState<'feed' | 'my_requests'>('feed');

  /* My Requests State */
  const [mySubmissions, setMySubmissions] = useState<PRSubmission[]>([]);
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
          const mapped = (json.data || []).map((item: BackendPRSubmission) => ({
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

  // Ant Design Table Columns
  const columns: ColumnsType<PRSubmission> = [
    {
      title: 'หัวข้อ',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'วันที่ส่ง',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = 'รอตรวจสอบ';
        if (status === 'approved') { color = 'success'; text = 'อนุมัติ'; }
        if (status === 'rejected') { color = 'error'; text = 'ปฏิเสธ'; }
        if (status === 'pending') { color = 'processing'; text = 'รอตรวจสอบ'; }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => <Text type="secondary">{text}</Text>
    }
  ];

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-transparent p-8 flex justify-center items-center">
        <Spin size="large" tip="กำลังโหลดประกาศ..." />
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
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))
                ) : (
                  <>
                    <option value="general">ทั่วไป</option>
                    <option value="activity">กิจกรรม</option>
                    <option value="scholarship">ทุนการศึกษา</option>
                    <option value="urgent">ด่วน</option>
                  </>
                )}
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
          /* My Requests View - Refactored to Ant Design Table */
          <div style={{ marginTop: 24, background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Table
              columns={columns}
              dataSource={mySubmissions}
              rowKey="id"
              loading={submissionsLoading}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="ไม่พบประวัติคำขอ" /> }}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default Announcement;