import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Input, Button, Typography, Space } from "antd";
import axios from "axios";

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8080/auth/login", {
        identifier,
        password,
      });

      const role = res.data.member_account.role_id;

      if (role === 1) navigate("/admin/dashboard");
      else navigate("/user/home");
    } catch (err) {
      alert("Invalid login");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFE9D5",
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
        {/* HEADER */}
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
            fontSize: 17
          }}
        >
          Login to your account
        </Text>

        {/* EMAIL / STUDENT ID */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 25 }}>
          <Text style={{ fontWeight: 600 , fontSize: 15}} >Email or Student ID</Text>
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

        {/* PASSWORD */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 10 }}>
          <Text style={{ fontWeight: 600 , fontSize: 15 }}>Password</Text>

          <Input.Password
            placeholder="Enter your password"
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

        {/* FORGOT PASSWORD */}
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
            }}
            onClick={() => navigate("/forgot-password")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C42E0A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6D6D6D")}
          >
            Forgot password ?
          </span>
        </div>

        {/* LOGIN BUTTON — NOT FULL WIDTH */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleLogin}
            style={{
              backgroundColor: "#C42E0A",
              borderRadius: 10,
              height: 45,
              width: 150,
              fontWeight: 800,
              fontSize: 17,
              marginBottom: 25,
            }}
          >
            LOGIN
          </Button>
        </div>

        {/* REGISTER LINK */}
        <div style={{ textAlign: "center", marginTop: 0 }}>
          <Text style={{ fontWeight: 600 , color: "#8E8E93"}}>
            Don’t have an account ?{" "}
            <span
              style={{
                color: "#C42E0A",
                cursor: "pointer",
                fontWeight: 450,
                fontSize: 16
              }}
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </Text>
        </div>

        {/* INLINE CSS FOR PASSWORD INPUT */}
        <style>
          {`
            .custom-password input {
              font-weight: 600 !important;
            }

            .custom-password input::placeholder {
              font-weight: 600 !important;
              opacity: 0.8;
            }
          `}
        </style>
      </Card>
    </div>
  );
}

export default Login;
