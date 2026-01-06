import React from "react";
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
} from "antd";
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

  const setFieldError = (name: keyof RegisterValues, msg: string) => {
    form.setFields([{ name, errors: [msg] }]);
    form.scrollToField(name, { behavior: "smooth", block: "center" });
  };

  // ✅ แปลง error ดิบจาก DB ให้เป็นข้อความสวย ๆ เหมือน email
  const handleBackendError = (data: any) => {
    const rawMsg =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
        ? data.error
        : "";

    const msg = rawMsg.toLowerCase();

    // ✅ ถ้า backend ส่งแบบ { field, message } (รองรับไว้ด้วย)
    if (typeof data?.field === "string" && typeof data?.message === "string") {
      const f = data.field.toLowerCase();
      if (f === "email") {
        return setFieldError("email", "This email has already been registered");
      }
      if (f === "student_id" || f === "studentid") {
        return setFieldError(
          "studentID",
          "This student ID has already been registered"
        );
      }
      if (f === "username") {
        return setFieldError("username", "This username is already taken");
      }
      if (f === "national_id" || f === "nationalid") {
        return setFieldError(
          "nationalID",
          "This national ID has already been registered"
        );
      }
    }

    // ----------------------------------------------------------
    // ✅ DB raw error mapping (จับจากชื่อ unique index/constraint)
    // ให้แยกชัด ๆ แบบนี้ จะ “แม่น” และไม่หลุดไป field อื่น
    // ----------------------------------------------------------

    // student_id unique index
    if (
      msg.includes("idx_members_student_id") ||
      msg.includes("members_student_id") ||
      msg.includes("student_id") ||
      msg.includes("student id")
    ) {
      return setFieldError(
        "studentID",
        "This student ID has already been registered"
      );
    }

    // national_id unique index
    if (
      msg.includes("idx_members_national_id") ||
      msg.includes("members_national_id") ||
      msg.includes("national_id") ||
      msg.includes("national id")
    ) {
      return setFieldError(
        "nationalID",
        "This national ID has already been registered"
      );
    }

    // username unique index (ถ้าคุณตั้ง unique ไว้)
    if (
      msg.includes("idx_members_username") ||
      msg.includes("members_username") ||
      msg.includes("username")
    ) {
      return setFieldError("username", "This username is already taken");
    }

    // email unique index (ถ้าคุณตั้ง unique ไว้ใน member_accounts)
    if (
      msg.includes("idx_member_accounts_email") ||
      msg.includes("member_accounts_email") ||
      msg.includes("email") ||
      msg.includes("mail")
    ) {
      return setFieldError("email", "This email has already been registered");
    }

    // fallback
    message.error("Registration failed. Please try again.");
  };

  const handleRegister = async (values: RegisterValues) => {
    try {
      await axios.post("http://localhost:8080/api/auth/register", {
        email: values.email,
        password: values.password,
        first_name: values.firstName,
        last_name: values.lastName,
        username: values.username,
        student_id: values.studentID,
        national_id: values.nationalID,
        dob: values.dob.format("YYYY-MM-DD"),
        gender_id: Number(values.genderID),
        role_id: 2,
        active_status_id: 1,
      });

      message.success("Registration successful");
      navigate("/login");
    } catch (err: any) {
      console.log("REGISTER ERROR data:", err?.response?.data);
      handleBackendError(err?.response?.data);
    }
  };

  return (
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

        <Form
          form={form}
          onFinish={handleRegister}
          layout="vertical"
          requiredMark={false}
          validateTrigger={["onBlur", "onChange"]}
        >
          <Text style={{ fontWeight: 700, color: "#C42E0A" }}>
            Account Information
          </Text>

          <Row gutter={30} style={{ marginTop: 10, marginBottom: 25 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Email</Text>

              <Form.Item
                name="email"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Invalid email format" },
                ]}
              >
                <Input
                  size="large"
                  style={{ height: 46, borderRadius: 10 }}
                  onChange={(e) => {
                    form.setFields([{ name: "email", errors: [] }]);
                    form.setFieldValue("email", e.target.value);
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Student ID</Text>

              <Form.Item
                name="studentID"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please enter your student ID" },
                  {
                    pattern: /^[A-Za-z]\d{7}$/,
                    message: "Student ID format example: B6639990",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Ex. B6639990"
                  style={{ height: 46, borderRadius: 10 }}
                  onChange={(e) => {
                    form.setFields([{ name: "studentID", errors: [] }]);
                    form.setFieldValue("studentID", e.target.value);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={30} style={{ marginBottom: 40 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Password</Text>

              <Form.Item
                name="password"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please enter password" },
                  { min: 8, message: "Password must be at least 8 characters" },
                ]}
              >
                <Input.Password
                  size="large"
                  style={{ height: 46, borderRadius: 10 }}
                  onChange={(e) =>
                    form.setFieldValue("password", e.target.value)
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Confirm Password</Text>

              <Form.Item
                name="confirmPassword"
                style={{ marginBottom: 0 }}
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const pw = getFieldValue("password");
                      if (!value || value === pw) return Promise.resolve();
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  style={{ height: 46, borderRadius: 10 }}
                  onChange={(e) =>
                    form.setFieldValue("confirmPassword", e.target.value)
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Text style={{ fontWeight: 700, color: "#C42E0A" }}>
            Personal Information
          </Text>

          <Row gutter={30} style={{ marginTop: 10 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>First Name</Text>

              <Form.Item
                name="firstName"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please enter your first name" },
                  { whitespace: true, message: "First name cannot be empty" },
                ]}
              >
                <Input
                  size="large"
                  style={{ height: 46, borderRadius: 10 }}
                  onChange={(e) =>
                    form.setFieldValue("firstName", e.target.value)
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Last Name</Text>

              <Form.Item
                name="lastName"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please enter your last name" },
                  { whitespace: true, message: "Last name cannot be empty" },
                ]}
              >
                <Input
                  size="large"
                  style={{ height: 46, borderRadius: 10 }}
                  onChange={(e) =>
                    form.setFieldValue("lastName", e.target.value)
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={30} style={{ marginTop: 20 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Username</Text>

              <Form.Item
                name="username"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please enter your username" },
                  { whitespace: true, message: "Username cannot be empty" },
                  { min: 3, message: "Username must be at least 3 characters" },
                ]}
              >
                <Input
                  size="large"
                  style={{ height: 46, borderRadius: 10 }}
                  onChange={(e) => {
                    form.setFields([{ name: "username", errors: [] }]);
                    form.setFieldValue("username", e.target.value);
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>National ID</Text>

              <Form.Item
                name="nationalID"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please enter national ID" },
                  {
                    pattern: /^\d{13}$/,
                    message: "National ID must be 13 digits",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter 13-digit national ID"
                  style={{ height: 46, borderRadius: 10 }}
                  maxLength={13}
                  inputMode="numeric"
                  onChange={(e) => {
                    form.setFields([{ name: "nationalID", errors: [] }]);
                    form.setFieldValue("nationalID", e.target.value);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={30} style={{ marginTop: 20, marginBottom: 40 }}>
            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Date of Birth</Text>

              <Form.Item
                name="dob"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "Please select date of birth" },
                ]}
              >
                <DatePicker
  id="dob"
  data-testid="dob-picker"
  popupClassName="dob-picker-popup"
  format="YYYY-MM-DD"
  size="large"
  style={{ width: "100%", height: 46, borderRadius: 10 }}
  disabledDate={(current) =>
    !!current && current.isAfter(dayjs().endOf("day"))
  }
  onChange={(d) => form.setFieldValue("dob", d as Dayjs)}
/>

              </Form.Item>
            </Col>

            <Col span={12}>
              <Text style={{ fontWeight: 600 }}>Gender</Text>

              <Form.Item
                name="genderID"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: "Please select gender" }]}
              >
                <Select
                  id="genderID"
                  data-testid="gender-select"
                  popupClassName="gender-select-popup"
                  size="large"
                  style={{ width: "100%", height: 46 }}
                  onChange={(value) => form.setFieldValue("genderID", value)}
                >
                  <Select.Option value={1}>Male</Select.Option>
                  <Select.Option value={2}>Female</Select.Option>
                  <Select.Option value={3}>Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
              htmlType="submit"
            >
              Register
            </Button>
          </div>

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
        </Form>
      </Card>
    </div>
  );
}

export default Register;
