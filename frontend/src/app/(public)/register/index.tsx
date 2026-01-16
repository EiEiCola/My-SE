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
  Form,
  message,
  Steps,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;

type RegisterValues = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  studentID: string;
  nationalID: string;
  dob: Dayjs;
  genderID: number;
};

function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm<RegisterValues>();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<any>(null); // เก็บข้อมูล Step 1

  const setFieldError = (name: keyof RegisterValues, msg: string) => {
    form.setFields([{ name, errors: [msg] }]);
    form.scrollToField(name, { behavior: "smooth", block: "center" });
  };

  const handleBackendError = (data: any) => {
    const rawMsg =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : "";

    const msg = rawMsg.toLowerCase();

    if (typeof data?.field === "string" && typeof data?.message === "string") {
      const f = data.field.toLowerCase();
      if (f === "email") {
        setCurrentStep(0);
        return setFieldError("email", "This email has already been registered");
      }
      if (f === "student_id" || f === "studentid") {
        setCurrentStep(0);
        return setFieldError(
          "studentID",
          "This student ID has already been registered"
        );
      }
      if (f === "username") {
        setCurrentStep(1);
        return setFieldError("username", "This username is already taken");
      }
      if (f === "national_id" || f === "nationalid") {
        setCurrentStep(1);
        return setFieldError(
          "nationalID",
          "This national ID has already been registered"
        );
      }
    }

    if (
      msg.includes("idx_members_student_id") ||
      msg.includes("members_student_id") ||
      msg.includes("student_id") ||
      msg.includes("student id")
    ) {
      setCurrentStep(0);
      return setFieldError(
        "studentID",
        "This student ID has already been registered"
      );
    }

    if (
      msg.includes("idx_members_national_id") ||
      msg.includes("members_national_id") ||
      msg.includes("national_id") ||
      msg.includes("national id")
    ) {
      setCurrentStep(1);
      return setFieldError(
        "nationalID",
        "This national ID has already been registered"
      );
    }

    if (
      msg.includes("idx_members_username") ||
      msg.includes("members_username") ||
      msg.includes("username")
    ) {
      setCurrentStep(1);
      return setFieldError("username", "This username is already taken");
    }

    if (
      msg.includes("idx_member_accounts_email") ||
      msg.includes("member_accounts_email") ||
      msg.includes("email") ||
      msg.includes("mail")
    ) {
      setCurrentStep(0);
      return setFieldError("email", "This email has already been registered");
    }

    message.error("Registration failed. Please try again.");
  };

  const handleNext = async () => {
    try {
      await form.validateFields([
        "email",
        "studentID",
        "password",
        "confirmPassword",
      ]);

      // เก็บข้อมูล Step 1 ไว้
      const values = form.getFieldsValue([
        "email",
        "studentID",
        "password",
        "confirmPassword",
      ]);
      setStep1Data(values);
      console.log("Step 1 data saved:", values);

      setCurrentStep(1);
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  const handleBack = () => {
    setCurrentStep(0);
  };

  const handleRegister = async () => {
    // Validate only Step 2 fields
    try {
      await form.validateFields([
        "firstName",
        "lastName",
        "username",
        "nationalID",
        "dob",
        "genderID",
      ]);
    } catch (error) {
      console.log("Validation failed:", error);
      return;
    }

    // รวมข้อมูลจาก Step 1 และ Step 2
    const step2Values = form.getFieldsValue([
      "firstName",
      "lastName",
      "username",
      "nationalID",
      "dob",
      "genderID",
    ]);

    const allValues = { ...step1Data, ...step2Values };

    // Debug: ดูข้อมูลที่จะส่งไป
    const payload = {
      email: allValues.email,
      password: allValues.password,
      first_name: allValues.firstName,
      last_name: allValues.lastName,
      username: allValues.username,
      student_id: allValues.studentID,
      national_id: allValues.nationalID,
      dob: allValues.dob?.format("YYYY-MM-DD"),
      gender_id: Number(allValues.genderID),
      role_id: 2,
      active_status_id: 1,
    };

    console.log("=== REGISTER PAYLOAD ===");
    console.log("Step 1 Data:", step1Data);
    console.log("Step 2 Data:", step2Values);
    console.log("All Values:", allValues);
    console.log("Payload to send:", JSON.stringify(payload, null, 2));

    // เช็คว่ามี field ไหนเป็น undefined หรือ null
    (Object.keys(payload) as Array<keyof typeof payload>).forEach(key => {
      const value = payload[key];
      if (value === undefined || value === null || value === '') {
        console.warn(`⚠️ Field "${key}" is ${value}`);
      }
    });

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/register", payload);
      console.log("✅ Success:", response.data);
      message.success("Registration successful");
      navigate("/login");
    } catch (err: any) {
      console.log("=== ❌ REGISTER ERROR ===");
      console.log("Status:", err?.response?.status);
      console.log("Error Data:", JSON.stringify(err?.response?.data, null, 2));
      console.log("Full Error:", err?.response);
      handleBackendError(err?.response?.data);
    } finally {
      setLoading(false);
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
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "#d94a1f",
          opacity: 0.08,
          top: -200,
          right: -200,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "#ff6b35",
          opacity: 0.08,
          bottom: -150,
          left: -150,
          pointerEvents: "none",
        }}
      />

      <Card
        style={{
          width: "100%",
          maxWidth: 650,
          borderRadius: 24,
          padding: "50px 50px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
          border: "none",
          animation: "slideUp 0.6s ease",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
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
            📝
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
            Register your account
          </Text>
        </div>

        {/* Progress Steps */}
        <Steps
          current={currentStep}
          style={{ marginBottom: 40 }}
          items={[
            {
              title: "Account",
              icon: <div style={{ fontSize: 24 }}>🔐</div>,
            },
            {
              title: "Personal",
              icon: <div style={{ fontSize: 24 }}>👤</div>,
            },
          ]}
        />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          validateTrigger={["onBlur", "onChange"]}
        >
          {/* Step 1: Account Information */}
          {currentStep === 0 && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div
                style={{
                  marginBottom: 30,
                  padding: "15px 20px",
                  background: "linear-gradient(135deg, #fff 0%, #fff5e6 100%)",
                  borderRadius: 12,
                  border: "2px solid #ffe6cc",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 700, color: "#d94a1f" }}>
                  🔐 Account Information
                </Text>
                <br />
                <Text style={{ fontSize: 13, color: "#666" }}>
                  Setup your login credentials
                </Text>
              </div>

              <Form.Item
                name="email"
                label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Email</Text>}
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Invalid email format" },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: "#999" }} />}
                  placeholder="your.email@example.com"
                  size="large"
                  style={{
                    height: 50,
                    borderRadius: 12,
                    border: "2px solid #e8e8e8",
                    background: "#fafafa",
                  }}
                  onChange={(e) => {
                    form.setFields([{ name: "email", errors: [] }]);
                    form.setFieldValue("email", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="studentID"
                label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Student ID</Text>}
                rules={[
                  { required: true, message: "Please enter your student ID" },
                  {
                    pattern: /^[A-Za-z]\d{7}$/,
                    message: "Student ID format example: B6639990",
                  },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined style={{ color: "#999" }} />}
                  placeholder="Ex. B6639990"
                  size="large"
                  style={{
                    height: 50,
                    borderRadius: 12,
                    border: "2px solid #e8e8e8",
                    background: "#fafafa",
                  }}
                  onChange={(e) => {
                    form.setFields([{ name: "studentID", errors: [] }]);
                    form.setFieldValue("studentID", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Password</Text>}
                rules={[
                  { required: true, message: "Please enter password" },
                  { min: 8, message: "Password must be at least 8 characters" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#999" }} />}
                  placeholder="Minimum 8 characters"
                  size="large"
                  style={{
                    height: 50,
                    borderRadius: 12,
                    border: "2px solid #e8e8e8",
                    background: "#fafafa",
                  }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Confirm Password</Text>}
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#999" }} />}
                  placeholder="Re-enter your password"
                  size="large"
                  style={{
                    height: 50,
                    borderRadius: 12,
                    border: "2px solid #e8e8e8",
                    background: "#fafafa",
                  }}
                />
              </Form.Item>

              <Button
                type="primary"
                size="large"
                onClick={handleNext}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                style={{
                  width: "100%",
                  height: 50,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #d94a1f 0%, #b83b15 100%)",
                  border: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 8px 20px rgba(217, 74, 31, 0.3)",
                  marginTop: 10,
                }}
              >
                Next Step
              </Button>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 1 && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div
                style={{
                  marginBottom: 30,
                  padding: "15px 20px",
                  background: "linear-gradient(135deg, #fff 0%, #fff5e6 100%)",
                  borderRadius: 12,
                  border: "2px solid #ffe6cc",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 700, color: "#d94a1f" }}>
                  👤 Personal Information
                </Text>
                <br />
                <Text style={{ fontSize: 13, color: "#666" }}>
                  Tell us about yourself
                </Text>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label={<Text style={{ fontWeight: 600, fontSize: 14 }}>First Name</Text>}
                    rules={[
                      { required: true, message: "Please enter your first name" },
                      { whitespace: true, message: "First name cannot be empty" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: "#999" }} />}
                      placeholder="First name"
                      size="large"
                      style={{
                        height: 50,
                        borderRadius: 12,
                        border: "2px solid #e8e8e8",
                        background: "#fafafa",
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Last Name</Text>}
                    rules={[
                      { required: true, message: "Please enter your last name" },
                      { whitespace: true, message: "Last name cannot be empty" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: "#999" }} />}
                      placeholder="Last name"
                      size="large"
                      style={{
                        height: 50,
                        borderRadius: 12,
                        border: "2px solid #e8e8e8",
                        background: "#fafafa",
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="username"
                label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Username</Text>}
                rules={[
                  { required: true, message: "Please enter your username" },
                  { whitespace: true, message: "Username cannot be empty" },
                  { min: 3, message: "Username must be at least 3 characters" },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#999" }} />}
                  placeholder="Choose a unique username"
                  size="large"
                  style={{
                    height: 50,
                    borderRadius: 12,
                    border: "2px solid #e8e8e8",
                    background: "#fafafa",
                  }}
                  onChange={(e) => {
                    form.setFields([{ name: "username", errors: [] }]);
                    form.setFieldValue("username", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="nationalID"
                label={<Text style={{ fontWeight: 600, fontSize: 14 }}>National ID</Text>}
                rules={[
                  { required: true, message: "Please enter national ID" },
                  {
                    pattern: /^\d{13}$/,
                    message: "National ID must be 13 digits",
                  },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined style={{ color: "#999" }} />}
                  placeholder="Enter 13-digit national ID"
                  size="large"
                  maxLength={13}
                  inputMode="numeric"
                  style={{
                    height: 50,
                    borderRadius: 12,
                    border: "2px solid #e8e8e8",
                    background: "#fafafa",
                  }}
                  onChange={(e) => {
                    form.setFields([{ name: "nationalID", errors: [] }]);
                    form.setFieldValue("nationalID", e.target.value);
                  }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="dob"
                    label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Date of Birth</Text>}
                    rules={[{ required: true, message: "Please select date of birth" }]}
                  >
                    <DatePicker
                      suffixIcon={<CalendarOutlined style={{ color: "#999" }} />}
                      format="YYYY-MM-DD"
                      size="large"
                      placeholder="Select birth date"
                      style={{
                        width: "100%",
                        height: 50,
                        borderRadius: 12,
                        border: "2px solid #e8e8e8",
                        background: "#fafafa",
                      }}
                      disabledDate={(current) =>
                        !!current && current.isAfter(dayjs().endOf("day"))
                      }
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="genderID"
                    label={<Text style={{ fontWeight: 600, fontSize: 14 }}>Gender</Text>}
                    rules={[{ required: true, message: "Please select gender" }]}
                  >
                    <Select
                      placeholder="Select gender"
                      size="large"
                      style={{ width: "100%" }}
                    >
                      <Select.Option value={1}>👨 Male</Select.Option>
                      <Select.Option value={2}>👩 Female</Select.Option>
                      <Select.Option value={3}>🌈 Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 20 }}>
                <Col span={12}>
                  <Button
                    size="large"
                    onClick={handleBack}
                    icon={<ArrowLeftOutlined />}
                    style={{
                      width: "100%",
                      height: 50,
                      borderRadius: 12,
                      border: "2px solid #e8e8e8",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    Back
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleRegister}
                    loading={loading}
                    style={{
                      width: "100%",
                      height: 50,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #d94a1f 0%, #b83b15 100%)",
                      border: "none",
                      fontSize: 16,
                      fontWeight: 600,
                      boxShadow: "0 8px 20px rgba(217, 74, 31, 0.3)",
                    }}
                  >
                    Register
                  </Button>
                </Col>
              </Row>
            </div>
          )}
        </Form>

        {/* Login Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: 30,
            paddingTop: 25,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Text style={{ color: "#666", fontSize: 14 }}>
            Already have an account?{" "}
            <span
              style={{
                color: "#d94a1f",
                cursor: "pointer",
                fontWeight: 600,
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6b35")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#d94a1f")}
            >
              Login
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

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .ant-steps-item-finish .ant-steps-item-icon {
            background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%) !important;
            border-color: #52c41a !important;
          }

          .ant-steps-item-process .ant-steps-item-icon {
            background: linear-gradient(135deg, #d94a1f 0%, #b83b15 100%) !important;
            border-color: #d94a1f !important;
          }

          .ant-steps-item-wait .ant-steps-item-icon {
            background: #fafafa !important;
            border-color: #e8e8e8 !important;
          }

          .ant-steps-item-finish .ant-steps-item-title {
            color: #52c41a !important;
          }

          .ant-steps-item-process .ant-steps-item-title {
            color: #d94a1f !important;
            font-weight: 600 !important;
          }

          .ant-input-affix-wrapper:focus,
          .ant-input-affix-wrapper-focused,
          .ant-input:focus,
          .ant-picker:focus,
          .ant-picker-focused,
          .ant-select:focus .ant-select-selector,
          .ant-select-focused .ant-select-selector {
            border-color: #d94a1f !important;
            box-shadow: 0 0 0 4px rgba(217, 74, 31, 0.1) !important;
          }

          .ant-select-selector {
            height: 50px !important;
            border-radius: 12px !important;
            border: 2px solid #e8e8e8 !important;
            background: #fafafa !important;
            display: flex !important;
            align-items: center !important;
          }

          .ant-picker {
            border: 2px solid #e8e8e8 !important;
            background: #fafafa !important;
          }
        `}
      </style>
    </div>
  );
}

export default Register;