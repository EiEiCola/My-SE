import React, { useEffect, useMemo, useState } from "react";
import { Modal, Table, Input, Select, Space, Typography, message } from "antd";
import axios from "axios";

const { Text } = Typography;

type PointRule = {
  id: number;
  activity_type: string;
  description?: string; // ✅ NEW
  point: number;
  daily_limit: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

// ---------- helpers (รองรับ response ได้หลายแบบ) ----------
const getId = (raw: any) => {
  const n = Number(raw?.id ?? raw?.ID);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const normalizeRule = (raw: any): PointRule => {
  return {
    id: getId(raw),
    activity_type: String(raw?.activity_type ?? raw?.ActivityType ?? ""),
    description: String(raw?.description ?? raw?.Description ?? ""), // ✅ NEW
    point: Number(raw?.point ?? raw?.activity_point ?? raw?.ActivityPoint ?? 0),
    daily_limit: Number(raw?.daily_limit ?? raw?.DailyLimit ?? 0),
  };
};

const PointRuleModal: React.FC<Props> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<PointRule[]>([]);
  const [searchText, setSearchText] = useState("");
  const [sortPoint, setSortPoint] = useState<"asc" | "desc">("asc");

  const loadRules = async () => {
    setLoading(true);
    try {
      // ⚠️ เปลี่ยน URL ให้ตรงกับ backend ของทีมเนย
      const res = await axios.get("http://localhost:8080/api/point-rules");

      const list = Array.isArray(res?.data?.data) ? res.data.data : res.data;

      const mapped = Array.isArray(list) ? list.map(normalizeRule) : [];
      setRules(mapped);
    } catch (err: any) {
      console.error("load point rules error =>", err);
      message.error("โหลดกติกาแต้มไม่สำเร็จ");
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filteredRules = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    const bySearch = q
      ? rules.filter((r) => {
        const a = (r.activity_type || "").toLowerCase();
        const d = (r.description || "").toLowerCase();
        return a.includes(q) || d.includes(q); // ✅ search ได้ทั้ง activity + description
      })
      : rules;

    return [...bySearch].sort((a, b) =>
      sortPoint === "asc" ? a.point - b.point : b.point - a.point
    );
  }, [rules, searchText, sortPoint]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="ปิด"
      okButtonProps={{
        style: {
          background: "linear-gradient(45deg, #FF8008, #FFC837)",
          borderColor: "transparent",
          color: "white",
          fontWeight: 700,
        },
      }}
      cancelButtonProps={{ style: { display: "none" } }}
      title="ได้รับแต้มจากอะไรบ้าง ?"
      width={920} // ✅ เพิ่มนิดนึง เผื่อ description
    >
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text type="secondary">
          รายการกิจกรรมที่สามารถได้รับแต้ม และจำนวนการทำกิจกรรมสูงสุดต่อวัน
        </Text>

        <Space>
          <Input
            allowClear
            placeholder="ค้นหา..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
          />

          <Select
            value={sortPoint}
            onChange={(v) => setSortPoint(v)}
            style={{ width: 200 }}
            options={[
              { value: "asc", label: "แต้ม: น้อย → มาก" },
              { value: "desc", label: "แต้ม: มาก → น้อย" },
            ]}
          />
        </Space>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredRules}
        pagination={{ pageSize: 6 }}
        columns={[
          { title: "ประเภทกิจกรรม", dataIndex: "activity_type", width: 220 },
          {
            title: "คำอธิบาย",
            dataIndex: "description",
            render: (v: any) => (
              <span style={{ color: "#555" }}>{String(v || "-")}</span>
            ),
          },
          { title: "จำนวนแต้มต่อครั้ง", dataIndex: "point", width: 110 },
          { title: "จำนวนครั้งต่อวัน", dataIndex: "daily_limit", width: 130 },
        ]}
      />
    </Modal>
  );
};

export default PointRuleModal;
