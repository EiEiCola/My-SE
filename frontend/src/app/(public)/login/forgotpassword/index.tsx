import React, { useMemo, useState } from "react";
import { Card, Input, Button, Typography, Space, message, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [nationalID, setNationalID] = useState("");

  // ✅ เพิ่ม state สำหรับแจ้งเตือนบนหน้า UI
  const [uiError, setUiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isNationalIdValid = useMemo(
    () => /^\d{13}$/.test(nationalID.trim()),
    [nationalID]
  );

  const handleVerify = async () => {
    // ✅ เคลียร์ error เดิมก่อนทุกครั้งที่กด
    setUiError(null);

    // basic validate
    if (!identifier.trim()) {
      const msg = "Please enter email or student ID";
      setUiError(msg);
      return message.error(msg);
    }

    if (!isNationalIdValid) {
      const msg = "National ID must be 13 digits";
      setUiError(msg);
      return message.error(msg);
    }

    try {
      setLoading(true);

      // ✅ แนะนำให้ใช้ /api/auth/... ให้สอดคล้องกับ register/login ของคุณ
      const res = await axios.post("http://localhost:8080/api/auth/verify-reset", {
        identifier: identifier.trim(),
        national_id: nationalID.trim(),
      });

      // ✅ รูปแบบ response ที่แนะนำ: { data: { reset_token: "..." } }
      const resetToken = res?.data?.data?.reset_token;

      if (!resetToken) {
        const msg = "Verification failed. Please try again.";
        setUiError(msg);
        message.error(msg);
        return;
      }

      message.success("Verified!");
      navigate("/reset-password", { state: { resetToken } });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Verification failed. Please check your information.";

      // ✅ แจ้งเตือนบนหน้า UI
      setUiError(msg);

      // ✅ ยังใช้ toast ได้เหมือนเดิม
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
            marginBottom: 24,
            fontWeight: 600,
            fontSize: 17,
          }}
        >
          Verify your identity to reset password
        </Text>

        {/* ✅ ALERT แสดงแจ้งเตือนบนหน้า UI เมื่อ verify ไม่ผ่าน */}
        {uiError && (
          <div style={{ marginBottom: 18 }}>
            <Alert
              type="error"
              showIcon
              message="Verification failed"
              description={uiError}
              closable
              onClose={() => setUiError(null)}
            />
          </div>
        )}

        {/* IDENTIFIER */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600, fontSize: 15 }}>
            Email or Student ID
          </Text>
          <Input
            placeholder="Enter your email or student ID"
            size="large"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (uiError) setUiError(null);
            }}
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
            inputMode="numeric"
            onChange={(e) => {
              // ✅ กันพิมพ์ตัวอักษรหลุด (optional)
              const onlyDigits = e.target.value.replace(/\D/g, "");
              setNationalID(onlyDigits);
              if (uiError) setUiError(null);
            }}
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
            loading={loading}
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
