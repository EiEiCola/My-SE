import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Input,
  Table,
  message,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;

// ✅ axios instance: baseURL = http://localhost:8080/api
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
});

type PointRulePayload = {
  activity_type: string;
  description?: string; // ✅ NEW
  activity_point: number;
  daily_limit: number;
};

const pointRuleAPI = {
  create: (payload: PointRulePayload) => api.post("/admin/point-rule", payload),
  update: (id: number, payload: PointRulePayload) =>
    api.put(`/admin/point-rule/${id}`, payload),
  remove: (id: number) => api.delete(`/admin/point-rule/${id}`),
  getAll: () => api.get("/admin/point-rule"),
};

// -------- helpers ----------
const getRowId = (row: any) => {
  const n = Number(row?.id ?? row?.ID ?? row?._raw?.id ?? row?._raw?.ID);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const normalizeRule = (raw: any) => {
  const id = getRowId(raw);
  return {
    id,
    activity_type: String(raw?.activity_type ?? raw?.ActivityType ?? ""),
    description: String(raw?.description ?? raw?.Description ?? ""), // ✅ NEW
    activity_point: Number(raw?.activity_point ?? raw?.ActivityPoint ?? 0),
    daily_limit: Number(raw?.daily_limit ?? raw?.DailyLimit ?? 0),
    _raw: raw,
  };
};

const PointRuleManage: React.FC = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [rules, setRules] = useState<any[]>([]);

  const [form, setForm] = useState({
    type: "",
    description: "", // ✅ NEW
    point: "",
    limit: "",
  });

  // ✅ เก็บ row เดิมไว้กันกรณี edit แล้ว description ว่าง (จะได้ไม่หลุด)
  const [editingSnapshot, setEditingSnapshot] = useState<any | null>(null);

  const loadRules = async () => {
    try {
      const res = await pointRuleAPI.getAll();
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const mapped = list.map(normalizeRule);

      const bad = mapped.filter((x: any) => !x.id || x.id <= 0);
      if (bad.length > 0) {
        console.warn(
          "[WARN] invalid id (0) rows:",
          bad.map((b: any) => b._raw)
        );
      }

      setRules(mapped);
    } catch (err: any) {
      console.log("GET /admin/point-rule error =>", err);
      message.error(err?.response?.data?.error || "โหลดกติกาแต้มไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // -------------------- SAVE (Create + Edit) ---------------------
  const handleSave = async () => {
    if (!form.type || !form.point || !form.limit) {
      message.warning("กรอกข้อมูลให้ครบก่อนนะ ❤️");
      return;
    }

    const pointNum = Number(form.point);
    const limitNum = Number(form.limit);

    if (!Number.isFinite(pointNum) || pointNum <= 0) {
      message.warning("Activity Point ต้องมากกว่า 0");
      return;
    }
    if (!Number.isFinite(limitNum) || limitNum < 0) {
      message.warning("Daily Limit ต้องเป็น 0 หรือมากกว่า");
      return;
    }

    // ✅ ถ้า edit แล้วผู้ใช้ลบ description จนว่าง:
    // - ถ้า backend ยังไม่รองรับ "เคลียร์ค่า" (ว่างแล้วไม่อัปเดต)
    // - เราจะส่งเป็นค่าเดิมแทน เพื่อไม่ให้หลุด/ไม่ตรง
    // ถ้าเนยอยากให้ลบได้จริง บอกได้ เดี๋ยวผมปรับ backend ให้เคลียร์ได้
    const descTrim = form.description?.trim() ?? "";
    const safeDesc =
      isEditMode && descTrim === "" ? String(editingSnapshot?.description ?? "") : descTrim;

    const payload: PointRulePayload = {
      activity_type: form.type.trim(),
      description: safeDesc,
      activity_point: pointNum,
      daily_limit: limitNum,
    };

    try {
      if (isEditMode) {
        const id = Number(editId);
        if (!id || Number.isNaN(id)) {
          message.error("แก้ไขไม่ได้: id ไม่ถูกต้อง");
          return;
        }
        await pointRuleAPI.update(id, payload);
        message.success("อัปเดตกติกาสำเร็จ ✅");
      } else {
        await pointRuleAPI.create(payload);
        message.success("สร้างกติกาสำเร็จ ✅");
      }

      setForm({ type: "", description: "", point: "", limit: "" });
      setIsEditMode(false);
      setEditId(null);
      setEditingSnapshot(null);
      setOpen(false);

      await loadRules();
    } catch (err: any) {
      console.log(
        "CREATE/UPDATE error =>",
        err?.response?.status,
        err?.response?.data,
        err
      );
      const status = err?.response?.status;
      const backendMsg =
        err?.response?.data?.error || err?.response?.data?.message;
      message.error(
        backendMsg ? `Error ${status}: ${backendMsg}` : "บันทึกไม่สำเร็จ"
      );
    }
  };

  // -------------------- DELETE ---------------------
  const doDelete = async (row: any) => {
    const id = getRowId(row);
    console.log("[UI] CONFIRM DELETE id =", id, "row=", row);

    if (!id) {
      message.error("ลบไม่ได้: id เป็น 0/ว่าง (ดู console.warn)");
      return;
    }

    try {
      await pointRuleAPI.remove(id);
      message.success("ลบสำเร็จ ✅");
      await loadRules();
    } catch (err: any) {
      console.log(
        "[API] DELETE error =>",
        err?.response?.status,
        err?.response?.data,
        err
      );
      const status = err?.response?.status;
      const backendMsg =
        err?.response?.data?.error || err?.response?.data?.message;
      message.error(
        backendMsg ? `Error ${status}: ${backendMsg}` : "ลบไม่สำเร็จ"
      );
    }
  };

  // -------------------- EDIT ----------------------
  const handleEdit = (row: any) => {
    const id = getRowId(row);
    if (!id) {
      message.error("แก้ไขไม่ได้: id ไม่ถูกต้อง");
      return;
    }

    setIsEditMode(true);
    setEditId(id);

    // ✅ เก็บค่าเดิมไว้กัน description หลุด
    setEditingSnapshot(row);

    setForm({
      type: String(row.activity_type ?? ""),
      description: String(row.description ?? ""), // ✅ NEW
      point: String(row.activity_point ?? ""),
      limit: String(row.daily_limit ?? ""),
    });

    setOpen(true);
  };

  // -------------------- TABLE ----------------------
  const columns = [
    { title: "Activity Type", dataIndex: "activity_type" },
    {
      title: "Description",
      dataIndex: "description",
      render: (v: any) => (
        <span style={{ color: "#555" }}>{String(v || "-")}</span>
      ),
    },
    { title: "Point", dataIndex: "activity_point", width: 120 },
    { title: "Daily Limit", dataIndex: "daily_limit", width: 120 },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_: any, row: any) => {
        const id = getRowId(row);
        const disabled = !id;

        return (
          <>
            <Button
              icon={<EditOutlined />}
              style={{ marginRight: 10 }}
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEdit(row);
              }}
            />

            <Popconfirm
              title="ยืนยันการลบ"
              description="ต้องการลบ Point Rule นี้ใช่ไหม ?"
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
              onConfirm={() => doDelete(row)}
              onPopupClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("[UI] CLICK DELETE button row=", row);
                }}
              />
            </Popconfirm>
          </>
        );
      },
    },
  ];

  const headerStyle = {
    fontWeight: 500,
    color: "black",
    background: "#F7F7F7",
    fontSize: 15,
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
            padding: "45px 60px",
            background: "#FFFFFF",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
            minHeight: 500,
          }}
        >
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 650,
              color: "#C42E0A",
              marginBottom: 20,
            }}
          >
            Point Rule Management
          </Title>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Button
              icon={<ArrowLeftOutlined />}
              style={{
                borderRadius: 10,
                height: 35,
                fontWeight: 600,
                border: "1px solid #C42E0A",
                color: "#C42E0A",
                background: "white",
              }}
              onClick={() => navigate("/Admin/RewardManage")}
            >
              Back
            </Button>

            <Button
              type="primary"
              style={{
                backgroundColor: "#C42E0A",
                borderRadius: 10,
                padding: "0 15px",
                height: 35,
                fontWeight: 600,
              }}
              onClick={() => {
                setIsEditMode(false);
                setEditId(null);
                setEditingSnapshot(null);
                setForm({ type: "", description: "", point: "", limit: "" });
                setOpen(true);
              }}
            >
              Add Rule
            </Button>
          </div>

          {/* POPUP */}
          {open && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 999,
              }}
            >
              <div
                style={{
                  width: 550,
                  background: "#FFF7F0",
                  padding: "40px 55px",
                  borderRadius: 28,
                  border: "2px solid #C42E0A",
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                <h2
                  style={{
                    color: "#C42E0A",
                    fontWeight: 500,
                    fontSize: 20,
                    marginBottom: 30,
                  }}
                >
                  {isEditMode ? "Edit Rule" : "Add Rule"}
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 25 }}>
                  <div>
                    <label style={{ color: "#C42E0A" }}>Activity Type</label>
                    <Input
                      style={{ height: 40, borderRadius: 8, marginTop: 5 }}
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    />
                  </div>

                  {/* ✅ NEW: Description */}
                  <div>
                    <label style={{ color: "#C42E0A" }}>Description</label>
                    <Input.TextArea
                      rows={3}
                      style={{ borderRadius: 8, marginTop: 5, resize: "none" }}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="อธิบายกิจกรรม / เงื่อนไขการได้แต้ม..."
                    />
                  </div>

                  <div>
                    <label style={{ color: "#C42E0A" }}>Point</label>
                    <Input
                      type="number"
                      style={{ height: 40, borderRadius: 8, marginTop: 5 }}
                      value={form.point}
                      onChange={(e) => setForm({ ...form, point: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ color: "#C42E0A" }}>Daily Limit</label>
                    <Input
                      type="number"
                      style={{ height: 40, borderRadius: 8, marginTop: 5 }}
                      value={form.limit}
                      onChange={(e) => setForm({ ...form, limit: e.target.value })}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 35,
                  }}
                >
                  <Button
                    style={{
                      borderRadius: 10,
                      padding: "0 30px",
                      height: 38,
                      fontWeight: 600,
                      border: "1px solid #C42E0A",
                      color: "#C42E0A",
                      background: "white",
                    }}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    style={{
                      backgroundColor: "#C42E0A",
                      borderRadius: 10,
                      padding: "0 30px",
                      height: 38,
                      fontWeight: 600,
                      color: "white",
                    }}
                    onClick={handleSave}
                  >
                    {isEditMode ? "Save" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Table
            dataSource={rules}
            columns={columns}
            rowKey={(r: any) => String(r.id || getRowId(r) || Math.random())}
            pagination={false}
            components={{
              header: {
                cell: (props: any) => (
                  <th {...props} style={{ ...props.style, ...headerStyle }} />
                ),
              },
            }}
          />
        </Card>
      </div>
    </main>
  );
};

export default PointRuleManage;
