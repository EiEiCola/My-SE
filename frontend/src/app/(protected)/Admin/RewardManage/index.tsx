import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import React, { useState, useEffect } from "react";
import { Card, Typography, Button, Input, Table } from "antd";
import { UploadOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

// -------------------- API SERVICE (รอเชื่อม backend) -------------------
const rewardAPI = {
  create: async (formData: FormData) => {
    return { data: { id: Date.now(), imageUrl: "" } }; // mock
  },

  update: async (id: number, formData: FormData) => {
    return { data: { id } }; // mock
  },

  getAll: async () => {
    return { data: [] }; // mock
  }
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

  useEffect(() => {
    const loadData = async () => {
      const res = await rewardAPI.getAll();
      setRewards(res.data);
    };
    loadData();
  }, []);

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      setForm({ ...form, image: file, preview: reader.result as string });
    reader.readAsDataURL(file);
  };

  // ------------------ SAVE (CREATE + EDIT) ------------------
  const handleSave = async () => {
    if (!form.name || !form.points || (!isEditMode && !form.image)) {
      alert("กรอกข้อมูลให้ครบก่อนน้า ❤️");
      return;
    }

    if (isEditMode) {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("points", form.points);
      if (form.image) fd.append("image", form.image);

      await rewardAPI.update(editId!, fd);

      setRewards(
        rewards.map((r) =>
          r.id === editId
            ? { ...r, name: form.name, points: form.points, preview: form.preview }
            : r
        )
      );
    } else {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("points", form.points);
      fd.append("image", form.image!);

      const res = await rewardAPI.create(fd);

      const newReward = {
        id: res.data.id,
        name: form.name,
        points: form.points,
        preview: form.preview,
      };

      setRewards([...rewards, newReward]);
    }

    setForm({ name: "", points: "", image: null, preview: "" });
    setIsEditMode(false);
    setEditId(null);
    setOpen(false);
  };

  // ------------------ DELETE ------------------
  const handleDelete = (id: number) => {
    setRewards(rewards.filter((r) => r.id !== id));
  };

  // ------------------ EDIT BUTTON ------------------
  const handleEdit = (row: any) => {
    setIsEditMode(true);
    setEditId(row.id);
    setForm({
      name: row.name,
      points: row.points,
      image: null,
      preview: row.preview,
    });
    setOpen(true);
  };

  // ------------------ TABLE COLUMNS ------------------
  const columns = [
    {
      title: "Sticker",
      dataIndex: "preview",
      render: (img: string) => (
        <img
          src={img}
          style={{
            width: 50,
            height: 50,
            borderRadius: 8,
            objectFit: "cover",
            border: "1px solid #ddd",
          }}
        />
      ),
    },
    { title: "Name", dataIndex: "name" },
    { title: "Points", dataIndex: "points" },
    {
      title: "Action",
      render: (_: any, row: any) => (
        <>
          <Button
            icon={<EditOutlined />}
            style={{ marginRight: 10 }}
            onClick={() => handleEdit(row)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(row.id)}
          />
        </>
      ),
    },
  ];

  // ⭐ หัวตารางสีเทาอ่อน
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
            minHeight: 500,
          }}
        >
          {/* TITLE */}
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

          {/* BUTTON GROUP: Add Reward + Point Rule */}
          <div style={{ display: "flex", gap: 15, marginBottom: 30 }}>
            
            {/* ADD REWARD BUTTON */}
            <Button
              type="primary"
              icon={<AddToPhotosIcon style={{ fontSize: 20, marginRight: 6 }} />}
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
                setForm({ name: "", points: "", image: null, preview: "" });
                setOpen(true);
              }}
            >
              Add Reward
            </Button>

            {/* POINT RULE BUTTON */}
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

                {/* FORM */}
                <div style={{ display: "flex", flexDirection: "column", gap: 25 }}>

                  <div>
                    <label style={{ fontWeight: 400, color: "#C42E0A" }}>
                      Sticker Name
                    </label>
                    <Input
                      style={{ height: 40, borderRadius: 8, marginTop: 5 }}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                      onChange={(e) => setForm({ ...form, points: e.target.value })}
                    />
                  </div>
                </div>

                {/* BUTTON GROUP */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 35,
                  }}
                >
                  {/* CANCEL BUTTON */}
                  <Button
                    style={{
                      borderRadius: 10,
                      padding: "0 30px",
                      height: 38,
                      fontWeight: 600,
                      border: "1px solid #C42E0A",
                      color: "#C42E0A",
                      backgroundColor: "#ffffff",
                    }}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  {/* CREATE / SAVE */}
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

          {/* TABLE */}
          <Table
            dataSource={rewards}
            columns={columns}
            rowKey="id"
            style={{ marginTop: 20 }}
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

export default RewardManage;
