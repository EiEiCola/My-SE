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
  Avatar,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;
// const { confirm } = Modal;

interface RequestRow {
  id: number;
  user: string;
  member_picture?: string;
  member_id: number;
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
        member_picture: item.member?.member_picture,
        member_id: item.member_id,
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

  // Stats State
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const query = (status?: number) => `/api/admin/pr-submissions?page_size=1${status ? `&status_id=${status}` : ""}`;

      const [resTotal, resPending, resApproved, resRejected] = await Promise.all([
        fetch(query(), { headers }).then(r => r.json()),
        fetch(query(1), { headers }).then(r => r.json()),
        fetch(query(2), { headers }).then(r => r.json()),
        fetch(query(3), { headers }).then(r => r.json())
      ]);

      setStats({
        total: resTotal.total || 0,
        pending: resPending.total || 0,
        approved: resApproved.total || 0,
        rejected: resRejected.total || 0
      });
    } catch (e) {
      console.error("Fetch stats error", e);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filterStatus]);

  // Delete Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const handleDeletePR = (prId: number) => {
    setDeleteTargetId(prId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const resp = await fetch(`/api/admin/pr-submissions/${deleteTargetId}`, {
        method: "DELETE",
        headers,
      });
      if (!resp.ok) throw new Error(await resp.text());

      message.success("ลบคำขอสำเร็จ");
      setRequests((prev) => prev.filter((r) => r.id !== deleteTargetId));
      setDeleteModalVisible(false);
      setDeleteTargetId(null);
    } catch (e: any) {
      console.error("Delete PR Error:", e);
      message.error(e.message || "ลบคำขอไม่สำเร็จ");
    } finally {
      setDeleteProcessing(false);
    }
  };

  const handleRowClick = (record: RequestRow) => {
    navigate(`/Admin/AnnouncementManage/${record.id}`);
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url;
    return `${API_BASE}/uploads/${url}`;
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
      key: "user",
      width: 200,
      render: (_: any, record: RequestRow) => (
        <Space>
          <Avatar src={resolveMediaUrl(record.member_picture) || "https://api.dicebear.com/7.x/thumbs/svg?seed=anonymous"} />
          <span>{record.user}</span>
        </Space>
      ),
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

        {/* Stats Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden group rounded-xl border-0">
              <div className="relative z-10">
                <Statistic
                  title={<span className="text-blue-100 text-sm font-medium">ทั้งหมด</span>}
                  value={stats.total}
                  valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                />
              </div>
              <FileTextOutlined className="absolute -right-6 -bottom-6 text-[100px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-orange-400 to-amber-500 relative overflow-hidden group rounded-xl border-0">
              <div className="relative z-10">
                <Statistic
                  title={<span className="text-orange-100 text-sm font-medium">รอตรวจสอบ</span>}
                  value={stats.pending}
                  valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                />
              </div>
              <ClockCircleOutlined className="absolute -right-6 -bottom-6 text-[100px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 relative overflow-hidden group rounded-xl border-0">
              <div className="relative z-10">
                <Statistic
                  title={<span className="text-green-100 text-sm font-medium">อนุมัติแล้ว</span>}
                  value={stats.approved}
                  valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                />
              </div>
              <CheckCircleOutlined className="absolute -right-6 -bottom-6 text-[100px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-red-500 to-rose-600 relative overflow-hidden group rounded-xl border-0">
              <div className="relative z-10">
                <Statistic
                  title={<span className="text-red-100 text-sm font-medium">ปฏิเสธ</span>}
                  value={stats.rejected}
                  valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                />
              </div>
              <CloseCircleOutlined className="absolute -right-6 -bottom-6 text-[100px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
            </Card>
          </Col>
        </Row>

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
      <Modal
        title={`ยืนยันลบคำขอ PR #${deleteTargetId}?`}
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          if (!deleteProcessing) setDeleteModalVisible(false);
        }}
        okText="ลบ"
        cancelText="ยกเลิก"
        okButtonProps={{ danger: true, loading: deleteProcessing }}
        cancelButtonProps={{ disabled: deleteProcessing }}
        centered
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
          <div>
            <p>การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <p>คุณต้องการลบคำขอนี้ใช่หรือไม่?</p>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default AnnouncementManage;