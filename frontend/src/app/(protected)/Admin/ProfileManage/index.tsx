// ProfileManage.tsx (Admin Profile - Auto load all users + Filter)
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Typography,
  Avatar,
  Input,
  Table,
  Space,
  Tag,
  Modal,
  message,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";

import {
  adminProfileAPI,
  type AdminProfileDTO,
} from "../../../../services/http/admin_profile";
import {
  adminUserManageAPI,
  type AdminUserAccountDTO,
} from "../../../../services/http/admin_user_manage";

const { Title, Text } = Typography;

const rowLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 650,
  color: "#6b6b6b",
  marginBottom: 4,
};

const rowValue: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  color: "#111",
};

const MOCK_EMAIL = "admin@mock.com";

type StatusFilter = "all" | "active" | "locked";

// ✅ แปลง is_locked ให้ชัวร์ (รองรับ true/false, "true"/"false", 1/0, "1"/"0")
const isLocked = (v: any) => {
  if (v === true) return true;
  if (v === false) return false;

  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "locked") return true;
    if (s === "false" || s === "0" || s === "active") return false;
  }
  return Boolean(v);
};

const ProfileManage: React.FC = () => {
  const navigate = useNavigate();

  // ✅ AntD holders
  const [modal, modalHolder] = Modal.useModal();
  const [msgApi, msgHolder] = message.useMessage();

  // ---------------- Admin Profile ----------------
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<AdminProfileDTO>({
    id: 0,
    username: "loading...",
    first_name: "",
    last_name: "",
    profile_picture: "",
    phone_number: "",
    email: "",
    national_id_last4: "",
  });

  useEffect(() => {
    setLoading(true);
    adminProfileAPI
      .getMe()
      .then((res) => {
        const data = res.data.data;

        setProfile({
          id: data.id,
          username: data.username || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          profile_picture: data.profile_picture || "",
          phone_number: data.phone_number || "",
          email: data.email || MOCK_EMAIL,
          national_id_last4: data.national_id_last4 || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load admin profile:", err);
        msgApi.error(err?.response?.data?.message || "โหลดข้อมูลแอดมินไม่สำเร็จ");

        setProfile((prev) => ({
          ...prev,
          username: prev.username === "loading..." ? "AdminNoey" : prev.username,
          email: MOCK_EMAIL,
        }));
      })
      .finally(() => setLoading(false));
  }, [msgApi]);

  // ---------------- User Account Management ----------------
  const [qEmail, setQEmail] = useState("");
  const [qCode, setQCode] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<AdminUserAccountDTO[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false); // ✅ กันยิงซ้ำตอน StrictMode

  const onSearchUsers = async (opts?: { silent?: boolean }) => {
    const email = qEmail.trim();
    const code = qCode.trim();

    try {
      if (!opts?.silent) setSearching(true);

      const res = await adminUserManageAPI.search({
        email: email || undefined,
        code: code || undefined,
      });

      const list = res?.data?.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setUsers(arr);

      if (!opts?.silent && arr.length === 0) {
        msgApi.info("ไม่พบผู้ใช้");
      }
    } catch (err: any) {
      console.error("Search users failed:", err);
      msgApi.error(err?.response?.data?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      setUsers([]);
    } finally {
      if (!opts?.silent) setSearching(false);
    }
  };

  // ✅ เปิดหน้ามาแล้วโหลด All ทันที
  useEffect(() => {
    if (initialLoaded) return;
    setInitialLoaded(true);

    (async () => {
      try {
        setSearching(true);
        const res = await adminUserManageAPI.search({}); // ✅ ไม่ส่ง params = ขอทั้งหมด
        const list = res?.data?.data ?? [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error("Initial load users failed:", err);
        msgApi.error(err?.response?.data?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      } finally {
        setSearching(false);
      }
    })();
  }, [initialLoaded, msgApi]);

  const onClearSearch = () => {
    setQEmail("");
    setQCode("");
    setStatusFilter("all");
    // ✅ เคลียร์แล้วโหลดทั้งหมดกลับมา
    (async () => {
      try {
        setSearching(true);
        const res = await adminUserManageAPI.search({});
        const list = res?.data?.data ?? [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error("Reload all users failed:", err);
        msgApi.error(err?.response?.data?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      } finally {
        setSearching(false);
      }
    })();
  };

  // ✅ กรองในฝั่ง UI
  const filteredUsers = useMemo(() => {
    if (statusFilter === "all") return users;
    if (statusFilter === "locked") return users.filter((u) => isLocked((u as any).is_locked));
    return users.filter((u) => !isLocked((u as any).is_locked));
  }, [users, statusFilter]);

  // ---------------- Lock / Unlock (Optimistic Update) ----------------
  const confirmLock = (record: AdminUserAccountDTO) => {
    let reason = "";

    modal.confirm({
      title: "ยืนยันการล็อกบัญชี",
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            ต้องการล็อกบัญชีผู้ใช้:{" "}
            <b>{record.username || record.email || record.id}</b> ?
          </div>
          <Input.TextArea
            rows={3}
            placeholder="เหตุผล (ไม่ใส่ก็ได้)"
            onChange={(e) => (reason = e.target.value)}
          />
        </div>
      ),
      okText: "ล็อก",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await adminUserManageAPI.lock(record.id, reason);

          // ✅ อัปเดต UI ทันที
          setUsers((prev) =>
            prev.map((u) =>
              u.id === record.id
                ? { ...u, is_locked: true as any, locked_reason: reason as any }
                : u
            )
          );

          msgApi.success("ล็อกบัญชีสำเร็จ");

          // ✅ sync แบบเงียบ (ไม่ให้ table กระพริบ loading)
          await onSearchUsers({ silent: true });
        } catch (err: any) {
          console.error("Lock user failed:", err);
          msgApi.error(err?.response?.data?.message || "ล็อกบัญชีไม่สำเร็จ");
          throw err;
        }
      },
    });
  };

  const confirmUnlock = (record: AdminUserAccountDTO) => {
    modal.confirm({
      title: "ยืนยันการปลดล็อกบัญชี",
      content: `ต้องการปลดล็อกผู้ใช้: ${
        record.username || record.email || record.id
      } ?`,
      okText: "ปลดล็อก",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await adminUserManageAPI.unlock(record.id);

          // ✅ อัปเดต UI ทันที
          setUsers((prev) =>
            prev.map((u) =>
              u.id === record.id ? { ...u, is_locked: false as any, locked_reason: "" as any } : u
            )
          );

          msgApi.success("ปลดล็อกบัญชีสำเร็จ");
          await onSearchUsers({ silent: true });
        } catch (err: any) {
          console.error("Unlock user failed:", err);
          msgApi.error(err?.response?.data?.message || "ปลดล็อกไม่สำเร็จ");
          throw err;
        }
      },
    });
  };

  // ✅ ลดความหนาหัวตาราง
  const headerStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "#555",
  };

  const columns: ColumnsType<AdminUserAccountDTO> = useMemo(
    () => [
      { title: <span style={headerStyle}>ID</span>, dataIndex: "id", width: 90 },
      {
        title: <span style={headerStyle}>Username</span>,
        dataIndex: "username",
        render: (v) => v || "—",
      },
      {
        title: <span style={headerStyle}>Email</span>,
        dataIndex: "email",
        render: (v) => v || "—",
      },
      {
        title: <span style={headerStyle}>รหัส</span>,
        dataIndex: "code",
        width: 160,
        render: (v) => v || "—",
      },
      {
        title: <span style={headerStyle}>สถานะ</span>,
        dataIndex: "is_locked",
        width: 140,
        render: (v) =>
          isLocked(v) ? <Tag color="red">Locked</Tag> : <Tag color="green">Active</Tag>,
      },
      {
        title: <span style={headerStyle}>จัดการ</span>,
        key: "actions",
        width: 320,
        render: (_, record) => {
          const lockedNow = isLocked((record as any).is_locked);
          return (
            <Space>
              {lockedNow ? (
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmUnlock(record);
                  }}
                >
                  Unlock
                </Button>
              ) : (
                <Button
                  size="small"
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmLock(record);
                  }}
                >
                  Lock
                </Button>
              )}
            </Space>
          );
        },
      },
    ],
    [navigate, modal, msgApi]
  );

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
      {msgHolder}
      {modalHolder}

      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* ---------------- Profile Card ---------------- */}
        <Card
          loading={loading}
          style={{
            borderRadius: 28,
            padding: "35px 40px",
            marginBottom: 18,
            background: "#FFFFFF",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Avatar
              size={150}
              src={profile.profile_picture || undefined}
              style={{
                backgroundColor: "#C42E0A",
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              {profile.username?.[0]?.toUpperCase() || "A"}
            </Avatar>

            <div style={{ flex: 1, marginLeft: 40 }}>
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 750,
                  color: "#C42E0A",
                }}
              >
                {profile.username || "—"}
              </Title>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div>
                  <div style={rowLabel}>Email</div>
                  <div style={rowValue}>{profile.email || MOCK_EMAIL}</div>
                </div>

                <div>
                  <div style={rowLabel}>Name</div>
                  <div style={rowValue}>
                    {profile.first_name || "—"} {profile.last_name || ""}
                  </div>
                </div>

                <div>
                  <div style={rowLabel}>Phone Number</div>
                  <div style={rowValue}>{profile.phone_number || "—"}</div>
                </div>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/Admin/Profile/Edit")}
              style={{
                backgroundColor: "#9c2510",
                borderRadius: 10,
                padding: "0 10px",
                fontWeight: 650,
                height: 32,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <EditIcon style={{ color: "white", fontSize: 18 }} />
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* ---------------- User Account Management Card ---------------- */}
        <Card
          style={{
            borderRadius: 28,
            padding: "22px 28px",
            background: "#FFFFFF",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 600, color: "#C42E0A" }}>
                Member Account Manage
              </Title>
              <Text type="secondary"></Text>
            </div>

            <Space>
              <Button onClick={onClearSearch}>Clear</Button>
              <Button
                loading={searching}
                onClick={() => onSearchUsers()}
                style={{
                  backgroundColor: "#C42E0A",
                  borderColor: "#C42E0A",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Search
              </Button>
            </Space>
          </div>

          <div style={{ marginTop: 16 }}>
            <Space wrap style={{ width: "100%" }}>
              <Input
                value={qEmail}
                onChange={(e) => setQEmail(e.target.value)}
                placeholder=" Search Email "
                style={{ width: 360, borderRadius: 12, height: 38 }}
                onPressEnter={() => onSearchUsers()}
              />
              <Input
                value={qCode}
                onChange={(e) => setQCode(e.target.value)}
                placeholder=" Search Student ID "
                style={{ width: 360, borderRadius: 12, height: 38 }}
                onPressEnter={() => onSearchUsers()}
              />
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                style={{ width: 180 }}
                options={[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "locked", label: "Locked" },
                ]}
              />
            </Space>
          </div>

          <div style={{ marginTop: 16 }}>
            <Table
              rowKey={(r) => String(r.id)}
              loading={searching}
              columns={columns}
              dataSource={filteredUsers}
              pagination={{ pageSize: 8 }}
            />
          </div>
        </Card>
      </div>
    </main>
  );
};

export default ProfileManage;
