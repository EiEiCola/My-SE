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

// ⭐ NEW ICON
import CheckIcon from '@mui/icons-material/Check';

const { Title } = Typography;
const { TextArea } = Input;

function EditProfile() {
  const [form, setForm] = useState({
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
        backgroundColor: "#FFF5ED",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <Card
          style={{
            borderRadius: 28,
            padding: "45px 60px",
            background: "#FFFFFF",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          {/* TITLE */}
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              color: "#C42E0A",
              marginBottom: 25,
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
                border: "4px solid #FFE1D4",
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
                reader.onload = () => {
                  handleChange("avatar", reader.result);
                };
                reader.readAsDataURL(file);
                return false;
              }}
            >
              <Button
                icon={<UploadOutlined />}
                style={{
                  marginTop: 10,
                  borderRadius: 8,
                }}
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
            {/* LEFT */}
            <div>
              <label>Student ID</label>
              <Input
                value={form.studentID}
                onChange={(e) => handleChange("studentID", e.target.value)}
                style={{ marginTop: 5 }}
              />

              <label style={{ marginTop: 20, display: "block" }}>First Name</label>
              <Input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                style={{ marginTop: 5 }}
              />

              <label style={{ marginTop: 20, display: "block" }}>National ID</label>
              <Input
                value={form.nationalID}
                onChange={(e) => handleChange("nationalID", e.target.value)}
                style={{ marginTop: 5 }}
              />

              <label style={{ marginTop: 20, display: "block" }}>Bio</label>
              <TextArea
                rows={4}
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                style={{ marginTop: 5 }}
              />
            </div>

            {/* RIGHT */}
            <div>
              <label>Username</label>
              <Input
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                style={{ marginTop: 5 }}
              />

              <label style={{ marginTop: 20, display: "block" }}>Last Name</label>
              <Input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                style={{ marginTop: 5 }}
              />

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

              <label style={{ marginTop: 20, display: "block" }}>Date of Birth</label>
              <DatePicker
                style={{ width: "100%", marginTop: 5 }}
                value={form.dob ? dayjs(form.dob, "YYYY-MM-DD") : undefined}
                onChange={(date, dateString) => handleChange("dob", dateString)}
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
            <Button
              type="primary"
              style={{
                backgroundColor: "#c42e0a",
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
