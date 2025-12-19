import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Input, Button, Typography, Space } from "antd";
import axios from "axios";

const { Title, Text } = Typography;

// ✅ base64url-safe JWT payload decode
const parseJwtPayload = (token: string) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + (4 - (base64.length % 4)) % 4,
    "="
  );
  return JSON.parse(atob(padded));
};

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", {
        identifier, // ✅ ส่งตัวเดียวพอ (gmail หรือ student id)
        password,
      });

      const token = res.data?.data?.token;
      if (!token) {
        alert("Login สำเร็จแต่ไม่พบ token");
        return;
      }

      localStorage.setItem("token", token);

      // ✅ decode role จาก token ที่เพิ่งได้ทันที
      const payload = parseJwtPayload(token);
      console.log("JWT payload:", payload);

      if (payload?.role === "admin") {
        window.location.href = "/Admin";
        return;
      }

      window.location.href = "/User";
    } catch (err: any) {
      console.error("Login error:", err);
      alert(err?.response?.data?.message || "Invalid login");
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
          Welcome to SUT Community!
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
          Login to your account
        </Text>

        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>
            Email or Student ID
          </Text>
          <Input
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

        <Space direction="vertical" style={{ width: "100%", marginBottom: 10 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>Password</Text>

          <Input.Password
            size="large"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              borderRadius: 10,
              height: 46,
              fontWeight: 600,
            }}
            className="custom-password"
          />
        </Space>

        <div
          style={{
            width: "100%",
            textAlign: "right",
            marginBottom: 25,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              color: "#8E8E93",
              cursor: "pointer",
              transition: "0.2s",
            }}
            onClick={() => navigate("/forgot-password")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C42E0A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8E8E93")}
          >
            Forgot password ?
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleLogin}
            style={{
              backgroundColor: "#C42E0A",
              borderRadius: 10,
              height: 40,
              width: 110,
              fontWeight: 800,
              fontSize: 17,
              marginBottom: 25,
            }}
          >
            LOGIN
          </Button>
        </div>

        <div style={{ textAlign: "center" }}>
          <Text style={{ fontWeight: 600, color: "#8E8E93" }}>
            Don’t have an account ?{" "}
            <span
              style={{
                color: "#C42E0A",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 16,
                transition: "0.2s",
              }}
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </Text>
        </div>

        <style>
          {`
            .custom-password input { font-weight: 600 !important; }
            .custom-password input::placeholder { font-weight: 600 !important; opacity: 0.8; }
          `}
        </style>
      </Card>
    </div>
  );
}

export default Login;
