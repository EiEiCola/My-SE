import React, { useMemo, useState } from "react";
import { Card, Input, Button, Typography, Space, message, Alert } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ ใช้ resetToken แทน memberID (ปลอดภัยกว่า)
  const resetToken = useMemo(
    () => location.state?.resetToken as string | undefined,
    [location.state]
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ✅ state สำหรับแจ้งเตือนบนหน้า UI
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // ✅ หน่วงให้เห็นแจ้งเตือนก่อนเด้งไปหน้า login
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
            marginBottom: 20,
            fontWeight: 700,
          }}
        >
          Create New Password
        </Title>

        {/* ✅ SUCCESS ALERT */}
        {uiSuccess && (
          <div style={{ marginBottom: 20 }}>
            <Alert
              type="success"
              showIcon
              message="Success"
              description={uiSuccess}
            />
          </div>
        )}

        {/* ✅ ERROR ALERT */}
        {uiError && (
          <div style={{ marginBottom: 20 }}>
            <Alert
              type="error"
              showIcon
              message="Reset failed"
              description={uiError}
              closable
              onClose={() => setUiError(null)}
            />
          </div>
        )}

        {/* NEW PASSWORD */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>New Password</Text>
          <Input.Password
            placeholder="Enter new password"
            size="large"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (uiError) setUiError(null);
            }}
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
            onChange={(e) => {
              setConfirm(e.target.value);
              if (uiError) setUiError(null);
            }}
            style={{ borderRadius: 10, height: 46, fontWeight: 600 }}
          />
        </Space>

        {/* BUTTON */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleReset}
            loading={loading}
            disabled={!!uiSuccess}
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
