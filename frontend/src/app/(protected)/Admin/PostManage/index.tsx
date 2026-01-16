// PostManage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Dropdown,
  Drawer,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  SearchOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import adminPostService from "../../../../services/http/admin_post_service";
import { ReportService } from "../../../../services/http/report";

const { Search, TextArea } = Input;

// ---------- Types ----------
type PostStatus = "active" | "reported" | "deleted";

type PostReport = {
  id: number;
  reporter: string;
  reason: string;
  createdAt: string;
};

type PostLog = {
  id: number;
  action: string;
  by: string;
  createdAt: string;
};

type PostItem = {
  id: number;
  authorName: string;
  authorAvatar: string;
  title: string;
  category: string;
  createdAt: string;
  status: PostStatus;
  reportCount: number;
  content: string;
  deletedReason?: string;
  reports?: PostReport[];
  logs?: PostLog[];
};

// ---------- Component ----------
const PostManage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [reportCounts, setReportCounts] = useState<Record<number, number>>({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [deleteForm] = Form.useForm();

  // Drawer รายละเอียดโพสต์
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<PostItem | null>(null);

  // Fetch posts and reports from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch posts
        const response = await adminPostService.getAll();
        const apiPosts = response.data.data;

        // Fetch reports for posts
        const reportsResponse = await ReportService.getAdminReports({
          page: 1,
          page_size: 1000,
          target_type: "post",
        });
        const reports = reportsResponse.data.data || [];

        console.log("📊 Reports fetched:", reports);
        console.log("📊 Reports length:", reports.length);

        // Count reports per post
        const counts: Record<number, number> = {};
        reports.forEach((report: any) => {
          console.log("📋 Report:", {
            id: report.id,
            target_type: report.target_type,
            target_id: report.target_id,
          });

          if (report.target_id) {
            counts[report.target_id] = (counts[report.target_id] || 0) + 1;
          }
        });

        console.log("📊 Report counts by post ID:", counts);
        setReportCounts(counts);

        // Map API response to PostItem format
        const mappedPosts: PostItem[] = apiPosts.map((p) => {
          // Get author name from backend
          let authorName = "ไม่เปิดเผยชื่อ";
          let authorAvatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=anonymous`;
          if (!p.is_anonymous && p.author) {
            authorName = p.author.username || `${p.author.first_name} ${p.author.last_name}`;
            authorAvatar = p.author.member_picture || `https://ap.dicebear.com/7.x/thumbs/svg?seed=user${p.author_id}`;
          }

          // Get category name from backend
          let categoryName = "ไม่มีหมวดหมู่";
          if (p.MainCategory?.title) {
            categoryName = p.MainCategory.title;
            if (p.SubCategoryL1?.title) {
              categoryName += ` > ${p.SubCategoryL1.title}`;
            }
          }

          // Get report count for this post
          const reportCount = counts[p.ID] || 0;

          console.log(`📝 Post ID ${p.ID}:`, {
            title: p.title,
            reportCount,
            hasCountInMap: counts.hasOwnProperty(p.ID),
          });

          // Set status based on report count
          let postStatus: PostStatus = (p.status?.toLowerCase() || "active") as PostStatus;
          if (reportCount > 0 && postStatus === "active") {
            postStatus = "reported";
          }

          return {
            id: p.ID,
            authorName,
            authorAvatar,
            title: p.title,
            category: categoryName,
            createdAt: new Date(p.created_at).toLocaleString("th-TH"),
            status: postStatus,
            reportCount,
            content: p.content,
          };
        });

        console.log("✅ Final mapped posts:", mappedPosts);
        setPosts(mappedPosts);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---------- สถิติ ----------
  const totalReported = posts.filter((p) => p.status === "reported").length;
  const totalDeleted = posts.filter((p) => p.status === "deleted").length;
  const totalActive = posts.filter((p) => p.status === "active").length;

  const categories = useMemo(
    () => Array.from(new Set(posts.map((p) => p.category))),
    [posts]
  );

  // ---------- Filter / Search ----------
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        !searchText.trim() ||
        p.title.toLowerCase().includes(searchText.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchText.toLowerCase()) ||
        p.category.toLowerCase().includes(searchText.toLowerCase());

      const matchStatus =
        statusFilter === "all" ? true : p.status === statusFilter;

      const matchCategory =
        categoryFilter === "all" ? true : p.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [posts, searchText, statusFilter, categoryFilter]);

  // ---------- การ์ด filter จากสถิติ ----------
  const handleStatusCardClick = (status: PostStatus) => {
    setStatusFilter((prev) => (prev === status ? "all" : status));
  };

  // ---------- เปิด modal ลบโพสต์ ----------
  const openDeleteModal = (post: PostItem) => {
    setSelectedPost(post);
    deleteForm.setFieldsValue({
      id: post.id,
      author: post.authorName,
      title: post.title,
      reason: "",
    });
    setDeleteModalOpen(true);
  };

  // ---------- Submit ลบโพสต์ ----------
  const handleSubmitDelete = async () => {
    try {
      const values = await deleteForm.validateFields();
      const reason: string = values.reason;

      if (!selectedPost) return;

      setDeleting(true);
      try {
        await adminPostService.delete(selectedPost.id, reason);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id
              ? {
                ...p,
                status: "deleted",
                deletedReason: reason,
              }
              : p
          )
        );
        setDeleteModalOpen(false);
        message.success("ลบโพสต์และบันทึกเหตุผลเรียบร้อยแล้ว");
      } catch (error) {
        console.error("Failed to delete post:", error);
        message.error("ไม่สามารถลบโพสต์ได้ กรุณาลองใหม่");
      } finally {
        setDeleting(false);
      }
    } catch {
      // validation ไม่ผ่าน
    }
  };

  // ---------- Drawer: รายละเอียดโพสต์ ----------
  const openDetailDrawer = async (post: PostItem) => {
    setDetailPost(post);
    setDetailOpen(true);

    // Fetch reports for this specific post
    try {
      const reportsResponse = await ReportService.getAdminReports({
        page: 1,
        page_size: 100,
        target_type: "post",
        target_id: post.id,
      });
      const reports = reportsResponse.data.data || [];

      // Map reports to PostReport format
      const mappedReports: PostReport[] = reports.map((r: any) => {
        // Reporter is a Member object with fields: Username, first_name, last_name
        let reporterName = "ไม่ระบุผู้รายงาน";
        if (r.reporter) {
          reporterName = r.reporter.Username ||
            r.reporter.username ||
            (r.reporter.first_name && r.reporter.last_name
              ? `${r.reporter.first_name} ${r.reporter.last_name}`
              : `สมาชิก #${r.reporter_id}`);
        }

        return {
          id: r.id || r.ID,
          reporter: reporterName,
          reason: r.description || r.title || "ไม่ระบุเหตุผล",
          createdAt: new Date(r.created_at).toLocaleString("th-TH"),
        };
      });

      // Update detailPost with reports
      setDetailPost(prev => prev ? {
        ...prev,
        reports: mappedReports,
      } : prev);
    } catch (error) {
      console.error("Failed to fetch reports for post:", error);
    }
  };

  // ---------- Status Tag ----------
  const statusTag = (status: PostStatus) => {
    if (status === "active") return <Tag color="green">เผยแพร่</Tag>;
    if (status === "reported") return <Tag color="orange">ถูกรายงาน</Tag>;
    return <Tag color="red">ถูกลบแล้ว</Tag>;
  };

  // ---------- Columns ----------
  const columns: ColumnsType<PostItem> = [
    {
      title: "Post ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Author",
      dataIndex: "authorName",
      key: "author",
      render: (_, record) => (
        <Space>
          <Avatar size={36} src={record.authorAvatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.authorName}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {record.createdAt}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (value, record) => (
        <Tooltip title={value}>
          <Button
            type="link"
            style={{ padding: 0, height: "auto" }}
            onClick={(e) => {
              e.stopPropagation();
              openDetailDrawer(record);
            }}
          >
            {value}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 140,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: PostStatus) => statusTag(status),
    },
    {
      title: "Reports",
      dataIndex: "reportCount",
      key: "reports",
      width: 90,
      align: "right",
    },
    {
      title: "",
      key: "actions",
      width: 80,
      align: "right",
      render: (_, record) => {
        const items: MenuProps["items"] = [
          {
            key: "delete",
            label: "ลบโพสต์นี้",
            icon: <DeleteOutlined />,
            danger: true,
          },
        ];

        return (
          <Space>
            <Tooltip title="ลบโพสต์">
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: "#ef4444" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(record);
                }}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items,
                onClick: ({ key }) => {
                  if (key === "delete") openDeleteModal(record);
                },
              }}
              trigger={["click"]}
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // =========================================================
  // Render
  // =========================================================
  return (
    <main
      style={{
        flex: 1,
        padding: 24,
        background: "transparent",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
              จัดการโพสต์
            </h1>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              ตรวจสอบโพสต์ที่ถูกรายงาน ลบโพสต์ที่ไม่เหมาะสม และจัดการเนื้อหาใน
              Community
            </div>
          </Col>
        </Row>

        {/* Stat Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => handleStatusCardClick("reported")}
              bordered={false}
              bodyStyle={{ padding: 18 }}
              style={{
                borderRadius: 18,
                background: "linear-gradient(135deg, #ffedd5, #fdba74)",
                boxShadow:
                  statusFilter === "reported"
                    ? "0 18px 40px rgba(180, 83, 9, 0.35)"
                    : "0 18px 35px rgba(180, 83, 9, 0.25)",
                cursor: "pointer",
                transform:
                  statusFilter === "reported" ? "translateY(-2px)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: 13, color: "#9a3412", marginBottom: 6 }}>
                โพสต์ที่ถูกรายงาน
              </div>
              <div
                style={{ fontSize: 34, fontWeight: 800, color: "#7c2d12" }}
              >
                {totalReported}
              </div>
              <div style={{ fontSize: 11, color: "#9a3412", marginTop: 4 }}>
                ต้องการการตรวจสอบจากแอดมิน
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => handleStatusCardClick("deleted")}
              bordered={false}
              bodyStyle={{ padding: 18 }}
              style={{
                borderRadius: 18,
                background: "linear-gradient(135deg, #fee2e2, #fca5a5)",
                boxShadow:
                  statusFilter === "deleted"
                    ? "0 18px 40px rgba(185, 28, 28, 0.35)"
                    : "0 18px 35px rgba(185, 28, 28, 0.25)",
                cursor: "pointer",
                transform:
                  statusFilter === "deleted" ? "translateY(-2px)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: 13, color: "#b91c1c", marginBottom: 6 }}>
                โพสต์ที่ถูกลบแล้ว
              </div>
              <div
                style={{ fontSize: 34, fontWeight: 800, color: "#7f1d1d" }}
              >
                {totalDeleted}
              </div>
              <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>
                ถูกลบโดยแอดมินพร้อมเหตุผลแจ้งเจ้าของโพสต์
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => handleStatusCardClick("active")}
              bordered={false}
              bodyStyle={{ padding: 18 }}
              style={{
                borderRadius: 18,
                background: "linear-gradient(135deg, #e0f2fe, #bfdbfe)",
                boxShadow:
                  statusFilter === "active"
                    ? "0 18px 40px rgba(37, 99, 235, 0.35)"
                    : "0 18px 35px rgba(37, 99, 235, 0.25)",
                cursor: "pointer",
                transform:
                  statusFilter === "active" ? "translateY(-2px)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: 13, color: "#1d4ed8", marginBottom: 6 }}>
                โพสต์ที่ออนไลน์อยู่
              </div>
              <div
                style={{ fontSize: 34, fontWeight: 800, color: "#1e3a8a" }}
              >
                {totalActive}
              </div>
              <div style={{ fontSize: 11, color: "#1d4ed8", marginTop: 4 }}>
                โพสต์ที่ยังแสดงใน Community ตอนนี้
              </div>
            </Card>
          </Col>
        </Row>

        {/* Controls */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 12 }}
          gutter={[12, 12]}
        >
          <Col xs={24} md={10}>
            <Search
              placeholder="ค้นหาโพสต์ตามหัวข้อ ผู้เขียน หรือหมวดหมู่..."
              allowClear
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <Space wrap>
              <Select
                size="middle"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                style={{ width: 140 }}
                suffixIcon={<FilterOutlined />}
              >
                <Select.Option value="all">ทุกสถานะ</Select.Option>
                <Select.Option value="active">เผยแพร่</Select.Option>
                <Select.Option value="reported">ถูกรายงาน</Select.Option>
                <Select.Option value="deleted">ถูกลบแล้ว</Select.Option>
              </Select>

              <Select
                allowClear={false}
                size="middle"
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                style={{ width: 160 }}
              >
                <Select.Option value="all">ทุกหมวดหมู่</Select.Option>
                {categories.map((c) => (
                  <Select.Option key={c} value={c}>
                    {c}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Card
          size="small"
          bordered={false}
          style={{
            borderRadius: 20,
            boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={filteredPosts}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            size="middle"
            style={{ borderRadius: 20, overflow: "hidden" }}
            onRow={(record) => ({
              onClick: () => openDetailDrawer(record),
            })}
          />
        </Card>

        {/* Delete Post Modal */}
        <Modal
          open={deleteModalOpen}
          title="Delete Post"
          okText="Delete"
          okType="danger"
          cancelText="Cancel"
          onCancel={() => setDeleteModalOpen(false)}
          onOk={handleSubmitDelete}
          confirmLoading={deleting}
          destroyOnClose
        >
          {selectedPost && (
            <>
              <Form
                form={deleteForm}
                layout="vertical"
                initialValues={{
                  id: selectedPost.id,
                  author: selectedPost.authorName,
                  title: selectedPost.title,
                  reason: "",
                }}
              >
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Post ID" name="id">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Author" name="author">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="หัวข้อโพสต์" name="title">
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  label="กรุณาใส่เหตุผลของการลบโพสต์"
                  name="reason"
                  rules={[
                    {
                      required: true,
                      message: "กรุณากรอกเหตุผลในการลบโพสต์",
                    },
                    {
                      min: 10,
                      message: "เหตุผลควรมีความยาวอย่างน้อย 10 ตัวอักษร",
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="เช่น เนื้อหาไม่เหมาะสม, มีการโจมตีผู้อื่น, มีคำหยาบคาย ฯลฯ (ข้อความนี้จะถูกส่งแจ้งเตือนไปยังเจ้าของโพสต์)"
                  />
                </Form.Item>
              </Form>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                เมื่อกดปุ่ม <b>Delete</b> ระบบจะ:
                <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                  <li>เปลี่ยนสถานะโพสต์เป็น “ถูกลบแล้ว”</li>
                  <li>ซ่อนโพสต์ออกจากหน้า Community</li>
                  <li>ส่งแจ้งเตือนไปยังเจ้าของโพสต์พร้อมเหตุผลที่กรอกด้านบน</li>
                </ul>
              </div>
            </>
          )}
        </Modal>

        {/* Drawer: รายละเอียดโพสต์ */}
        <Drawer
          title="รายละเอียดโพสต์"
          placement="right"
          width={520}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        >
          {detailPost && (
            <div>
              {/* ส่วนบน: ผู้เขียน + status */}
              <Space align="center" style={{ marginBottom: 16 }}>
                <Avatar size={48} src={detailPost.authorAvatar} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {detailPost.authorName}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    โพสต์เมื่อ {detailPost.createdAt}
                  </div>
                </div>
                <span style={{ marginLeft: "auto" }}>{statusTag(detailPost.status)}</span>
              </Space>

              {/* Title + Category */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {detailPost.title}
                </div>
                <Tag color="geekblue">{detailPost.category}</Tag>
              </div>

              {/* Post ID + Reports */}
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 12,
                }}
              >
                Post ID: <code>{detailPost.id}</code> • Reports:{" "}
                {detailPost.reportCount}
              </div>

              {/* Content */}
              <Card
                size="small"
                bordered={false}
                style={{
                  borderRadius: 12,
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {detailPost.content}
                </div>
              </Card>

              {/* Deleted reason */}
              {detailPost.status === "deleted" && detailPost.deletedReason && (
                <>
                  <Divider orientation="left" plain>
                    เหตุผลที่ถูกลบ
                  </Divider>
                  <Card
                    size="small"
                    bordered={false}
                    style={{
                      borderRadius: 10,
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#991b1b",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {detailPost.deletedReason}
                    </div>
                  </Card>
                </>
              )}

              {/* Reports */}
              <Divider orientation="left" plain>
                ประวัติการถูกรายงาน
              </Divider>
              {detailPost.reports && detailPost.reports.length > 0 ? (
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                  {detailPost.reports.map((r) => (
                    <Card
                      key={r.id}
                      size="small"
                      bordered={false}
                      style={{
                        borderRadius: 10,
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontSize: 13, marginBottom: 2 }}>
                        <b>{r.reporter}</b>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#4b5563",
                          marginBottom: 4,
                        }}
                      >
                        {r.reason}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#9ca3af" }}
                      >{`รายงานเมื่อ ${r.createdAt}`}</div>
                    </Card>
                  ))}
                </Space>
              ) : (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  ยังไม่มีการถูกรายงานโพสต์นี้
                </div>
              )}

              {/* Logs */}
              <Divider orientation="left" plain>
                ประวัติการดำเนินการ
              </Divider>
              {detailPost.logs && detailPost.logs.length > 0 ? (
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size={4}
                >
                  {detailPost.logs.map((log) => (
                    <div
                      key={log.id}
                      style={{ fontSize: 12, color: "#4b5563" }}
                    >
                      <b>{log.action}</b> โดย {log.by}{" "}
                      <span style={{ color: "#9ca3af" }}>
                        ({log.createdAt})
                      </span>
                    </div>
                  ))}
                </Space>
              ) : (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  ยังไม่มีประวัติการดำเนินการ
                </div>
              )}

              {/* Actions */}
              <Divider />
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    if (!detailPost) return;
                    openDeleteModal(detailPost);
                  }}
                  danger
                  icon={<DeleteOutlined />}
                >
                  ลบโพสต์นี้
                </Button>
              </Space>
            </div>
          )}
        </Drawer>
      </div>
    </main>
  );
};

export default PostManage;
