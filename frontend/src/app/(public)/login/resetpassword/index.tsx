import React, { useMemo, useState } from "react";
import { Card, Input, Button, Typography, Space, message, Alert } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { LockOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = useMemo(
    () => location.state?.resetToken as string | undefined,
    [location.state]
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    if (password.length === 0) return null;
    if (password.length < 8) return { level: "weak", color: "#ff4d4f", text: "Weak" };
    if (password.length < 12) return { level: "medium", color: "#faad14", text: "Medium" };
    return { level: "strong", color: "#52c41a", text: "Strong" };
  }, [password]);

  const handleReset = async () => {
    setUiError(null);
    setUiSuccess(null);

    if (!resetToken) {
      const msg = "Reset token missing. Please verify again.";
      setUiError(msg);
      return message.error(msg);
    }

    if (password.length < 8) {
      const msg = "Password must be at least 8 characters";
      setUiError(msg);
      return message.error(msg);
    }

    if (password !== confirm) {
      const msg = "Passwords do not match!";
      setUiError(msg);
      return message.error(msg);
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:8080/api/auth/reset-password", {
        reset_token: resetToken,
        new_password: password,
      });

      const successMsg = "Password reset successfully! Redirecting to login...";
      setUiSuccess(successMsg);
      message.success("Password reset successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Reset failed.";
      setUiError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleReset();
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
          maxWidth: 520,
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
            🔑
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
            Create New Password
          </Title>

          <Text
            style={{
              display: "block",
              color: "#666",
              fontSize: 15,
              fontWeight: 400,
            }}
          >
            Enter a strong password to secure your account
          </Text>
        </div>

        {/* Success Alert */}
        {uiSuccess && (
          <div style={{ marginBottom: 24 }}>
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="Password Reset Successful!"
              description={uiSuccess}
              style={{
                borderRadius: 12,
                border: "2px solid #b7eb8f",
                animation: "bounce 0.6s ease",
              }}
            />
          </div>
        )}

        {/* Error Alert */}
        {uiError && (
          <div style={{ marginBottom: 24 }}>
            <Alert
              type="error"
              showIcon
              message="Reset Failed"
              description={uiError}
              closable
              onClose={() => setUiError(null)}
              style={{
                borderRadius: 12,
                border: "2px solid #ffccc7",
                animation: "shake 0.5s ease",
              }}
            />
          </div>
        )}

        {/* New Password Input */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 20 }}>
          <Text style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
            New Password
          </Text>
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: "#999" }} />}
            placeholder="Enter new password (min. 8 characters)"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (uiError) setUiError(null);
            }}
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
          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  background: "#f0f0f0",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width:
                      passwordStrength.level === "weak"
                        ? "33%"
                        : passwordStrength.level === "medium"
                        ? "66%"
                        : "100%",
                    height: "100%",
                    background: passwordStrength.color,
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
              <Text style={{ fontSize: 12, color: passwordStrength.color, fontWeight: 600 }}>
                {passwordStrength.text}
              </Text>
            </div>
          )}
        </Space>

        {/* Confirm Password Input */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 30 }}>
          <Text style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
            Confirm Password
          </Text>
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: "#999" }} />}
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (uiError) setUiError(null);
            }}
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
          {/* Match Indicator */}
          {confirm && (
            <Text
              style={{
                fontSize: 12,
                color: password === confirm ? "#52c41a" : "#ff4d4f",
                fontWeight: 500,
              }}
            >
              {password === confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
            </Text>
          )}
        </Space>

        {/* Reset Button */}
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={!!uiSuccess}
          onClick={handleReset}
          style={{
            width: "100%",
            height: 50,
            borderRadius: 12,
            background: uiSuccess
              ? "#52c41a"
              : "linear-gradient(135deg, #d94a1f 0%, #b83b15 100%)",
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 8px 20px rgba(217, 74, 31, 0.3)",
            transition: "all 0.3s ease",
            cursor: uiSuccess ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!uiSuccess) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(217, 74, 31, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!uiSuccess) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(217, 74, 31, 0.3)";
            }
          }}
        >
          {uiSuccess ? "Success!" : "Reset Password"}
        </Button>

        {/* Password Requirements */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "#f8f9fa",
            borderRadius: 12,
            border: "1px solid #e8e8e8",
          }}
        >
          <Text style={{ fontSize: 12, color: "#666", fontWeight: 600, display: "block", marginBottom: 8 }}>
            Password Requirements:
          </Text>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#666" }}>
            <li>At least 8 characters long</li>
            <li>Mix of letters, numbers, and symbols recommended</li>
          </ul>
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

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }

          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }

          .ant-input-affix-wrapper:focus,
          .ant-input-affix-wrapper-focused {
            border-color: #d94a1f !important;
            box-shadow: 0 0 0 4px rgba(217, 74, 31, 0.1) !important;
          }
        `}
      </style>
    </div>
  );
}