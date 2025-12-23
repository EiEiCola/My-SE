// Post.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  List,
  Tag,
  Space,
  Typography,
  Segmented,
  Empty,
  Spin,
  Avatar,
  message,
  Tooltip,
} from "antd";
import {
  FireOutlined,
  ThunderboltOutlined,
  LikeOutlined,
  MessageOutlined,
  EyeOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import postService from "../../../../services/http/post_service";
import type { Post } from "../../../../services/http/post_service";

const { Title, Text } = Typography;

// 🎨 Theme & Colors
const ORANGE = "#ff6a00";
const TEXT_SECONDARY = "#64748b";
const BG_HOVER = "#f8f9fa";

// ---------- Types ----------
type PostItem = {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  likes: number;
  comments: number;
  views: number;
  isHot?: boolean;
  authorName: string;
  authorAvatar: string;
  isAnonymous: boolean;
};

// Helper: แปลง Post entity เป็น PostItem สำหรับแสดงผล
const mapPostToItem = (post: Post): PostItem => {
  const createdDate = new Date(post.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let createdAt = "";
  if (diffMins < 60) {
    createdAt = `${diffMins} นาทีที่แล้ว`;
  } else if (diffHours < 24) {
    createdAt = `${diffHours} ชั่วโมงที่แล้ว`;
  } else if (diffDays === 0) {
    createdAt = "วันนี้";
  } else if (diffDays === 1) {
    createdAt = "เมื่อวานนี้";
  } else {
    createdAt = createdDate.toLocaleDateString("th-TH");
  }

  let authorName = "ไม่เปิดเผยชื่อ";
  let authorAvatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=anonymous`;

  if (!post.is_anonymous && post.author) {
    authorName =
      post.author.username ||
      `${post.author.first_name} ${post.author.last_name}`;
    authorAvatar =
      post.author.member_picture ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${post.author_id}`;
  }

  return {
    id: post.ID,
    title: post.title,
    category:
      post.SubCategoryL2?.title ||
      post.SubCategoryL1?.title ||
      post.MainCategory?.title ||
      "ทั่วไป",
    createdAt,
    likes: post.like_count,
    comments: post.comment_count,
    views: post.view_count,
    isHot: post.like_count > 10 || post.view_count > 100,
    authorName,
    authorAvatar,
    isAnonymous: post.is_anonymous,
  };
};

// ---------- Component ----------
const PostComponent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [popularRange, setPopularRange] = useState<"today" | "week">("today");

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await postService.getAll();
        const postItems = response.data.data.map(mapPostToItem);
        setPosts(postItems);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        message.error("ไม่สามารถโหลดโพสต์ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // แยกโพสต์เป็น realtime (ล่าสุด) และ popular (ยอดนิยม)
  const realtimePosts = useMemo(() => {
    return posts.slice(0, 5); // 5 โพสต์ล่าสุด
  }, [posts]);

  const filteredPopularPosts = useMemo(() => {
    // เรียงตาม likes + views
    const sorted = [...posts].sort(
      (a, b) => b.likes + b.views - (a.likes + a.views)
    );
    return sorted.slice(0, 5);
  }, [posts, popularRange]);

  // ✅ คลิกโพสต์แล้วเด้งไปหน้า PostDetail
  const handleClickPost = (item: PostItem) => {
    navigate(`/User/Post/detail/${item.id}`);
  };

  if (loading) {
    return (
      <main className="flex-1 bg-white">
        <div className="flex items-center justify-center h-screen">
          <Spin size="large" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* Header Section */}
        <div className="flex flex-row items-center justify-between gap-4 mb-8">
          <div className="flex-1 text-left" style={{ textAlign: "left" }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
              Community
            </Title>
            <Text style={{ color: TEXT_SECONDARY, fontSize: 16 }}>
              พื้นที่แลกเปลี่ยนพูดคุยของชาว SUT
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate("/User/Post/create_post")}
            style={{
              paddingInline: 24,
              height: 44,
              borderRadius: 12,
              background: ORANGE,
              boxShadow: "0 4px 12px rgba(255, 106, 0, 0.2)",
              border: "none",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            สร้างโพสต์ใหม่
          </Button>
        </div>

        <Row gutter={[24, 24]}>
          {/* Main Feed: Realtime Posts */}
          <Col xs={24} lg={16}>
            <div className="mb-4 flex items-center gap-2">
              <ThunderboltOutlined
                style={{ fontSize: 18, color: ORANGE }}
              />
              <Title level={4} style={{ margin: 0 }}>
                อัปเดตล่าสุด
              </Title>
            </div>

            <div className="flex flex-col gap-4">
              {realtimePosts.length === 0 ? (
                <Empty description="ยังไม่มีโพสต์ล่าสุด" />
              ) : (
                realtimePosts.map((item) => (
                  <Card
                    key={item.id}
                    hoverable
                    onClick={() => handleClickPost(item)}
                    bodyStyle={{ padding: "20px 24px" }}
                    style={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                    className="group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar
                        src={item.authorAvatar}
                        size={48}
                        icon={<UserOutlined />}
                        style={{
                          border: "2px solid white",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        {/* Meta: Author & Time */}
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong style={{ fontSize: 14 }}>
                            {item.authorName}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            • {item.createdAt}
                          </Text>
                        </div>

                        {/* Title */}
                        <Title
                          level={5}
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: 17,
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                          className="group-hover:text-orange-500 transition-colors"
                        >
                          {item.title}
                        </Title>

                        {/* Tags & Stats */}
                        <div className="flex items-center justify-between mt-3">
                          <Space size={8}>
                            <Tag
                              style={{
                                borderRadius: 8,
                                border: "none",
                                background: "#f1f5f9",
                                color: "#475569",
                                fontWeight: 500,
                              }}
                            >
                              {item.category}
                            </Tag>
                            {item.isHot && (
                              <Tag
                                color="#fff7ed"
                                style={{
                                  color: ORANGE,
                                  border: `1px solid ${ORANGE}40`,
                                  borderRadius: 8,
                                }}
                              >
                                🔥 Hot
                              </Tag>
                            )}
                          </Space>

                          <Space size={16} style={{ color: TEXT_SECONDARY, fontSize: 13 }}>
                            <span className="flex items-center gap-1">
                              <LikeOutlined /> {item.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageOutlined /> {item.comments}
                            </span>
                          </Space>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}

              <Button
                type="text"
                className="w-full text-center text-gray-400 hover:text-orange-500 hover:bg-transparent mt-2"
                style={{ height: 40 }}
              >
                ดูโพสต์ทั้งหมด <ArrowRightOutlined />
              </Button>
            </div>
          </Col>

          {/* Sidebar: Popular Posts */}
          <Col xs={24} lg={8}>
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FireOutlined style={{ color: ORANGE, fontSize: 18 }} />
                  <Title level={4} style={{ margin: 0 }}>
                    กำลังมาแรง
                  </Title>
                </div>
                <Segmented
                  size="small"
                  value={popularRange}
                  onChange={(val) => setPopularRange(val as "today" | "week")}
                  options={[
                    { label: "วันนี้", value: "today" },
                    { label: "สัปดาห์", value: "week" },
                  ]}
                />
              </div>

              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  background: "white",
                  marginBottom: 24,
                }}
                bodyStyle={{ padding: "16px 20px" }}
              >

                <List
                  itemLayout="horizontal"
                  dataSource={filteredPopularPosts}
                  split={false}
                  renderItem={(item, index) => (
                    <List.Item
                      className="cursor-pointer hover:bg-gray-50 rounded-xl px-0 py-3 transition-colors"
                      style={{ paddingInline: 12 }}
                      onClick={() => handleClickPost(item)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className="flex items-center justify-center font-bold"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: index < 3 ? ORANGE : "#f1f5f9",
                            color: index < 3 ? "white" : "#94a3b8",
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text
                            strong
                            style={{ fontSize: 14 }}
                            className="block truncate mb-1"
                          >
                            {item.title}
                          </Text>
                          <Space size={12} style={{ fontSize: 12, color: TEXT_SECONDARY }}>
                            <span className="flex items-center gap-1">
                              <LikeOutlined style={{ fontSize: 10 }} /> {item.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageOutlined style={{ fontSize: 10 }} /> {item.comments}
                            </span>
                          </Space>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>


            </div>
          </Col>
        </Row>
      </div>
    </main>
  );
};

export default PostComponent;