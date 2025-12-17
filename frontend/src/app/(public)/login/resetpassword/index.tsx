import React, { useState } from "react";
import { Card, Input, Button, Typography, Space } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const memberID = location.state?.memberID;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleReset = async () => {
    if (password !== confirm) return alert("Passwords do not match!");

    try {
      await axios.post("http://localhost:8080/auth/reset-password", {
        member_id: memberID,
        new_password: password,
      });

      alert("Password reset successfully!");
      navigate("/login");
    } catch (error) {
      alert("Reset failed.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff5ed",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 750,
          borderRadius: 24,
          padding: "50px 45px",
          boxShadow: "0px 8px 20px rgba(0,0,0,0.08)",
        }}
      >
        <Title
          level={2}
          style={{
            textAlign: "center",
            color: "#C42E0A",
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          Create New Password
        </Title>

        {/* NEW PASSWORD */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>New Password</Text>
          <Input.Password
            placeholder="Enter new password"
            size="large"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderRadius: 10, height: 46, fontWeight: 600 }}
          />
        </Space>

        {/* CONFIRM PASSWORD */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>Confirm Password</Text>
          <Input.Password
            placeholder="Confirm new password"
            size="large"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{ borderRadius: 10, height: 46, fontWeight: 600 }}
          />
        </Space>

        {/* BUTTON */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleReset}
            style={{
              backgroundColor: "#C42E0A",
              borderRadius: 10,
              height: 40,
              width: 180,
              fontWeight: 700,
              fontSize: 17,
            }}
          >
            Reset Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
