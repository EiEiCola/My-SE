import React from "react";
import { Card, Typography } from "antd";

const { Text } = Typography;

function MyPost() {
  return (
    <Card style={{ borderRadius: 20, marginBottom: 20 }}>
      <Text> My Post 🎉</Text>
    </Card>
  );
}

export default MyPost;
