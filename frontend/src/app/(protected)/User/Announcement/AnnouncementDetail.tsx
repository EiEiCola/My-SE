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

        // Get JWT token from localStorage
        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Fetch real data
        const response = await fetch(`/api/members/announcements/${id}`, { headers });
        if (!response.ok) {
          throw new Error("Failed to fetch announcement");
        }
        const data = await response.json();

        // Map backend data to frontend interface
        // Helper to find cover image
        const coverImage = data.media?.find((m: any) => m.is_cover)?.url || data.media?.[0]?.url;

        const mappedData: AnnouncementDetail = {
          id: data.id,
          title: data.title,
          description: data.content, // Using content as description for now
          content: data.content,
          image: coverImage,
          date: data.publish_start_at,
          author: "Admin", // Backend doesn't send Admin Name yet, defaulting
          status: data.status_id === 1 ? "active" : "archived",
        };

        setAnnouncement(mappedData);
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
