import React, { useEffect, useState } from "react";
import { Card, List, Empty, Spin, message, Avatar, Typography, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import postService from "../../../../../services/http/post_service";

const { Text, Title } = Typography;
const API_BASE = import.meta.env.VITE_API_URL || "";

interface Post {
  ID: number;
  title: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  author?: {
    ID: number;
    username: string;
    member_picture?: string;
  };
}

interface MyFavProps {
  userId?: number;
}

const MyFav: React.FC<MyFavProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      try {
        setLoading(true);
        const response = userId ? await postService.getUserFavs(userId) : await postService.getBookmarkedPosts();
        setPosts(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch bookmarked posts:", error);
        message.error("ไม่สามารถโหลดรายการโปรดได้");
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedPosts();
  }, [userId]); // ✅ Added userId dependency for real-time updates

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <Empty description="ยังไม่มีโพสต์ที่บันทึกไว้" />
      </Card>
    );
  }

  return (
    <Card title="My Fav">
      <List
        dataSource={posts}
        renderItem={(post) => {
          // Get avatar based on post author data (same as MyPost)
          let avatarSrc: string;
          let fallbackText = "?";

          if (post.is_anonymous) {
            avatarSrc = `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128`;
            fallbackText = "?";
          } else if (post.author && post.author.member_picture) {
            const pic = post.author.member_picture;
            if (pic.startsWith("http") || pic.startsWith("data:")) {
              avatarSrc = pic;
            } else if (pic.startsWith("/")) {
              avatarSrc = `${API_BASE}${pic}`;
            } else {
              avatarSrc = `${API_BASE}/${pic}`;
            }
            fallbackText = post.author.username?.charAt(0).toUpperCase() || "U";
          } else if (post.author) {
            avatarSrc = `https://api.dicebear.com/7.x/thumbs/svg?seed=${post.author.ID || post.ID}`;
            fallbackText = post.author.username?.charAt(0).toUpperCase() || "U";
          } else {
            avatarSrc = `https://api.dicebear.com/7.x/thumbs/svg?seed=${post.ID}`;
            fallbackText = "U";
          }

          return (
            <List.Item
              key={post.ID}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/User/Post/detail/${post.ID}`)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={avatarSrc}
                    size={48}
                    style={{
                      backgroundColor: post.is_anonymous ? "#ccc" : "#ff6a00",
                      border: "2px solid #fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  >
                    {fallbackText}
                  </Avatar>
                }
                title={
                  <div>
                    <Title level={5} style={{ margin: 0, display: "inline" }}>
                      {post.title}
                    </Title>
                    {post.is_anonymous && (
                      <Tag color="default" style={{ marginLeft: 8 }}>
                        ไม่เปิดเผยตัวตน
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary">
                      {post.content.substring(0, 80)}...
                    </Text>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 16 }}>
                      {/* Like - Home style */}
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ff6a00" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{post.like_count || 0}</span>
                      </span>
                      {/* Comment - Home style */}
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ff6a00" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{post.comment_count || 0}</span>
                      </span>
                    </div>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default MyFav;

