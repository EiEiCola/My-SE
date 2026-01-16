import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  Modal,
  message,
  Image,
  Descriptions,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  listAdminAnnouncements,
  deleteAdminAnnouncement,
} from "../../../../services/http/announcementAdmin";

const { Title } = Typography;
const { confirm } = Modal;

const AnnouncementsList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Detail Modal State
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await listAdminAnnouncements({ page, page_size: pageSize });
      setItems(Array.isArray(data.data) ? data.data : []);
      setTotal(data.total || 0);
    } catch (e: any) {
      console.error(e);
      message.error(e.message || "โหลดประกาศไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  // Delete State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteProcessing(true);
    try {
      await deleteAdminAnnouncement(deleteTargetId);
      message.success("ลบประกาศสำเร็จ");
      fetchData();
      setDeleteModalVisible(false);
      setDeleteTargetId(null);
    } catch (e: any) {
      console.error("Delete Announcement Error:", e);
      message.error(e.message || "ลบไม่สำเร็จ");
    } finally {
      setDeleteProcessing(false);
    }
  };

  const handleRowClick = (record: any) => {
    setCurrentAnnouncement(record);
    setDetailVisible(true);
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
      title: "หัวข้อ",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "ช่วงเผยแพร่",
      key: "period",
      width: 250,
      render: (_: any, record: any) => (
        <span>
          {new Date(record.publish_start_at).toLocaleDateString("th-TH")} —{" "}
          {new Date(record.publish_end_at).toLocaleDateString("th-TH")}
        </span>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 100,
      align: "center" as const,
      render: (_: any, record: any) => {
        const isActive = record.status_id === 1;
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "ใช้งาน" : "ปิด"}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 80,
      align: "center" as const,
      render: (_: any, record: any) => (
        <Tooltip title="ลบประกาศ">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.id);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-6">
      <Card className="rounded-2xl shadow-sm" bodyStyle={{ padding: "32px" }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={3} style={{ margin: 0, color: "#1f2937" }}>
              รายการประกาศ (หน้า User)
            </Title>
            <Typography.Text type="secondary">
              ประกาศที่เผยแพร่อยู่บนหน้าเว็บไซต์จริง
            </Typography.Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            รีเฟรช
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
          })}
        />

        {/* Detail Modal */}
        <Modal
          title="รายละเอียดประกาศ"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>
              ปิด
            </Button>,
          ]}
          width={700}
        >
          {currentAnnouncement && (
            <div className="space-y-6">
              {/* Image Cover */}
              {currentAnnouncement.media &&
                currentAnnouncement.media.length > 0 && (
                  <div className="flex justify-center bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                    <Image
                      src={
                        currentAnnouncement.media.find((m: any) => m.type === "image")?.url ||
                        currentAnnouncement.media[0]?.url
                      }
                      alt="cover"
                      style={{
                        maxHeight: "300px",
                        objectFit: "contain",
                        borderRadius: "8px",
                      }}
                      fallback="https://via.placeholder.com/500x300?text=No+Image"
                    />
                  </div>
                )}

              <Descriptions bordered column={1} labelStyle={{ width: '150px' }}>
                <Descriptions.Item label="หัวข้อ">
                  <span className="font-semibold text-lg">
                    {currentAnnouncement.title}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="ช่วงเวลาเผยแพร่">
                  {new Date(
                    currentAnnouncement.publish_start_at
                  ).toLocaleDateString("th-TH")}{" "}
                  -{" "}
                  {new Date(
                    currentAnnouncement.publish_end_at
                  ).toLocaleDateString("th-TH")}
                </Descriptions.Item>
                <Descriptions.Item label="รายละเอียด">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {currentAnnouncement.content || "-"}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="หมวดหมู่">
                  {currentAnnouncement.AnnouncementCategory?.title || currentAnnouncement.category || "ทั่วไป"}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>
      </Card>
      <Modal
        title="ยืนยันการลบประกาศ?"
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
            <p>ประกาศนี้จะถูกลบออกจากระบบถาวร</p>
            <p>คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?</p>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default AnnouncementsList;
