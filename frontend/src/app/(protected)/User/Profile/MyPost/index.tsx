import React, { useEffect, useState } from "react";
import { Card, List, Empty, Spin, message, Avatar, Typography, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import postService from "../../../../../services/http/post_service";

const { Text, Title } = Typography;

interface Post {
  ID: number;
  title: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
}

const MyPost: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setLoading(true);
        const response = await postService.getMyPosts();
        setPosts(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch my posts:", error);
        message.error("ไม่สามารถโหลดโพสต์ของคุณได้");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

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
        <Empty description="ยังไม่มีโพสต์ของคุณ" />
      </Card>
    );
  }

  return (
    <Card title="My Post">
      <List
        dataSource={posts}
        renderItem={(post) => (
          <List.Item
            key={post.ID}
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/User/Post/${post.ID}`)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: post.is_anonymous ? "#ccc" : "#ff6a00" }}
                >
                  {post.is_anonymous ? "?" : post.title.charAt(0).toUpperCase()}
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
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ❤️ {post.like_count || 0} | 💬 {post.comment_count || 0}
                    </Text>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default MyPost;
