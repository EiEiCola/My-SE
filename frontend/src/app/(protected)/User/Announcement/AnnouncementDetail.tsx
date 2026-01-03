import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, Tag, Button, Space, Divider, message, Skeleton } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  UserOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import "./AnnouncementDetail.css";

const { Title, Paragraph, Text } = Typography;

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

        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/members/announcements/${id}`, { headers });
        if (!response.ok) {
          throw new Error("Failed to fetch announcement");
        }
        const data = await response.json();

        const coverImage = data.media?.find((m: { is_cover: boolean }) => m.is_cover)?.url || data.media?.[0]?.url;

        const mappedData: AnnouncementDetail = {
          id: data.id,
          title: data.title,
          description: data.content,
          content: data.content,
          image: coverImage,
          date: data.publish_start_at,
          author: "Admin",
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

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: announcement?.title,
        text: announcement?.description,
        url: url,
      }).then(() => {
        message.success("แชร์สำเร็จ!");
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(url);
        message.success("คัดลอกลิงก์แล้ว!");
      });
    } else {
      navigator.clipboard.writeText(url);
      message.success("คัดลอกลิงก์แล้ว!");
    }
  };

  const handlePrint = () => {
    window.print();
    message.info("กำลังเตรียมพิมพ์...");
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Skeleton.Image active style={{ width: "100%", height: 400 }} />
          <Card style={{ marginTop: 24 }}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        </div>
      </main>
    );
  }

  if (error || !announcement) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <Card style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <Text type="danger" style={{ fontSize: 18 }}>⚠️ {error || "ไม่พบประกาศ"}</Text>
          <br /><br />
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            กลับไปยังประกาศ
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Back Button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginBottom: 16, fontSize: 16 }}
        >
          กลับไปยังประกาศ
        </Button>

        {/* Main Card */}
        <Card
          cover={
            announcement.image && (
              <img
                alt={announcement.title}
                src={announcement.image}
                style={{
                  width: "100%",
                  height: 400,
                  objectFit: "cover",
                  borderRadius: "8px 8px 0 0"
                }}
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/800x400?text=No+Image";
                }}
              />
            )
          }
          style={{
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
                {announcement.title}
              </Title>

              <Space wrap>
                <Tag icon={<CalendarOutlined />} color="orange">
                  {new Date(announcement.date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Tag>

                {announcement.author && (
                  <Tag icon={<UserOutlined />} color="volcano">
                    {announcement.author}
                  </Tag>
                )}

                <Tag
                  icon={announcement.status === "active" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  color={announcement.status === "active" ? "orange" : "default"}
                >
                  {announcement.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </Tag>
              </Space>
            </Space>
          </div>

          <Divider />

          {/* Content */}
          <div style={{ marginBottom: 32 }}>
            <Paragraph style={{
              fontSize: 16,
              lineHeight: 2,
              color: "#2c2c2c",
              whiteSpace: "pre-wrap",
              textAlign: "justify"
            }}>
              {announcement.content}
            </Paragraph>
          </div>

          <Divider />

          {/* Action Buttons */}
          <Space size="middle">
            <Button
              type="primary"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              style={{
                background: "#ff7a45",
                borderColor: "#ff7a45"
              }}
            >
              แชร์ประกาศนี้
            </Button>

            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{
                borderColor: "#ff7a45",
                color: "#ff7a45"
              }}
            >
              พิมพ์ประกาศ
            </Button>
          </Space>
        </Card>

        {/* Bottom Back Button */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            กลับไปยังประกาศ
          </Button>
        </div>
      </div>
    </main>
  );
};

export default AnnouncementDetail;
