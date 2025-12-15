import React from "react";
import { Card } from "antd";

type Props = {
  targetId: number;
};

const MyPost: React.FC<Props> = ({ targetId }) => {
  return (
    <Card>
      <p>Posts of user ID: {targetId}</p>
      <p style={{ color: "#999" }}>
        (ระบบโพสต์ของเพื่อน – รอเชื่อม API)
      </p>
    </Card>
  );
};

export default MyPost;
