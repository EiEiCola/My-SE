import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Typography,
  Select,
  Tag,
  Space,
  Modal,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

interface RequestRow {
  id: number;
  user: string;
  title: string;
  submittedAt: string;
  displayFrom: string;
  displayTo?: string;
  status: "pending" | "approved" | "rejected";
}

const AnnouncementManage: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Build query params
      let url = "/api/admin/pr-submissions?page_size=50";
      if (filterStatus === "pending") url += "&status_id=1";
      else if (filterStatus === "approved") url += "&status_id=2";
      else if (filterStatus === "rejected") url += "&status_id=3";

      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to fetch");
      const json = await response.json();
      const mapped = (json.data || []).map((item: any) => ({
        id: item.id,
        user: item.member?.username || `Member #${item.member_id}`,
        title: item.title,
        submittedAt: item.req_start_at
          ? new Date(item.req_start_at).toLocaleDateString("th-TH")
          : "-",
        displayFrom: item.req_start_at
          ? new Date(item.req_start_at).toLocaleDateString("th-TH")
          : "-",
        displayTo: item.req_end_at
          ? new Date(item.req_end_at).toLocaleDateString("th-TH")
          : "-",
        status:
          item.status_id === 1
            ? "pending"
            : item.status_id === 2
              ? "approved"
              : "rejected",
      }));
      setRequests(mapped);
    } catch (err) {
      console.error(err);
      message.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const handleDeletePR = (prId: number) => {
    confirm({
      title: `ยืนยันลบคำขอ PR #${prId}?`,
      icon: <ExclamationCircleOutlined />,
      content: "การกระทำนี้ไม่สามารถย้อนกลับได้",
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const headers: HeadersInit = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          const resp = await fetch(`/api/admin/pr-submissions/${prId}`, {
            method: "DELETE",
            headers,
          });
          if (!resp.ok) throw new Error(await resp.text());

          message.success("ลบคำขอสำเร็จ");
          setRequests((prev) => prev.filter((r) => r.id !== prId));
        } catch (e: any) {
          message.error(e.message || "ลบคำขอไม่สำเร็จ");
        }
      },
    });
  };

  const handleRowClick = (record: RequestRow) => {
    navigate(`/Admin/AnnouncementManage/${record.id}`);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      align: "center" as const,
    },
    {
      title: "ผู้ยื่นคำร้อง",
      dataIndex: "user",
      key: "user",
      width: 150,
    },
    {
      title: "ชื่อหัวข้อ",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "วันที่ยื่น",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 120,
    },
    {
      title: "ช่วงเผยแพร่",
      key: "period",
      width: 200,
      render: (_: any, record: RequestRow) => (
        <span>
          {record.displayFrom} - {record.displayTo || "?"}
        </span>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      align: "center" as const,
      render: (_: any, record: RequestRow) => {
        let color = "default";
        let text: string = record.status;
        if (record.status === "pending") {
          color = "orange";
          text = "รอตรวจสอบ";
        }
        else if (record.status === "approved") {
          color = "green";
          text = "อนุมัติแล้ว";
        }
        else if (record.status === "rejected") {
          color = "red";
          text = "ปฏิเสธ";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 80,
      align: "center" as const,
      render: (_: any, record: RequestRow) => (
        <Tooltip title="ลบคำขอ">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePR(record.id);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-6">
      <Card className="rounded-2xl shadow-sm" bodyStyle={{ padding: "32px" }}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Title level={3} style={{ margin: 0, color: "#1f2937" }}>
              จัดการคำขอประชาสัมพันธ์
            </Title>
            <Typography.Text type="secondary">
              ตรวจสอบและจัดการคำขอลงประกาศจากสมาชิก
            </Typography.Text>
          </div>

          <Space wrap>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => navigate("/Admin/AnnouncementManage/Announcements")}
            >
              ดูประกาศหน้าเว็บ
            </Button>

            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(val) => setFilterStatus(val)}
              value={filterStatus}
            >
              <Option value="all">ทั้งหมด</Option>
              <Option value="pending">รอตรวจสอบ</Option>
              <Option value="approved">อนุมัติแล้ว</Option>
              <Option value="rejected">ปฏิเสธ</Option>
            </Select>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/Admin/AnnouncementManage/create")}
              style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            >
              สร้างประกาศทางการ
            </Button>
          </Space>
        </div>

        {/* Table Section */}
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
          })}
        />
      </Card>
    </main>
  );
};

export default AnnouncementManage;