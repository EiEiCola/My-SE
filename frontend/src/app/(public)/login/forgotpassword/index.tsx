import React, { useMemo, useState } from "react";
import { Card, Input, Button, Typography, Space, message, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, IdcardOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [nationalID, setNationalID] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isNationalIdValid = useMemo(
    () => /^\d{13}$/.test(nationalID.trim()),
    [nationalID]
  );

  const handleVerify = async () => {
    setUiError(null);

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

      const res = await axios.post("/api/auth/verify-reset", {
        identifier: identifier.trim(),
        national_id: nationalID.trim(),
      });

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

      setUiError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
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
            🔐
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
            Reset Your Password
          </Title>

          <Text
            style={{
              display: "block",
              color: "#666",
              fontSize: 15,
              fontWeight: 400,
            }}
          >
            Verify your identity to reset password
          </Text>
        </div>

        {/* Error Alert */}
        {uiError && (
          <div style={{ marginBottom: 24 }}>
            <Alert
              type="error"
              showIcon
              message="Verification Failed"
              description={uiError}
              closable
              onClose={() => setUiError(null)}
              style={{
                borderRadius: 12,
                border: "2px solid #ffccc7",
              }}
            />
          </div>
        )}

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
            onChange={(e) => {
              setIdentifier(e.target.value);
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

        {/* National ID Input */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 30 }}>
          <Text style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
            National ID Number
          </Text>
          <Input
            size="large"
            prefix={<IdcardOutlined style={{ color: "#999" }} />}
            placeholder="Enter your 13-digit national ID"
            value={nationalID}
            maxLength={13}
            inputMode="numeric"
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/\D/g, "");
              setNationalID(onlyDigits);
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
          {nationalID && !isNationalIdValid && (
            <Text style={{ color: "#ff4d4f", fontSize: 12 }}>
              National ID must be exactly 13 digits
            </Text>
          )}
        </Space>

        {/* Verify Button */}
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={handleVerify}
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
            marginBottom: 30,
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
          Verify Identity
        </Button>

        {/* Back to Login */}
        <div
          style={{
            textAlign: "center",
            paddingTop: 25,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <span
            style={{
              color: "#d94a1f",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              transition: "color 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={() => navigate("/login")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6b35")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#d94a1f")}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} />
            Back to Login
          </span>
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

          .ant-alert-error {
            animation: shake 0.5s ease;
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}
      </style>
    </div>
  );
}