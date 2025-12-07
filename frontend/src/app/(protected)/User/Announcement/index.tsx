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
        
        // Replace with your actual API endpoint
        // const response = await fetch('/api/announcements');
        // const data = await response.json();
        // setAnnouncements(data);

        // Mock data - replace with real API call above
        const mockData: Announcement[] = [
          {
            id: 1,
            title: "ประกาศสำคัญ",
            description: "ข้อมูลประกาศใหม่",
            image: "https://via.placeholder.com/300x200?text=Announcement+1",
            date: "2025-01-15",
            status: "active",
            content: "รายละเอียดเพิ่มเติมของประกาศ",
          },
          {
            id: 2,
            title: "ประกาศสำคัญ",
            description: "ข้อมูลประกาศใหม่",
            image: "https://via.placeholder.com/300x200?text=Announcement+2",
            date: "2025-01-14",
            status: "active",
            content: "รายละเอียดเพิ่มเติมของประกาศ",
          },
          {
            id: 3,
            title: "ประกาศสำคัญ",
            description: "ข้อมูลประกาศใหม่",
            image: "https://via.placeholder.com/300x200?text=Announcement+3",
            date: "2025-01-13",
            status: "active",
            content: "รายละเอียดเพิ่มเติมของประกาศ",
          },
          {
            id: 4,
            title: "ประกาศสำคัญ",
            description: "ข้อมูลประกาศใหม่",
            image: "https://via.placeholder.com/300x200?text=Announcement+4",
            date: "2025-01-12",
            status: "active",
            content: "รายละเอียดเพิ่มเติมของประกาศ",
          },
          {
            id: 5,
            title: "ประกาศสำคัญ",
            description: "ข้อมูลประกาศใหม่",
            image: "https://via.placeholder.com/300x200?text=Announcement+5",
            date: "2025-01-11",
            status: "active",
            content: "รายละเอียดเพิ่มเติมของประกาศ",
          },
          {
            id: 6,
            title: "ประกาศสำคัญ",
            description: "ข้อมูลประกาศใหม่",
            image: "https://via.placeholder.com/300x200?text=Announcement+6",
            date: "2025-01-10",
            status: "active",
            content: "รายละเอียดเพิ่มเติมของประกาศ",
          },
        ];

        setAnnouncements(mockData);
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

  const handleViewAll = () => {
    // Scroll to top or implement pagination
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            <button 
              className="view-all-link"
              onClick={handleViewAll}
            >
              VIEW ALL &gt;
            </button>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="empty-state">
            <p>ไม่มีประกาศในขณะนี้</p>
          </div>
        ) : (
          <div className="announcement-grid">
            {announcements.map((item) => (
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
        )}
      </div>
    </main>
  );
};

export default Announcement;