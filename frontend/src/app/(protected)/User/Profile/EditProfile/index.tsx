import React, { useState } from "react";
import {
  Card,
  Typography,
  Input,
  Select,
  DatePicker,
  Button,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const { Title } = Typography;
const { TextArea } = Input;

function EditProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    studentID: "",
    username: "",
    firstName: "",
    lastName: "",
    nationalID: "",
    gender: "",
    dob: "",
    bio: "",
    avatar: "",
  });

  const handleChange = (key: string, value: any) => {
    setForm({ ...form, [key]: value });
  };

  const handleSave = () => {
    console.log("FORM SUBMIT:", form);
  };

  return (
    <main
      style={{
        flex: 1,
        padding: "40px",
        overflowY: "auto",
        backgroundColor: "#fff5ed",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <Card
          style={{
            borderRadius: 28,
            padding: "35px 50px",
            background: "#FFFFFF",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          {/* ⭐ BACK BUTTON */}
          <div style={{ marginBottom: 15 }}>
            <Button
              onClick={() => navigate("/User/Profile/post")}
              style={{
                borderRadius: 8,
                background: "#9c2510",
                color: "white",
                border: "none",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                height: 32,
              }}
            >
              <ArrowBackIcon style={{ fontSize: 20, color: "white" }} />
              Back
            </Button>
          </div>

          {/* TITLE */}
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              color: "#C42E0A",
              marginBottom: 30,
            }}
          >
            Edit Profile
          </Title>

          {/* PROFILE IMAGE */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "#C42E0A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    color: "white",
                    fontSize: 40,
                    fontWeight: 700,
                  }}
                >
                  {form.username ? form.username[0]?.toUpperCase() : "C"}
                </span>
              )}
            </div>

            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = () => handleChange("avatar", reader.result);
                reader.readAsDataURL(file);
                return false;
              }}
            >
              <Button
                icon={<UploadOutlined />}
                style={{ marginTop: 10, borderRadius: 8 }}
              >
                Change Photo
              </Button>
            </Upload>
          </div>

          {/* FORM GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 25,
            }}
          >
            {/* ⬅️ LEFT COLUMN: Email, National ID, First Name, Bio */}
            <div>
              {/* แถว 1: Email */}
              <label>Email</label>
              <Input
                value={form.email}
                disabled
                style={{ marginTop: 5, background: "#f5f5f5" }}
              />

              {/* แถว 2: National ID */}
              <label style={{ marginTop: 20, display: "block" }}>
                National ID
              </label>
              <Input
                value={form.nationalID}
                disabled
                style={{ marginTop: 5, background: "#f5f5f5" }}
              />

              {/* แถว 3: First Name */}
              <label style={{ marginTop: 20, display: "block" }}>
                First Name
              </label>
              <Input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                style={{ marginTop: 5 }}
              />

              {/* Bio */}
              <label style={{ marginTop: 20, display: "block" }}>Bio</label>
              <TextArea
                rows={5}
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                style={{ marginTop: 5 }}
              />
            </div>

            {/* ➡️ RIGHT COLUMN: Student ID, Username, Last Name, DOB, Gender */}
            <div>
              {/* แถว 1: Student ID */}
              <label>Student ID</label>
              <Input
                value={form.studentID}
                disabled
                style={{ marginTop: 5, background: "#f5f5f5" }}
              />

              {/* แถว 2: Username */}
              <label style={{ marginTop: 20, display: "block" }}>
                Username
              </label>
              <Input
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                style={{ marginTop: 5 }}
              />

              {/* แถว 3: Last Name */}
              <label style={{ marginTop: 20, display: "block" }}>
                Last Name
              </label>
              <Input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                style={{ marginTop: 5 }}
              />

              {/* Date of Birth */}
              <label style={{ marginTop: 20, display: "block" }}>
                Date of Birth
              </label>
              <DatePicker
                style={{ width: "100%", marginTop: 5 }}
                value={form.dob ? dayjs(form.dob, "YYYY-MM-DD") : undefined}
                onChange={(date, dateString) => handleChange("dob", dateString)}
              />

              {/* Gender */}
              <label style={{ marginTop: 20, display: "block" }}>Gender</label>
              <Select
                value={form.gender}
                onChange={(value) => handleChange("gender", value)}
                style={{ width: "100%", marginTop: 5 }}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 40 }}
          >
            <Button
              type="primary"
              style={{
                backgroundColor: "#9c2510",
                borderRadius: 10,
                padding: "0 20px",
                height: 35,
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
              onClick={handleSave}
            >
              <CheckIcon style={{ color: "white", fontSize: 18 }} />
              SAVE
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default EditProfile;
