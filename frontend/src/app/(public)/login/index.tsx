import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Input, Button, Typography, Space, Modal } from "antd";
import { UserOutlined, LockOutlined, LockFilled, CloseCircleFilled } from "@ant-design/icons";
import { motion } from "framer-motion";
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
  const [loading, setLoading] = useState(false);

  // ✅ Use Ant Design Modal
  const [modal, contextHolder] = Modal.useModal();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", {
        identifier,
        password,
      });

      const token = res.data?.data?.token;
      if (!token) {
        modal.error({
          title: "Login Failed",
          content: "Login สำเร็จแต่ไม่พบ token",
          centered: true,
        });
        return;
      }

      localStorage.setItem("token", token);

      const payload = parseJwtPayload(token);
      console.log("JWT payload:", payload);

      if (payload?.role === "admin") {
        window.location.href = "/Admin";
        return;
      }

      window.location.href = "/User";
    } catch (err: any) {
      console.error("Login error:", err);

      const msg = err?.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ";
      const isLocked = msg.toLowerCase().includes("locked") || msg.includes("ระงับ") || msg.includes("ล็อก");

      // ✨ Custom Beautiful Animated Modal (Red Theme)
      const instance = modal.error({
        title: null,
        icon: null,
        footer: null,
        centered: true,
        closable: true,
        maskClosable: true,
        width: 420,
        style: { padding: 0, borderRadius: 28, overflow: "hidden" },
        content: (
          <div style={{ position: "relative", overflow: "hidden", textAlign: "center", padding: "40px 25px" }}>
            {/* Background Glow */}
            <div
              style={{
                position: "absolute",
                top: -50,
                left: "50%",
                transform: "translateX(-50%)",
                width: 300,
                height: 300,
                background: "radial-gradient(circle, rgba(147,10,0,0.08) 0%, rgba(255,255,255,0) 70%)",
                pointerEvents: "none",
              }}
            />

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: "#fff1f0", // Light red bg
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 25px auto",
                position: "relative",
              }}
            >
              {/* Outer Ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "2px solid #930A00",
                  opacity: 0.1,
                }}
              />
              {/* Inner Circle */}
              <div
                style={{
                  width: 85,
                  height: 85,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #930A00 0%, #b51c10 100%)",
                  boxShadow: "0 10px 25px rgba(147, 10, 0, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                {isLocked ? (
                  <LockFilled style={{ fontSize: 42, color: "white" }} />
                ) : (
                  <CloseCircleFilled style={{ fontSize: 42, color: "white" }} />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Typography.Title
                level={3}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#930A00",
                  marginBottom: 8,
                }}
              >
                {isLocked ? "Access Denied" : "Login Failed"}
              </Typography.Title>
              <Typography.Text
                style={{
                  fontSize: 16,
                  color: "#930A00",
                  display: "block",
                  marginBottom: 30,
                  opacity: 0.8,
                  lineHeight: 1.5,
                }}
              >
                {msg}
              </Typography.Text>

              <Button
                type="primary"
                size="large"
                style={{
                  background: "#930A00",
                  borderColor: "#930A00",
                  borderRadius: 30,
                  padding: "0 45px",
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 6px 15px rgba(147, 10, 0, 0.25)",
                }}
                onClick={() => instance.destroy()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(147, 10, 0, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 15px rgba(147, 10, 0, 0.25)";
                }}
              >
                Try Again
              </Button>
            </motion.div>
          </div>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fff5e6 0%, #ffe6cc 50%, #ffd9b3 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {contextHolder}
      {/* Decorative shapes */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "#d94a1f",
          opacity: 0.08,
          top: -150,
          right: -150,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "#ff6b35",
          opacity: 0.08,
          bottom: -100,
          left: -100,
          pointerEvents: "none",
        }}
      />

      <Card
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 24,
          padding: "50px 45px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
          border: "none",
          animation: "slideUp 0.6s ease",
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #ff6b35 0%, #d94a1f 100%)",
              borderRadius: 20,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              boxShadow: "0 10px 25px rgba(217, 74, 31, 0.3)",
              fontSize: 40,
            }}
          >
            🎓
          </div>

          <Title
            level={2}
            style={{
              color: "#d94a1f",
              marginBottom: 8,
              fontWeight: 700,
              fontSize: 28,
            }}
          >
            Welcome to SUT Community!
          </Title>

          <Text
            style={{
              display: "block",
              color: "#666",
              fontSize: 15,
              fontWeight: 400,
            }}
          >
            Login to your account
          </Text>
        </div>

        {/* Email/Student ID Input */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
            Email or Student ID
          </Text>
          <Input
            size="large"
            prefix={<UserOutlined style={{ color: "#999" }} />}
            placeholder="Enter your email or student ID"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              borderRadius: 12,
              height: 50,
              fontSize: 15,
              border: "2px solid #e8e8e8",
              background: "#fafafa",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#d94a1f";
              e.target.style.background = "white";
              e.target.style.boxShadow = "0 0 0 4px rgba(217, 74, 31, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e8e8e8";
              e.target.style.background = "#fafafa";
              e.target.style.boxShadow = "none";
            }}
          />
        </Space>

        {/* Password Input */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 10 }}>
          <Text style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
            Password
          </Text>
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: "#999" }} />}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              borderRadius: 12,
              height: 50,
              fontSize: 15,
              border: "2px solid #e8e8e8",
              background: "#fafafa",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#d94a1f";
              e.currentTarget.style.background = "white";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(217, 74, 31, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e8e8e8";
              e.currentTarget.style.background = "#fafafa";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </Space>

        {/* Forgot Password */}
        <div
          style={{
            textAlign: "right",
            marginTop: 10,
            marginBottom: 30,
          }}
        >
          <span
            style={{
              color: "#d94a1f",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.3s ease",
            }}
            onClick={() => navigate("/forgot-password")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6b35")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#d94a1f")}
          >
            Forgot password?
          </span>
        </div>

        {/* Login Button */}
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={handleLogin}
          style={{
            width: "100%",
            height: 50,
            borderRadius: 12,
            background: "linear-gradient(135deg, #d94a1f 0%, #b83b15 100%)",
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 8px 20px rgba(217, 74, 31, 0.3)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(217, 74, 31, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(217, 74, 31, 0.3)";
          }}
        >
          Login
        </Button>

        {/* Register Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: 30,
            paddingTop: 25,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Text style={{ color: "#666", fontSize: 14 }}>
            Don't have an account?{" "}
            <span
              style={{
                color: "#d94a1f",
                cursor: "pointer",
                fontWeight: 600,
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/register")}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6b35")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#d94a1f")}
            >
              Register
            </span>
          </Text>
        </div>
      </Card>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .ant-input-affix-wrapper:focus,
          .ant-input-affix-wrapper-focused {
            border-color: #d94a1f !important;
            box-shadow: 0 0 0 4px rgba(217, 74, 31, 0.1) !important;
          }

          .ant-input-password-icon {
            color: #999 !important;
            transition: color 0.3s ease;
          }

          .ant-input-password-icon:hover {
            color: #d94a1f !important;
          }
        `}
      </style>
    </div>
  );
}

export default Login;