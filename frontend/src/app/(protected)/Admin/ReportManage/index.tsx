import React, { useEffect, useState } from "react";
import { Table, Card, Typography, Button, Tag, Space, Modal, Select, message, Descriptions, Image, Input, Row, Col } from "antd";
import { EyeOutlined, EditOutlined, ExclamationCircleOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined, LinkOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { ReportService, type Report } from "../../../../services/http/report";

const { Title } = Typography;
const { Option } = Select;

const ReportManage: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url;
    return `${API_BASE}/uploads/${url}`;
  };

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [statusVisible, setStatusVisible] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<number>(0);

  // Filter States
  const [searchText, setSearchText] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await ReportService.getAdminReports({
        page: 1,
        page_size: 100,
        q: searchText,
        status_id: filterStatus,
        target_type: filterType
      });
      // Helper to handle different response structures if needed, strictly speaking based on controller it returns { data: items, total: count }
      // The controller returns: c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
      // So res.data.data is the array.
      if (res.data && Array.isArray(res.data.data)) {
        setReports(res.data.data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      message.error("โหลดรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [searchText, filterStatus, filterType]);

  const handleView = (report: Report) => {
    setCurrentReport(report);
    setDetailVisible(true);
  };

  const handleEditStatus = (report: Report) => {
    setCurrentReport(report);
    setNewStatus(report.status_id);
    setStatusVisible(true);
  };

  const submitStatusUpdate = async () => {
    if (!currentReport) return;
    try {
      await ReportService.updateReportStatus(currentReport.id, newStatus);
      message.success("อัปเดตสถานะสำเร็จ");
      setStatusVisible(false);
      fetchReports(); // Refresh list
    } catch (error) {
      console.error("Update status error:", error);
      message.error("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  // Navigate to reported post/review
  const handleViewTarget = (report: Report) => {
    if (!report.target_id) {
      message.warning("ไม่มีข้อมูลเป้าหมาย");
      return;
    }

    const targetType = (report.target_type || "").toLowerCase();

    if (targetType === "post") {
      // Navigate to post detail
      window.open(`/User/Post/detail/${report.target_id}`, "_blank");
    } else if (targetType === "review") {
      // Navigate to review - you may need to adjust this path
      window.open(`/User/Review`, "_blank");
      message.info("กรุณาค้นหารีวิว ID: " + report.target_id);
    } else {
      message.warning(`ไม่สามารถดู ${report.target_type} ได้`);
    }
  };

  // Delete reported post/review
  const handleDeleteTarget = (report: Report) => {
    if (!report.target_id) {
      message.warning("ไม่มีข้อมูลเป้าหมาย");
      return;
    }

    const targetType = (report.target_type || "").toLowerCase();

    Modal.confirm({
      title: `ยืนยันการลบ ${report.target_type}`,
      icon: <ExclamationCircleOutlined />,
      content: `คุณต้องการลบ ${report.target_type} ID: ${report.target_id} หรือไม่?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
          const token = localStorage.getItem("token");

          let endpoint = "";
          if (targetType === "post") {
            endpoint = `${API_BASE}/api/member/posts/${report.target_id}`;
          } else if (targetType === "review") {
            endpoint = `${API_BASE}/api/member/reviews/${report.target_id}`;
          } else {
            message.error(`ไม่สามารถลบ ${report.target_type} ได้`);
            return;
          }

          const response = await fetch(endpoint, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to delete");
          }

          message.success(`ลบ ${report.target_type} สำเร็จ`);

          // Update report status to "resolved"
          await ReportService.updateReportStatus(report.id, 3);
          fetchReports();
        } catch (error) {
          console.error("Delete error:", error);
          message.error(`ไม่สามารถลบ ${report.target_type} ได้`);
        }
      },
    });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "ผู้แจ้ง",
      key: "reporter",
      render: (_: any, record: Report) => {
        return (record.reporter?.username) || (record.reporter?.email) || `ผู้ใช้ #${record.reporter_id}`;
      }
    },
    {
      title: "หัวข้อ",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "เป้าหมาย",
      key: "target",
      render: (_: any, record: Report) => (
        <span>
          <Tag color="blue">{record.target_type}</Tag>
          {record.target_id && <span>#{record.target_id}</span>}
        </span>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      render: (_: any, record: Report) => {
        let color = "default";
        // Map by id first, then fallback to name (backend field is `name` not `status_name`)
        const statusId = record.status?.id || record.status_id;
        const statusName = (() => {
          if (statusId === 1) return "รอดำเนินการ";
          if (statusId === 2) return "กำลังดำเนินการ";
          if (statusId === 3) return "เสร็จสิ้น";
          if (statusId === 4) return "ปฏิเสธ";
          return record.status?.status_name || "ไม่ทราบ";
        })();

        if (statusId === 1) color = "orange";
        if (statusId === 2) color = "processing";
        if (statusId === 3) color = "success";
        if (statusId === 4) color = "error";

        return <Tag color={color}>{statusName}</Tag>;
      },
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "จัดการ",
      key: "action",
      width: 200,
      render: (_: any, record: Report) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="ดูรายละเอียดรายงาน"
          />
          <Button
            icon={<LinkOutlined />}
            onClick={() => handleViewTarget(record)}
            title={`ดู ${record.target_type}`}
            type="default"
          />
          <Button
            icon={<EditOutlined />}
            type="primary"
            onClick={() => handleEditStatus(record)}
            title="แก้ไขสถานะ"
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteTarget(record)}
            title={`ลบ ${record.target_type}`}
          />
        </Space>
      ),
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-6">
      <Card className="rounded-2xl shadow-sm" bodyStyle={{ padding: "40px" }}>
        <div style={{ marginBottom: 20 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="ค้นหา (หัวข้อ, รายละเอียด, ผู้แจ้ง)..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="สถานะ"
                style={{ width: "100%" }}
                allowClear
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
              >
                <Option value={1}>รอดำเนินการ</Option>
                <Option value={2}>กำลังดำเนินการ</Option>
                <Option value={3}>เสร็จสิ้น</Option>
                <Option value={4}>ปฏิเสธ</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="ประเภทเป้าหมาย"
                style={{ width: "100%" }}
                allowClear
                value={filterType}
                onChange={(val) => setFilterType(val)}
              >
                <Option value="announcement">Announcement</Option>
                <Option value="pr_submission">PR Submission</Option>
                <Option value="member">Member</Option>
                <Option value="post">Post</Option>
                <Option value="comment">Comment</Option>
                <Option value="review">Review</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Button icon={<ReloadOutlined />} onClick={fetchReports}>
                รีโหลด
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        {/* Detail Modal */}
        <Modal
          title="รายละเอียดรายงาน"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>
              ปิด
            </Button>,
          ]}
          width={700}
        >
          {currentReport && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="รหัส">{currentReport.id}</Descriptions.Item>
              <Descriptions.Item label="ผู้แจ้ง">
                {(currentReport as any).reporter?.username || `ผู้ใช้ #${currentReport.reporter_id}`}
              </Descriptions.Item>
              <Descriptions.Item label="หัวข้อ">{currentReport.title}</Descriptions.Item>
              <Descriptions.Item label="รายละเอียด">
                <div className="whitespace-pre-wrap">{currentReport.description}</div>
              </Descriptions.Item>
              <Descriptions.Item label="เป้าหมาย">
                {currentReport.target_type} #{currentReport.target_id}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                {(() => {
                  const sid = currentReport.status?.id || currentReport.status_id;
                  if (sid === 1) return "รอดำเนินการ";
                  if (sid === 2) return "กำลังดำเนินการ";
                  if (sid === 3) return "เสร็จสิ้น";
                  if (sid === 4) return "ปฏิเสธ";
                  return currentReport.status?.status_name || "ไม่ทราบ";
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="สื่อ">
                {currentReport.media && currentReport.media.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {currentReport.media.map((m, idx) => (
                      <Image
                        key={idx}
                        width={100}
                        src={resolveMediaUrl(m.url)}
                        alt="report-media"
                      />
                    ))}
                  </div>
                ) : "ไม่มีสื่อ"}
              </Descriptions.Item>
              <Descriptions.Item label="แอดมินผู้รับผิดชอบ">
                {(currentReport as any).admin?.username || ((currentReport as any).admin_id ? `แอดมิน #${(currentReport as any).admin_id}` : "-")}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Update Status Modal */}
        <Modal
          title="อัปเดตสถานะรายงาน"
          open={statusVisible}
          onOk={submitStatusUpdate}
          onCancel={() => setStatusVisible(false)}
        >
          <div className="py-4">
            <p className="mb-2">เลือกสถานะใหม่สำหรับรายงาน #{currentReport?.id}:</p>
            <Select
              value={newStatus}
              onChange={setNewStatus}
              style={{ width: "100%" }}
            >
              {/* TODO: Fetch these from backend if possible, or use constants */}
              <Option value={1}>รอดำเนินการ</Option>
              <Option value={2}>กำลังดำเนินการ</Option>
              <Option value={3}>เสร็จสิ้น</Option>
              <Option value={4}>ปฏิเสธ</Option>
            </Select>
          </div>
        </Modal>
      </Card>
    </main>

  );
};

export default ReportManage;