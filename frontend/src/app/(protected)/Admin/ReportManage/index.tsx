import React, { useEffect, useState } from "react";
import { Table, Card, Typography, Button, Tag, Space, Modal, Select, message, Descriptions, Image } from "antd";
import { EyeOutlined, EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ReportService, type Report } from "../../../../services/http/report";

const { Title } = Typography;
const { Option } = Select;

const ReportManage: React.FC = () => {
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await ReportService.getAdminReports({ page: 1, page_size: 100 });
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
      message.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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
      message.success("Status updated successfully");
      setStatusVisible(false);
      fetchReports(); // Refresh list
    } catch (error) {
      console.error("Update status error:", error);
      message.error("Failed to update status");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Reporter",
      key: "reporter",
      render: (_: any, record: Report) => {
        // Assuming reporter object exists based on preloads, otherwise show ID
        return (record as any).reporter?.username || (record as any).reporter?.email || `User #${record.reporter_id}`;
      }
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Target",
      key: "target",
      render: (_: any, record: Report) => (
        <span>
          <Tag color="blue">{record.target_type}</Tag>
          {record.target_id && <span>#{record.target_id}</span>}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: Report) => {
        let color = "default";
        // Map by id first, then fallback to name (backend field is `name` not `status_name`)
        const statusId = record.status?.id || record.status_id;
        const statusName = (() => {
          if (statusId === 1) return "Pending";
          if (statusId === 2) return "In Progress";
          if (statusId === 3) return "Resolved";
          if (statusId === 4) return "Rejected";
          return record.status?.status_name || "Unknown";
        })();

        if (statusId === 1) color = "orange";
        if (statusId === 2) color = "processing";
        if (statusId === 3) color = "success";
        if (statusId === 4) color = "error";

        return <Tag color={color}>{statusName}</Tag>;
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Report) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button icon={<EditOutlined />} type="primary" onClick={() => handleEditStatus(record)} />
        </Space>
      ),
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-6">
      <Card className="rounded-2xl shadow-sm" bodyStyle={{ padding: "40px" }}>
        <div className="flex justify-between items-center mb-6">
          <Title level={3} style={{ color: "#C42E0A", margin: 0 }}>
            Report Management
          </Title>
          <Button onClick={fetchReports}>Refresh</Button>
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
          title="Report Details"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>
              Close
            </Button>,
          ]}
          width={700}
        >
          {currentReport && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="ID">{currentReport.id}</Descriptions.Item>
              <Descriptions.Item label="Reporter">
                {(currentReport as any).reporter?.username || `User #${currentReport.reporter_id}`}
              </Descriptions.Item>
              <Descriptions.Item label="Title">{currentReport.title}</Descriptions.Item>
              <Descriptions.Item label="Description">
                <div className="whitespace-pre-wrap">{currentReport.description}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Target">
                {currentReport.target_type} #{currentReport.target_id}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {(() => {
                  const sid = currentReport.status?.id || currentReport.status_id;
                  if (sid === 1) return "Pending";
                  if (sid === 2) return "In Progress";
                  if (sid === 3) return "Resolved";
                  if (sid === 4) return "Rejected";
                  return currentReport.status?.status_name || "Unknown";
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Medias">
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
                ) : "No Media"}
              </Descriptions.Item>
              <Descriptions.Item label="Admin Handler">
                {(currentReport as any).admin?.username || ((currentReport as any).admin_id ? `Admin #${(currentReport as any).admin_id}` : "-")}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Update Status Modal */}
        <Modal
          title="Update Report Status"
          open={statusVisible}
          onOk={submitStatusUpdate}
          onCancel={() => setStatusVisible(false)}
        >
          <div className="py-4">
            <p className="mb-2">Select new status for report #{currentReport?.id}:</p>
            <Select
              value={newStatus}
              onChange={setNewStatus}
              style={{ width: "100%" }}
            >
              {/* TODO: Fetch these from backend if possible, or use constants */}
              <Option value={1}>Pending</Option>
              <Option value={2}>In Progress</Option>
              <Option value={3}>Resolved</Option>
              <Option value={4}>Rejected</Option>
            </Select>
          </div>
        </Modal>
      </Card>
    </main>
  );
};

export default ReportManage;