import React from "react";
import { Card, Typography } from "antd";

const { Text } = Typography;

function MySticker() {
  return (
    <Card style={{ borderRadius: 20, padding: 25 }}>
      <Text style={{ fontWeight: 600, fontSize: 16 }}>
       
      </Text >

      <div
        style={{
          marginTop: 20,
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 20,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card
            key={i}
            style={{
              height: 120,
              borderRadius: 16,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#FFF4EC",
              border: "1px solid #FFD2BE",
            }}
          >
            <span style={{ fontSize: 40 }}> </span>
          </Card>
        ))} 
      </div>
    </Card>
  );
}

export default MySticker;
