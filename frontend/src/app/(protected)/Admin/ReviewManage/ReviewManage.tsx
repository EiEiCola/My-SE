import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Row,
  Col,
  Card,
  Tag,
  Avatar,
  Space,
  Tooltip,
  Modal,
  Drawer,
  Form,
  message,
  Select,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  StarFilled,
  LikeOutlined,
  DislikeOutlined,
  FilterOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  fetchAdminReviews,
  deleteAdminReview,
  type AdminReviewItem,
} from "../../../../services/http/admin_review_service";
import { categoryAPI } from "../../../../services/http/poll";
import "./ReviewManage.css";

const { TextArea } = Input;
const { Option } = Select;

const ReviewManage: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, active, reported, admin_deleted, owner_deleted
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [reportedCount, setReportedCount] = useState(0);
  const pageSize = 10;

  const [allCategories, setAllCategories] = useState<{ id: number; title: string }[]>([]);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null);
  const [deleteForm] = Form.useForm();

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailReview, setDetailReview] = useState<AdminReviewItem | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // โหลดทั้งหมดมาก่อน (pageSize ใหญ่) เพื่อให้กรองฝั่ง client ได้ครบ
      const data = await fetchAdminReviews(1, 1000, "");
      setReviews(data.data || []);
      setTotal(data.total || 0);
      setDeletedCount(data.deleted_count || 0);
      setReportedCount(data.reported_count || 0);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      message.error("ไม่สามารถโหลดข้อมูลรีวิวได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  useEffect(() => {
    // Fetch actual categories from system
    categoryAPI.listMain().then((res) => {
      setAllCategories(res || []);
    });
  }, []);

  const handleDeleteClick = (record: AdminReviewItem) => {
    setSelectedReview(record);
    setIsDeleteModalOpen(true);
    deleteForm.resetFields();
  };

  const handleViewDetail = (record: AdminReviewItem) => {
    setDetailReview(record);
    setIsDetailModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const values = await deleteForm.validateFields();
      if (!selectedReview) return;

      await deleteAdminReview(selectedReview.id, values.reason);
      message.success("ลบรีวิวสำเร็จ");
      setIsDeleteModalOpen(false);

      // reload
      setTimeout(() => loadReviews(), 200);
    } catch (error: any) {
      if (error?.name !== "ValidationError") {
        message.error(error?.message || "ลบไม่สำเร็จ");
      }
    }
  };

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        !searchTerm.trim() ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.member?.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.tags || []).some((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? !r.deleted_at && (r.report_count || 0) === 0
            : statusFilter === "reported"
              ? (r.report_count || 0) > 0 && !r.deleted_at
              : statusFilter === "admin_deleted"
                ? r.deleted_at && r.deleted_by_type === "ADMIN"
                : statusFilter === "owner_deleted"
                  ? r.deleted_at && r.deleted_by_type === "OWNER"
                  : true;

      const matchCategory =
        categoryFilter === "all"
          ? true
          : r.main_category?.title === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [reviews, searchTerm, statusFilter, categoryFilter]);



  const columns: ColumnsType<AdminReviewItem> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => <span className="id-tag">#{id}</span>,
    },
    {
      title: "ผู้เขียน",
      dataIndex: "member",
      key: "member",
      render: (member) => (
        <Space>
          <Avatar
            src={member?.member_picture}
            className="premium-avatar"
            style={{ backgroundColor: "#87d068" }}
          >
            {(member?.username || "?").charAt(0).toUpperCase()}
          </Avatar>
          <div className="author-info">
            <div className="author-name">{member?.username || "-"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "รีวิว",
      key: "content",
      render: (_, record) => (
        <div className="review-content-col">
          <div className="review-title-text">{record.title}</div>
          <div className="review-snippet">
            {record.content.length > 60
              ? record.content.substring(0, 60) + "..."
              : record.content}
          </div>
          <div className="review-metrics">
            <Tag icon={<StarFilled style={{ color: "#fadb14" }} />} className="rating-tag">
              {Number(record.rating).toFixed(1)}
            </Tag>
            <span className="metric-item">
              <LikeOutlined /> {record.helpful_count}
            </span>
            <span className="metric-item">
              <DislikeOutlined /> {record.not_helpful_count}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "หมวดหมู่",
      dataIndex: "main_category",
      key: "category",
      render: (cat) => (
        <Tag color="blue" className="rounded-tag">
          {cat?.title || "ทั่วไป"}
        </Tag>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      render: (_, record) => {
        if (record.deleted_at) return <Tag color="error" className="status-badge">ถูกลบแล้ว</Tag>;
        if ((record.report_count || 0) > 0)
          return (
            <Tag color="warning" className="status-badge">
              ถูกรายงาน ({record.report_count})
            </Tag>
          );
        return <Tag color="success" className="status-badge">ปกติ</Tag>;
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space>

          {!record.deleted_at && (
            <Tooltip title="ลบรีวิว">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(record);
                }}
                className="action-btn delete-btn"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const stats = useMemo(() => {
    return {
      total,
      deleted: deletedCount,
      reported: reportedCount
    };
  }, [total, deletedCount, reportedCount]);

  return (
    <div className="review-manage-page">
      <div className="page-header-premium">
        <div className="header-text">
          <h1>จัดการรีวิว</h1>
          <p>จัดการและตรวจสอบรีวิวทั้งหมดในระบบ</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat">
          <div className="k">รีวิวทั้งหมด</div>
          <div className="v">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="k" style={{ color: "#f97316" }}>ถูกรายงาน</div>
          <div className="v">{stats.reported}</div>
        </div>
        <div className="stat">
          <div className="k">Total Deleted</div>
          <div className="v">{stats.deleted}</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <div className="searchbox">
          <span className="search-ico">⌕</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตามหัวข้อ, ชื่อผู้เขียน, หรือ แท็ก..."
          />
        </div>

        <div className="filter">
          <span>สถานะ</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">ปกติ</option>
            <option value="reported">ถูกรายงาน</option>
            <option value="admin_deleted">Admin ลบ</option>
            <option value="owner_deleted">Owner ลบ</option>
          </select>
        </div>

        <div className="filter">
          <span>หมวดหมู่</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">ทุกหมวดหมู่</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.title}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setCategoryFilter("all");
            setPage(1);
          }}
          style={{ flexShrink: 0 }}
        >
          🔄 รีเซ็ต
        </button>
      </div>

      <Card className="table-card-premium">

        <Table
          columns={columns}
          dataSource={filteredReviews}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            total: filteredReviews.length,
            pageSize: pageSize,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          className="premium-table"
          locale={{ emptyText: <Empty description="ไม่พบรีวิว" /> }}
          onRow={(record) => ({
            onClick: () => handleViewDetail(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* Delete Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>ยืนยันการลบรีวิว</span>
          </Space>
        }
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        okButtonProps={{ danger: true, className: "premium-btn-danger" }}
        cancelButtonProps={{ className: "premium-btn-secondary" }}
        centered
      >
        <Form form={deleteForm} layout="vertical">
          <p>
            คุณกำลังจะลบรีวิวหัวข้อ: <strong>{selectedReview?.title}</strong>
          </p>
          <Form.Item
            name="reason"
            label="เหตุผลในการลบ"
            rules={[{ required: true, message: "กรุณาระบุเหตุผลในการลบ" }]}
          >
            <TextArea
              rows={4}
              placeholder="ระบุเหตุผลที่ต้องการลบ (จะแสดงให้ผู้เขียนรีวิวเห็น)"
              className="premium-textarea"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="รายละเอียดรีวิว"
        placement="right"
        width={600}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      >
        {detailReview && (
          <div className="review-detail-body">
            <div className="detail-header">
              <Space align="start" size="large">
                <Avatar
                  size={64}
                  src={detailReview.member?.member_picture}
                  style={{ backgroundColor: "#87d068" }}
                >
                  {(detailReview.member?.username || "?").charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <h2 className="detail-review-title">{detailReview.title}</h2>
                  <div className="detail-author">
                    โดย {detailReview.member?.username || "-"} •{" "}
                    {new Date(detailReview.created_at).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {detailReview.is_anonymous && (
                      <Tag color="purple" style={{ marginLeft: 8 }}>
                        🔒 ไม่เปิดเผยชื่อ
                      </Tag>
                    )}
                  </div>
                  <div className="detail-tags">
                    <Tag color="gold" icon={<StarFilled />}>
                      {Number(detailReview.rating).toFixed(1)}
                    </Tag>
                    {/* Category Hierarchy */}
                    {detailReview.main_category && (
                      <Tag color="cyan">
                        {detailReview.main_category.title}
                        {detailReview.sub_category_l1 && ` > ${detailReview.sub_category_l1.title}`}
                        {detailReview.sub_category_l2 && ` > ${detailReview.sub_category_l2.title}`}
                      </Tag>
                    )}
                    {(detailReview.report_count || 0) > 0 && (
                      <Tag color="warning">ถูกรายงาน ({detailReview.report_count})</Tag>
                    )}
                  </div>
                </div>
              </Space>
            </div>

            <div className="detail-content-box">
              <p>{detailReview.content}</p>
            </div>

            {/* Images - แสดงก่อน stats */}
            {detailReview.review_images && detailReview.review_images.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto" }}>
                {detailReview.review_images.map((img: any, i: number) => (
                  <img
                    key={i}
                    src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${img.url}`}
                    alt=""
                    onClick={() => setLightboxImg(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${img.url}`)}
                    style={{ height: 150, borderRadius: 8, border: "1px solid #e2e8f0", cursor: "zoom-in" }}
                  />
                ))}
              </div>
            )}

            {/* Reports - แสดงรายงาน */}
            {detailReview.report_count > 0 && (
              <div
                style={{
                  background: "#fff7ed",
                  border: "1px solid #ffedd5",
                  padding: 16,
                  borderRadius: 8,
                  marginTop: 16,
                }}
              >
                <div style={{ fontWeight: 600, color: "#9a3412", marginBottom: 12 }}>
                  ⚠️ รีวิวนี้ถูกรายงาน ({detailReview.report_count} ครั้ง)
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  รีวิวนี้ได้รับการรายงานจากผู้ใช้งาน กรุณาตรวจสอบเนื้อหา
                </div>
              </div>
            )}

            <Row gutter={16} className="detail-stats" style={{ marginTop: 16 }}>
              <Col span={12}>
                <div className="mini-stat-box">
                  <div className="label"><LikeOutlined /> มีประโยชน์</div>
                  <div className="value">{detailReview.helpful_count}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="mini-stat-box">
                  <div className="label"><DislikeOutlined /> ไม่มีประโยชน์</div>
                  <div className="value">{detailReview.not_helpful_count}</div>
                </div>
              </Col>
            </Row>

            {detailReview.deleted_at && (
              <div
                style={{
                  background: detailReview.deleted_by_type === "ADMIN" ? "#fef2f2" : "#fffbeb",
                  border: detailReview.deleted_by_type === "ADMIN" ? "2px solid #dc2626" : "2px solid #d97706",
                  color: detailReview.deleted_by_type === "ADMIN" ? "#b91c1c" : "#92400e",
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 20,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  {detailReview.deleted_by_type === "ADMIN" && "🚫 รีวิวนี้ถูกลบโดยแอดมิน"}
                  {detailReview.deleted_by_type === "OWNER" && "🗑️ รีวิวนี้ถูกลบโดยเจ้าของ"}
                  {!detailReview.deleted_by_type && "❌ รีวิวนี้ถูกลบแล้ว"}
                </div>
                <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                  <div>
                    <strong>ลบเมื่อ:</strong> {new Date(detailReview.deleted_at).toLocaleString("th-TH", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {detailReview.deleted_by_type === "ADMIN" && detailReview.admin_delete_reason && (
                    <div style={{ marginTop: 8, padding: 12, background: "rgba(220, 38, 38, 0.1)", borderRadius: 8 }}>
                      <strong>📌 เหตุผลจากแอดมิน:</strong>
                      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>
                        "{detailReview.admin_delete_reason}"
                      </div>
                    </div>
                  )}
                  {detailReview.deleted_by_type === "OWNER" && (
                    <div style={{ marginTop: 8, fontStyle: "italic", opacity: 0.9 }}>
                      เจ้าของรีวิวเป็นผู้ลบเอง
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* LIGHTBOX */}
      {lightboxImg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            cursor: "pointer",
          }}
          onClick={() => setLightboxImg(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute",
                top: -40,
                right: 0,
                background: "white",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                fontSize: 20,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
              onClick={() => setLightboxImg(null)}
            >
              ✕
            </button>
            <img
              src={lightboxImg}
              alt="Full size"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: 8,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManage;
