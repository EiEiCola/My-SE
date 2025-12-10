import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AnnouncementDetail.css";

interface AnnouncementDetail {
  id: number;
  title: string;
  description: string;
  image?: string;
  date: string;
  content: string;
  status: "active" | "archived";
  author?: string;
}

const AnnouncementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        setError(null);

        // Replace with your actual API endpoint
        // const response = await fetch(`/api/announcements/${id}`);
        // const data = await response.json();
        // setAnnouncement(data);

        // Mock data - replace with real API call above
        const mockData: AnnouncementDetail = {
          id: parseInt(id || "1"),
          title: "ประกาศสำคัญ",
          description: "ข้อมูลประกาศใหม่",
          image: "https://via.placeholder.com/800x400?text=Announcement+Detail",
          date: "2025-01-15",
          author: "ผู้ดูแลระบบ",
          content: `นี่คือรายละเอียดของประกาศที่มีความสำคัญ
          
โครงการนี้ได้รับการพัฒนาเพื่อให้ประชากรทั่วไปสามารถได้รับข้อมูลข่าวสารและประกาศต่างๆ อย่างรวดเร็วและชัดเจน

หัวข้อหลักของประกาศนี้:
• ให้ข้อมูลที่เป็นประโยชน์และเกี่ยวข้องกับชีวิตประจำวัน
• นำเสนอข้อมูลในรูปแบบที่เข้าใจง่ายและเชื่อถือได้
• อำนวยความสะดวกให้ผู้ใช้งานสามารถติดตามข้อมูลได้ตลอดเวลา

เนื้อหาของประกาศนี้มีไว้เพื่อให้ประชาชนได้รับทราบข้อมูลสำคัญ และสามารถนำไปใช้ในการตัดสินใจได้อย่างเหมาะสม

ขอบคุณที่ติดตามข้อมูลประกาศของเรา`,
          status: "active",
        };

        setAnnouncement(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch announcement");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const handleBack = () => {
    navigate("/User/Announcement");
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-transparent p-8">
        <div className="detail-loading">
          <div className="spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
      </main>
    );
  }

  if (error || !announcement) {
    return (
      <main className="flex-1 overflow-y-auto bg-transparent p-8">
        <div className="detail-error">
          <p className="error-text">⚠️ {error || "ไม่พบประกาศ"}</p>
          <button className="back-button" onClick={handleBack}>
            ← กลับไปยังประกาศ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-transparent">
      <div className="announcement-detail-container">
        <button className="back-button-top" onClick={handleBack}>
          ← กลับไป
        </button>

        <div className="detail-content">
          <div className="detail-image-container">
            <img
              src={announcement.image}
              alt={announcement.title}
              className="detail-image"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/800x400?text=No+Image";
              }}
            />
          </div>

          <div className="detail-body">
            <div className="detail-header">
              <h1 className="detail-title">{announcement.title}</h1>
              <div className="detail-meta">
                <span className="meta-date">
                  📅 {new Date(announcement.date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {announcement.author && (
                  <span className="meta-author">👤 {announcement.author}</span>
                )}
                <span className={`meta-status ${announcement.status}`}>
                  {announcement.status === "active" ? "✓ เปิดใช้งาน" : "✕ ปิดใช้งาน"}
                </span>
              </div>
            </div>

            <div className="detail-description">
              <p className="description-text">{announcement.description}</p>
            </div>

            <div className="detail-article">
              {announcement.content.split("\n").map((paragraph, index) => (
                <p key={index} className="article-text">
                  {paragraph.trim()}
                </p>
              ))}
            </div>

            <div className="detail-footer">
              <button className="detail-action-btn share-btn">
                📤 แชร์ประกาศนี้
              </button>
              <button className="detail-action-btn print-btn">
                🖨️ พิมพ์ประกาศ
              </button>
            </div>
          </div>
        </div>

        <button className="back-button-bottom" onClick={handleBack}>
          ← กลับไปยังประกาศ
        </button>
      </div>
    </main>
  );
};

export default AnnouncementDetail;
