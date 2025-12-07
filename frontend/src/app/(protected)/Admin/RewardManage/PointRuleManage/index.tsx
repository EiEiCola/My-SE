import React, { useState, useEffect } from "react";
import { Card, Typography, Button, Input, Table } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import axios from "axios";  // ← เปิดใช้ตอนเชื่อม backend

const { Title } = Typography;

// -------------------- API SERVICE (พร้อมต่อ backend) -------------------
const ruleAPI = {
  create: async (body: any) => {
    // ❗ เชื่อม backend จริงแบบนี้
    // const res = await axios.post("http://localhost:8080/point-rule", body);
    // return res;

    return { data: { id: Date.now(), ...body } }; // mock
  },

  update: async (id: number, body: any) => {
    // await axios.put(`http://localhost:8080/point-rule/${id}`, body);

    return { data: { id, ...body } }; // mock
  },

  getAll: async () => {
    // const res = await axios.get("http://localhost:8080/point-rule");
    // return res;

    return { data: [] }; // mock
  },
};

const PointRuleManage: React.FC = () => {
  const [open, setOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [rules, setRules] = useState<any[]>([]);

  const [form, setForm] = useState({
    type: "",
    point: "",
    limit: "",
  });

  useEffect(() => {
    const load = async () => {
      const res = await ruleAPI.getAll();
      setRules(res.data);
    };
    load();
  }, []);

  // -------------------- SAVE (Create + Edit) ---------------------
  const handleSave = async () => {
    if (!form.type || !form.point || !form.limit) {
      alert("กรอกข้อมูลให้ครบก่อนนะ ❤️");
      return;
    }

    const body = {
      activity_type: form.type,
      activity_point: Number(form.point),
      daily_limit: Number(form.limit),
    };

    if (isEditMode) {
      await ruleAPI.update(editId!, body);

      setRules(
        rules.map((r) =>
          r.id === editId
            ? { ...r, ...body }
            : r
        )
      );
    } else {
      const res = await ruleAPI.create(body);

      setRules([...rules, res.data]);
    }

    // reset
    setForm({ type: "", point: "", limit: "" });
    setIsEditMode(false);
    setEditId(null);
    setOpen(false);
  };

  // -------------------- DELETE ---------------------
  const handleDelete = (id: number) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  // -------------------- EDIT ----------------------
  const handleEdit = (row: any) => {
    setIsEditMode(true);
    setEditId(row.id);
    setForm({
      type: row.activity_type,
      point: row.activity_point,
      limit: row.daily_limit,
    });
    setOpen(true);
  };

  // -------------------- TABLE ----------------------
  const columns = [
    { title: "Activity Type", dataIndex: "activity_type" },
    { title: "Point", dataIndex: "activity_point" },
    { title: "Daily Limit", dataIndex: "daily_limit" },
    {
      title: "Action",
      render: (_: any, row: any) => (
        <>
          <Button
            icon={<EditOutlined />}
            style={{ marginRight: 10 }}
            onClick={() => handleEdit(row)}
          />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(row.id)} />
        </>
      ),
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

          {/* ADD RULE BUTTON */}
          <Button
            type="primary"
            style={{
              backgroundColor: "#C42E0A",
              borderRadius: 10,
              padding: "0 15px",
              height: 35,
              fontWeight: 600,
              marginBottom: 20,
            }}
            onClick={() => {
              setIsEditMode(false);
              setForm({ type: "", point: "", limit: "" });
              setOpen(true);
            }}
          >
            Add Rule
          </Button>

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

                {/* FORM */}
                <div style={{ display: "flex", flexDirection: "column", gap: 25 }}>
                  <div>
                    <label style={{ color: "#C42E0A" }}>Activity Type</label>
                    <Input
                      style={{ height: 40, borderRadius: 8, marginTop: 5 }}
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ color: "#C42E0A" }}>Activity Point</label>
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

                {/* BUTTONS */}
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

          {/* TABLE */}
          <Table
            dataSource={rules}
            columns={columns}
            rowKey="id"
            style={{ marginTop: 5 }}
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
