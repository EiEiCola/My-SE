import React, { useEffect, useState } from "react";
import { Card, List, Empty, Spin, message, Avatar, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import postService from "../../../../../services/http/post_service";

const { Text, Title } = Typography;

interface Post {
  ID: number;
  title: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  author?: {
    username: string;
    member_picture: string;
  };
}

const MyFav: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      try {
        setLoading(true);
        const response = await postService.getBookmarkedPosts();
        setPosts(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch bookmarked posts:", error);
        message.error("ไม่สามารถโหลดรายการโปรดได้");
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedPosts();
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
        <Empty description="ยังไม่มีโพสต์ที่บันทึกไว้" />
      </Card>
    );
  }

  return (
    <Card title="My Fav">
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
                  src={
                    post.is_anonymous || !post.author
                      ? `https://api.dicebear.com/7.x/thumbs/svg?seed=anonymous`
                      : post.author.member_picture ||
                      `https://api.dicebear.com/7.x/thumbs/svg?seed=${post.ID}`
                  }
                />
              }
              title={<Title level={5} style={{ margin: 0 }}>{post.title}</Title>}
              description={
                <Text type="secondary">
                  {post.content.substring(0, 80)}...
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default MyFav;
