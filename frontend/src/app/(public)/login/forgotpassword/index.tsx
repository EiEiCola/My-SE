import React, { useState } from "react";
import { Card, Input, Button, Typography, Space } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [nationalID, setNationalID] = useState("");

  const handleVerify = async () => {
    try {
      const res = await axios.post("http://localhost:8080/auth/verify-reset", {
        identifier,
        national_id: nationalID,
      });

      if (res.data.success) {
        navigate("/reset-password", {
          state: { memberID: res.data.member_id },
        });
      }
    } catch (error) {
      alert("Verification failed. Please check your information.");
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
          Reset Your Password
        </Title>

        <Text
          style={{
            display: "block",
            textAlign: "center",
            color: "#6D6D6D",
            marginBottom: 40,
            fontWeight: 600,
            fontSize: 17,
          }}
        >
          Verify your identity to reset password
        </Text>

        {/* IDENTIFIER */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>
            Email or Student ID
          </Text>
          <Input
            placeholder="Enter your email or student ID"
            size="large"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={{
              borderRadius: 10,
              height: 46,
              fontWeight: 600,
            }}
          />
        </Space>

        {/* NATIONAL ID */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>
            National ID Number
          </Text>
          <Input
            placeholder="Enter your 13-digit national ID"
            size="large"
            value={nationalID}
            maxLength={13}
            onChange={(e) => setNationalID(e.target.value)}
            style={{
              borderRadius: 10,
              height: 46,
              fontWeight: 600,
            }}
          />
        </Space>

        {/* BUTTON */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleVerify}
            style={{
              backgroundColor: "#C42E0A",
              borderRadius: 10,
              height: 40,
              width: 200,
              fontWeight: 700,
              fontSize: 17,
              marginBottom: 25,
            }}
          >
            Verify Identity
          </Button>
        </div>

        <div style={{ textAlign: "center" }}>
          <Text
            style={{ color: "#C42E0A", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Text>
        </div>
      </Card>
    </div>
  );
}
