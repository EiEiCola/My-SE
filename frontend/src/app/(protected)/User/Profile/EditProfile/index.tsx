import React, { useState, useEffect } from "react";
import { Card, Typography, Input, Select, DatePicker, Button, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// ✅ use separated API (edit profile)
import { editProfileAPI } from "../../../../../services/http/edit_profile";

// ✅ decode user_id from JWT
import { getUserIdFromToken } from "../../../../../utils/jwt";

const { Title } = Typography;
const { TextArea } = Input;

const readOnlyStyle: React.CSSProperties = {
  marginTop: 5,
  background: "#f5f5f5",
  fontWeight: 500,
  fontSize: 14,
};

const editableStyle: React.CSSProperties = {
  marginTop: 5,
  fontWeight: 500,
  fontSize: 14,
};

function EditProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    studentID: "",
    username: "",
    firstName: "",
    lastName: "",
    nationalID: "",
    genderId: "" as string, // ✅ ใช้ string ใน UI ให้ชัวร์
    dob: "",
    bio: "",
    avatar: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ⭐ โหลดข้อมูลจาก backend มาเติมฟอร์ม (ใช้ token จริง)
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) {
      navigate("/login");
      return;
    }

    editProfileAPI
      .getMe()
      .then((res) => {
        const d = res.data;

        // ✅ บังคับ gender_id ให้เป็น string เพื่อ match options
        const gid =
          d.gender_id === null || d.gender_id === undefined
            ? ""
            : String(d.gender_id);

        setForm({
          email: d.email || "",
          studentID: d.student_id || "",
          username: d.username || "",
          firstName: d.first_name || "",
          lastName: d.last_name || "",
          nationalID: d.national_id || "",
          genderId: gid, // ✅ "1" | "2" | "3"
          dob: d.dob || "",
          bio: d.bio || "",
          avatar: d.member_picture || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load profile for editing:", err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
  }, [navigate]);

  const handleSave = async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) {
        navigate("/login");
        return;
      }

      if (!form.genderId) {
        alert("กรุณาเลือกเพศก่อนบันทึก");
        return;
      }

      setSaving(true);

      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        username: form.username,
        bio: form.bio,
        dob: form.dob,
        gender_id: Number(form.genderId), // ✅ แปลงเป็น number ตอนส่ง backend
        member_picture: form.avatar,
      };

      await editProfileAPI.updateMe(payload);

      alert("Profile updated!");
      navigate("/User/Profile/post");
    } catch (err: any) {
      console.error("Update profile error:", err?.response?.status, err?.response?.data);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const backendError =
        err?.response?.data?.error || "อัปเดตโปรไฟล์ไม่สำเร็จ ลองใหม่อีกครั้งนะ";

      alert(backendError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        flex: 1,
        padding: "40px",
        overflowY: "auto",
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
              <Button icon={<UploadOutlined />} style={{ marginTop: 10, borderRadius: 8 }}>
                Change Photo
              </Button>
            </Upload>
          </div>

          {/* FORM GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 25 }}>
            <div>
              <label>Email</label>
              <Input value={form.email} disabled style={readOnlyStyle} />

              <label style={{ marginTop: 20, display: "block" }}>National ID</label>
              <Input value={form.nationalID} disabled style={readOnlyStyle} />

              <label style={{ marginTop: 20, display: "block" }}>First Name</label>
              <Input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                style={editableStyle}
              />

              <label style={{ marginTop: 20, display: "block" }}>Bio</label>
              <TextArea
                rows={5}
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                style={editableStyle}
              />
            </div>

            <div>
              <label>Student ID</label>
              <Input value={form.studentID} disabled style={readOnlyStyle} />

              <label style={{ marginTop: 20, display: "block" }}>Username</label>
              <Input
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                style={editableStyle}
              />

              <label style={{ marginTop: 20, display: "block" }}>Last Name</label>
              <Input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                style={editableStyle}
              />

              <label style={{ marginTop: 20, display: "block" }}>Date of Birth</label>
              <DatePicker
                style={{ width: "100%", ...editableStyle }}
                value={form.dob ? dayjs(form.dob, "YYYY-MM-DD") : undefined}
                onChange={(_, dateString) => handleChange("dob", dateString)}
              />

              <label style={{ marginTop: 20, display: "block" }}>Gender</label>
              <Select
                value={form.genderId || undefined}
                onChange={(value) => setForm((prev) => ({ ...prev, genderId: value }))}
                style={{ width: "100%", ...editableStyle }}
                options={[
                  { value: "1", label: "Male" },
                  { value: "2", label: "Female" },
                  { value: "3", label: "Other" },
                ]}
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
            <Button
              type="primary"
              loading={saving}
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
              SAVE
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default EditProfile;
