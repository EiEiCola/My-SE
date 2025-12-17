import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Typography,
  Select,
  DatePicker,
  Row,
  Col,
} from "antd";
import axios from "axios";

const { Title, Text } = Typography;

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  studentID: string;
  nationalID: string;
  dob: string;
  genderID: string;
}

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    username: "",
    studentID: "",
    nationalID: "",
    dob: "",
    genderID: "",
  });

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await axios.post("http://localhost:8080/auth/register", {
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
        username: form.username,
        student_id: form.studentID,
        national_id: form.nationalID,
        dob: form.dob,
        gender_id: form.genderID,
        role_id: 2,
        active_status_id: 1,
      });

      navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <>
      <div
        className="register-page"
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
            width: 1100,
            borderRadius: 24,
            padding: "50px 60px",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* HEADER */}
          <Title
            level={2}
            style={{
              textAlign: "left",
              color: "#C42E0A",
              marginBottom: 5,
              fontWeight: 700,
            }}
          >
            Welcome to SUT Community!
          </Title>

          <Text
            style={{
              display: "block",
              textAlign: "left",
              color: "#6D6D6D",
              marginBottom: 40,
              fontWeight: 600,
              fontSize: 17,
            }}
          >
            Register your account
          </Text>

          {/* ACCOUNT INFORMATION */}
          <Text style={{ fontWeight: 700, color: "#C42E0A" }}>
            Account Information
          </Text>

          <Row gutter={30} style={{ marginTop: 10, marginBottom: 25 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Email</Text>
              <Input
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Student ID</Text>
              <Input
                size="large"
                placeholder="Ex. B6639990"   // ← คงไว้
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) => handleChange("studentID", e.target.value)}
              />
            </Col>
          </Row>

          <Row gutter={30} style={{ marginBottom: 40 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Password</Text>
              <Input.Password
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Confirm Password</Text>
              <Input.Password
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
              />
            </Col>
          </Row>

          {/* PERSONAL INFORMATION */}
          <Text style={{ fontWeight: 700, color: "#C42E0A" }}>
            Personal Information
          </Text>

          <Row gutter={30} style={{ marginTop: 10 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>First Name</Text>
              <Input
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Last Name</Text>
              <Input
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </Col>
          </Row>

          <Row gutter={30} style={{ marginTop: 20 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Username</Text>
              <Input
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) => handleChange("username", e.target.value)}
              />
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>National ID</Text>
              <Input
                size="large"
                placeholder="Enter 13-digit national ID"   // ← คงไว้
                style={{ height: 46, borderRadius: 10 }}
                onChange={(e) => handleChange("nationalID", e.target.value)}
              />
            </Col>
          </Row>

          <Row gutter={30} style={{ marginTop: 20, marginBottom: 40 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Date of Birth</Text>
              <DatePicker
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ width: "100%", height: 46, borderRadius: 10 }}
                onChange={(_, dateString) =>
                  handleChange(
                    "dob",
                    Array.isArray(dateString) ? dateString[0] ?? "" : dateString
                  )
                }
              />
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Gender</Text>
              <Select
                size="large"
                placeholder=""   // ← ลบ placeholder
                style={{ width: "100%", height: 46 }}
                onChange={(value) => handleChange("genderID", String(value))}
              >
                <Select.Option value={1}>Male</Select.Option>
                <Select.Option value={2}>Female</Select.Option>
                <Select.Option value={3}>Other</Select.Option>
              </Select>
            </Col>
          </Row>

          {/* REGISTER BUTTON */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              type="primary"
              size="large"
              style={{
                backgroundColor: "#C42E0A",
                borderRadius: 10,
                width: 120,
                height: 40,
                fontWeight: 700,
                fontSize: 16,
              }}
              onClick={handleRegister}
            >
              Register
            </Button>
          </div>

          {/* LOGIN LINK */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Text style={{ fontWeight: 500, color: "#6D6D6D" }}>
              Already have an account ?{" "}
              <span
                style={{ color: "#C42E0A", cursor: "pointer", fontWeight: 600 }}
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </Text>
          </div>
        </Card>
      </div>
    </>
  );
}

export default Register;
