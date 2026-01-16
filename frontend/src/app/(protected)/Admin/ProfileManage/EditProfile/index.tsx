import React, { useEffect, useState } from "react";
import { Card, Typography, Input, Button, Upload, Modal, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  adminProfileAPI,
  type AdminProfileDTO,
  type UpdateAdminProfileReq,
} from "../../../../../services/http/admin_profile";

// ✅ Import shared/user component for consistency
import { SuccessModalContent } from "../../../User/Profile/EditProfile/SuccessModalContent";

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
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    avatar: "", // base64
  });

  const [saving, setSaving] = useState(false);

  // ✅ Use Modal hook
  const [modal, contextHolder] = Modal.useModal();

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    adminProfileAPI
      .getMe()
      .then((res) => {
        const d: AdminProfileDTO = res.data.data;

        setForm({
          email: d.email || "",
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
        modal.warning({
          title: "Warning",
          content: "กรอก Username ก่อนนะ",
          centered: true,
        });
        return;
      }

      await adminProfileAPI.updateMe(payload);

      // ✨ Custom Beautiful Modal with Animations (Same as User)
      const instance = modal.success({
        title: null,
        icon: null,
        footer: null,
        centered: true,
        closable: true,
        maskClosable: true,
        width: 420,
        style: { padding: 0, borderRadius: 24, overflow: "hidden" },
        content: (
          <SuccessModalContent
            onClose={() => {
              instance.destroy();
              navigate("/Admin/ProfileManage");
            }}
          />
        ),
      });

    } catch (err: any) {
      console.error("Update admin profile error:", err);
      // Fallback message if modal fails or just use modal for consistency
      const errMsg = err?.response?.data?.message || "อัปเดตโปรไฟล์ไม่สำเร็จ";
      modal.error({
        title: "Update Failed",
        content: errMsg,
        centered: true,
      });
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
      {contextHolder}
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

              </Button>
            </Upload>
          </div>

          {/* FORM */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 25,
            }}
          >
            <div>
              <label>Email</label>
              <Input value={form.email} disabled style={readOnlyStyle} />
            </div>

            <div>
              <label>Username</label>
              <Input
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                style={editableStyle}
              />
            </div>

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

            <div>
              <label>Phone Number</label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                style={editableStyle}
              />
            </div>
          </div>

          {/* ✅ SAVE BUTTON สี #9c2510 (Matched User Profile) */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSave}
              style={{
                background: "#9c2510",
                borderRadius: 25,
                padding: "0 35px",
                height: 40,
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(156, 37, 16, 0.3)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(156, 37, 16, 0.4)";
                e.currentTarget.style.backgroundColor = "#c42e0a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 10px rgba(156, 37, 16, 0.3)";
                e.currentTarget.style.backgroundColor = "#9c2510";
              }}
            >
              SAVE
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default EditAdminProfile;
