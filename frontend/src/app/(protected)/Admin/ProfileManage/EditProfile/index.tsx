import React, { useEffect, useState } from "react";
import { Card, Typography, Input, Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  adminProfileAPI,
  type AdminProfileDTO,
  type UpdateAdminProfileReq,
} from "../../../../../services/http/admin_profile";

const { Title } = Typography;

const readOnlyStyle: React.CSSProperties = {
  marginTop: 5,
  background: "#f5f5f5",
  fontWeight: 500,
  fontSize: 14,
  cursor: "not-allowed",
};

const editableStyle: React.CSSProperties = {
  marginTop: 5,
  fontWeight: 500,
  fontSize: 14,
};

function EditAdminProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    nationalIdMasked: "", // **** **** **** 1234
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    avatar: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    adminProfileAPI
      .getMe()
      .then((res) => {
        const d: AdminProfileDTO = res.data.data;

        const masked =
          d.national_id_last4 && d.national_id_last4.trim()
            ? `**** **** **** ${d.national_id_last4}`
            : "Not linked";

        setForm({
          email: d.email || "",
          nationalIdMasked: masked,
          username: d.username || "",
          firstName: d.first_name || "",
          lastName: d.last_name || "",
          phoneNumber: d.phone_number || "",
          avatar: d.profile_picture || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load admin profile for editing:", err);
        message.error(err?.response?.data?.message || "โหลดข้อมูลแอดมินไม่สำเร็จ");
      });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload: UpdateAdminProfileReq = {
        username: form.username.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone_number: form.phoneNumber.trim(),
        profile_picture: form.avatar?.trim(),
      };

      if (!payload.username) {
        message.warning("กรอก Username ก่อนนะ");
        return;
      }

      await adminProfileAPI.updateMe(payload);

      message.success("Admin profile updated!");
      navigate("/Admin/ProfileManage");
    } catch (err: any) {
      console.error(
        "Update admin profile error:",
        err?.response?.status,
        err?.response?.data
      );
      const backendError =
        err?.response?.data?.message ||
        "อัปเดตโปรไฟล์ไม่สำเร็จ ลองใหม่อีกครั้งนะ";
      message.error(backendError);
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
          {/* BACK BUTTON */}
          <div style={{ marginBottom: 15 }}>
            <Button
              onClick={() => navigate("/Admin/ProfileManage")}
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
            Edit Admin Profile
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
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => {
                    message.warning("โหลดรูปไม่สำเร็จ ตรวจสอบรูป/URL อีกครั้ง");
                    handleChange("avatar", "");
                  }}
                />
              ) : (
                <span style={{ color: "white", fontSize: 40, fontWeight: 700 }}>
                  {form.username ? form.username[0]?.toUpperCase() : "A"}
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

          {/* FORM GRID (เรียงตามที่ขอ) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 25,
            }}
          >
            {/* แถว 1 */}
            <div>
              <label>Email</label>
              <Input value={form.email} disabled style={readOnlyStyle} />
            </div>

            <div>
              <label>National ID</label>
              <Input value={form.nationalIdMasked} disabled style={readOnlyStyle} />
            </div>

            {/* แถว 2 */}
            <div>
              <label>Username</label>
              <Input
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                style={editableStyle}
              />
            </div>

            <div>
              <label>Phone Number</label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                style={editableStyle}
              />
            </div>

            {/* แถว 3 */}
            <div>
              <label>First Name</label>
              <Input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                style={editableStyle}
              />
            </div>

            <div>
              <label>Last Name</label>
              <Input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                style={editableStyle}
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
              <CheckIcon style={{ color: "white", fontSize: 18 }} />
              SAVE
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default EditAdminProfile;
