import React, { useEffect, useState } from "react";
import { Card, List, Typography, Button, Spin, Empty, Tag } from "antd";
import { SoundOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface Announcement {
    id: number;
    title: string;
    start_at: string;
    category: string;
}

const AnnouncementWidget: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Announcement[]>([]);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const headers: HeadersInit = {};
                if (token) headers.Authorization = `Bearer ${token}`;

                // Fetch latest 5 active announcements
                const res = await fetch("/api/members/announcements?page_size=5", { headers });
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                const data = (json.data || []).map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    start_at: item.publish_start_at,
                    category: item.category || "General",
                }));
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatest();
    }, []);

    return (
        <Card
            bordered={false}
            style={{
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
            bodyStyle={{
                flex: 1,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <SoundOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
                    <Title level={4} style={{ margin: 0, fontSize: "18px" }}>
                        ข่าวประกาศล่าสุด
                    </Title>
                </div>
                <Button
                    type="link"
                    onClick={() => navigate("/User/Announcement")}
                    style={{ padding: 0 }}
                >
                    ดูทั้งหมด
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spin />
                    </div>
                ) : items.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีประกาศล่าสุด" />
                ) : (
                    <List
                        dataSource={items}
                        renderItem={(item) => (
                            <List.Item
                                className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-3 transition-colors"
                                style={{ borderBottom: "1px solid #f0f0f0" }}
                                onClick={() => navigate(`/User/Announcement/${item.id}`)}
                            >
                                <div className="w-full">
                                    <div className="flex justify-between items-start mb-1">
                                        <Text strong style={{ fontSize: "14px", lineHeight: 1.4 }} className="line-clamp-1 flex-1 pr-2">
                                            {item.title}
                                        </Text>
                                        {item.category === 'urgent' && <Tag color="red" style={{ margin: 0 }}>ด่วน</Tag>}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: "12px" }}>
                                        {new Date(item.start_at).toLocaleDateString("th-TH")}
                                    </Text>
                                </div>
                            </List.Item>
                        )}
                    />
                )}
            </div>

            <Button
                block
                type="dashed"
                icon={<ArrowRightOutlined />}
                style={{ marginTop: "auto" }}
                onClick={() => navigate("/User/Announcement")}
            >
                ไปยังหน้าประกาศ
            </Button>
        </Card>
    );
};

export default AnnouncementWidget;
