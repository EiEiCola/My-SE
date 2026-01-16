import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import React, { useEffect, useState } from "react";
import { Card, Typography, Button, Input, Table, message, Modal } from "antd";
import { UploadOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./RewardManage.css";

import {
  adminRewardAPI,
  type AdminRewardPayload,
} from "../../../../services/http/admin_reward";

const { Title } = Typography;

// -------------------- Helpers -------------------
const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ✅ ดึง PK ให้ครอบคลุมหลายเคส (GORM ID / reward_id / RewardID / Model.ID)
const pickId = (raw: any) => {
  const n = Number(
    raw?.ID ??
    raw?.id ??
    raw?.Model?.ID ??
    raw?.model?.id ??
    raw?.reward_id ??
    raw?.RewardID ??
    raw?.rewardID
  );
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const normalizeReward = (raw: any) => {
  const id = pickId(raw);

  const name =
    raw?.reward_name ?? raw?.RewardName ?? raw?.name ?? raw?.rewardName ?? "";

  const points =
    raw?.point_required ??
    raw?.PointRequired ??
    raw?.points ??
    raw?.pointRequired ??
    "";

  const picture =
    raw?.reward_picture ??
    raw?.RewardPicture ??
    raw?.preview ??
    raw?.imageUrl ??
    raw?.rewardPicture ??
    "";

  return {
    id,
    name: String(name),
    points: String(points),
    preview: String(picture),
  };
};

// ✅ รองรับ response ได้หลายรูปแบบ ([], {data:[]}, {data:{data:[]}}, {result:[]}, {payload:[]})
const extractList = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  if (Array.isArray(raw?.result)) return raw.result;
  if (Array.isArray(raw?.payload)) return raw.payload;
  return [];
};

const RewardManage: React.FC = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [rewards, setRewards] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    points: "",
    image: null as File | null,
    preview: "",
  });

  // ✅ Controlled Delete Modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ✅ Custom Success Modal
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ------------------ LOAD ------------------
  const loadRewards = async () => {
    try {
      const res = await adminRewardAPI.getAll();

      // ✅ Debug ดูให้รู้เลย backend ส่งอะไรมา
      console.log("GET /admin/reward raw =>", res.data);

      const list = extractList(res.data);
      const mapped = list.map(normalizeReward);

      console.log(
        "GET /admin/reward listLen =>",
        list.length,
        "mappedLen =>",
        mapped.length
      );
      console.log("GET /admin/reward first =>", mapped?.[0]);

      setRewards(mapped);
    } catch (err: any) {
      console.log("GET /admin/reward error =>", err);
      message.error(err?.response?.data?.error || "โหลด rewards ไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  // ------------------ IMAGE ------------------
  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      setForm({ ...form, image: file, preview: reader.result as string });
    reader.readAsDataURL(file);
  };

  // ------------------ SAVE (CREATE + EDIT) ------------------
  const handleSave = async () => {
    if (!form.name || !form.points || (!isEditMode && !form.preview)) {
      message.warning("กรอกข้อมูลให้ครบก่อนน้า ❤️");
      return;
    }

    const payload: AdminRewardPayload = {
      reward_name: form.name,
      point_required: toNumber(form.points),
      reward_picture: form.preview || "",
    };

    try {
      if (isEditMode) {
        const safeEditId = Number(editId);
        if (!safeEditId || Number.isNaN(safeEditId)) {
          message.error("แก้ไขไม่ได้: id ไม่ถูกต้อง");
          return;
        }

        await adminRewardAPI.update(safeEditId, payload);
        // Modal.success({
        //   content: "อัปเดตรางวัลสำเร็จ ✅",
        //   centered: true,
        // });
        setSuccessMessage("Reward updated successfully");
        setSuccessOpen(true);
      } else {
        await adminRewardAPI.create(payload);
        // Modal.success({
        //   content: "สร้างรางวัลสำเร็จ ✅",
        //   centered: true,
        // });
        setSuccessMessage("Reward created successfully");
        setSuccessOpen(true);
      }

      setForm({ name: "", points: "", image: null, preview: "" });
      setIsEditMode(false);
      setEditId(null);
      setOpen(false);

      await loadRewards();
    } catch (err: any) {
      console.log("CREATE/UPDATE error =>", err);
      const status = err?.response?.status;
      const backendMsg =
        err?.response?.data?.error || err?.response?.data?.message;
      message.error(
        backendMsg ? `Error ${status}: ${backendMsg}` : "บันทึกไม่สำเร็จ"
      );
    }
  };

  // ------------------ DELETE ------------------
  const handleDelete = (id: number) => {
    const safeId = Number(id);
    if (!safeId || Number.isNaN(safeId)) {
      message.error("ลบไม่ได้: id ไม่ถูกต้อง");
      return;
    }

    setDeleteId(safeId);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await adminRewardAPI.remove(deleteId);
      setRewards((prev) => prev.filter((r: any) => r.id !== deleteId));
      await loadRewards();
      message.success("ลบสำเร็จ ✅");
    } catch (err: any) {
      console.log("DELETE error =>", err);
      message.error("ลบไม่สำเร็จ");
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  // ------------------ EDIT ------------------
  const handleEdit = (row: any) => {
    const safeId = Number(row?.id);
    if (!safeId || Number.isNaN(safeId)) {
      message.error("แก้ไขไม่ได้: id ไม่ถูกต้อง");
      return;
    }

    setIsEditMode(true);
    setEditId(safeId);
    setForm({
      name: row.name ?? "",
      points: row.points ?? "",
      image: null,
      preview: row.preview ?? "",
    });
    setOpen(true);
  };

  // ------------------ TABLE ------------------
  const columns = [
    {
      title: "Sticker",
      dataIndex: "preview",
      render: (img: string) =>
        img ? (
          <img
            src={img}
            style={{
              width: 50,
              height: 50,
              borderRadius: 8,
              objectFit: "cover",
              border: "1px solid #ddd",
            }}
            alt="reward"
          />
        ) : (
          <span style={{ color: "#999" }}>No Image</span>
        ),
    },
    { title: "Name", dataIndex: "name" },
    { title: "Points", dataIndex: "points" },
    {
      title: "Action",
      key: "action",
      render: (_: any, row: any) => {
        const id = Number(row?.id);
        const disabled = !id || Number.isNaN(id);

        return (
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              icon={<EditOutlined />}
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEdit(row);
              }}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(id);
              }}
            />
          </div>
        );
      },
    },
  ];

  // ------------------ SEARCH ------------------
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRewards = rewards.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              marginBottom: 25,
            }}
          >
            Reward Management
          </Title>

          {/* ✅ ซ้าย: Add Reward / ขวาสุด: Point Rule */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", gap: 15 }}>
              <Button
                type="primary"
                icon={
                  <AddToPhotosIcon style={{ fontSize: 20, marginRight: 6 }} />
                }
                style={{
                  backgroundColor: "#C42E0A",
                  borderRadius: 10,
                  padding: "0 15px",
                  height: 35,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => {
                  setIsEditMode(false);
                  setEditId(null);
                  setForm({ name: "", points: "", image: null, preview: "" });
                  setOpen(true);
                }}
              >
                Add Reward
              </Button>
            </div>

            <Button
              style={{
                backgroundColor: "#ffffff",
                border: "2px solid #C42E0A",
                color: "#C42E0A",
                borderRadius: 10,
                padding: "0 15px",
                height: 35,
                fontWeight: 600,
              }}
              onClick={() => navigate("/Admin/RewardManage/PointRule")}
            >
              Point Rule
            </Button>
          </div>

          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              marginBottom: 20,
              borderRadius: 10,
              height: 40,
              width: 250,
            }}
          />

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
                  {isEditMode ? "Edit Reward" : "Add Reward"}
                </h2>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 25 }}
                >
                  <div>
                    <label style={{ fontWeight: 400, color: "#C42E0A" }}>
                      Sticker Name
                    </label>
                    <Input
                      style={{ height: 40, borderRadius: 8, marginTop: 5 }}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 400, color: "#C42E0A" }}>
                      Sticker Image
                    </label>

                    <label
                      style={{
                        border: "1px solid #ccc",
                        height: 40,
                        borderRadius: 8,
                        padding: "0 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: "white",
                        marginTop: 5,
                      }}
                    >
                      <span style={{ color: "#777" }}>
                        {form.image ? form.image.name : "Choose Image"}
                      </span>
                      <UploadOutlined />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageChange}
                      />
                    </label>

                    {form.preview && (
                      <img
                        src={form.preview}
                        style={{
                          width: 70,
                          height: 70,
                          marginTop: 10,
                          borderRadius: 8,
                          border: "1px solid #ddd",
                          objectFit: "cover",
                        }}
                        alt="preview"
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ fontWeight: 400, color: "#C42E0A" }}>
                      Point Required
                    </label>
                    <Input
                      type="number"
                      style={{ height: 40, borderRadius: 8, marginTop: 5 }}
                      value={form.points}
                      onChange={(e) =>
                        setForm({ ...form, points: e.target.value })
                      }
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
                    className="btn-cancel"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    className="btn-submit"
                    onClick={handleSave}
                  >
                    {isEditMode ? "Save" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE CONFIRM */}
          <Modal
            open={deleteOpen}
            title="ยืนยันการลบ"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onOk={confirmDelete}
            onCancel={() => {
              setDeleteOpen(false);
              setDeleteId(null);
            }}
          >
            <div>ต้องการลบรางวัลนี้ใช่ไหม ?</div>
          </Modal>

          {/* ✅ SUCCESS MODAL */}
          <Modal
            open={successOpen}
            footer={null}
            onCancel={() => setSuccessOpen(false)}
            centered
            width={400}
            styles={{
              content: {
                borderRadius: 20,
                padding: "40px 20px",
                textAlign: "center",
                border: "2px solid #28a745",
                backgroundColor: "#f0fff4",
              },
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              {/* Icon Check */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "#28a745", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h2 style={{ margin: 0, color: "#28a745", fontSize: 24, fontWeight: 600 }}>
                Success!
              </h2>

              <p style={{ margin: 0, color: "#333", fontSize: 16 }}>
                {successMessage}
              </p>

              <Button
                style={{
                  width: "100%",
                  marginTop: 10,
                  height: 45,
                  fontSize: 16,
                  backgroundColor: "#28a745",
                  color: "white",
                  borderRadius: 10,
                  fontWeight: 600,
                  border: "none"
                }}
                onClick={() => setSuccessOpen(false)}
              >
                OK
              </Button>
            </div>
          </Modal>

          <Table
            dataSource={filteredRewards}
            columns={columns}
            rowKey={(record: any) => record.id}
            style={{ marginTop: 20 }}
            pagination={false}
          />
        </Card>
      </div>
    </main>
  );
};

export default RewardManage;
