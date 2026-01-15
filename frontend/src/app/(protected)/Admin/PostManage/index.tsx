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

// ---------- Mock data ----------
const initialPosts: PostItem[] = [
  {
    id: 1,
    authorName: "Username1",
    authorAvatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=user1",
    title: "รีวิววิชา Operating System อาจารย์ A",
    category: "การศึกษา",
    createdAt: "2025-12-01 10:15",
    status: "reported",
    reportCount: 3,
    content:
      "ส่วนตัวรู้สึกว่าวิชานี้หนักพอสมควร งานเยอะ แต่ถ้าตั้งใจตามก็ทำข้อสอบได้อยู่ครับ แนะนำให้ทำแบบฝึกหัดทุกสัปดาห์ จะช่วยมากตอนใกล้สอบ",
    reports: [
      {
        id: 1,
        reporter: "student_999",
        reason: "มีคำพูดเหน็บแนมอาจารย์",
        createdAt: "2025-12-01 11:20",
      },
      {
        id: 2,
        reporter: "student_777",
        reason: "มีการระบุชื่อจริงอาจารย์แบบไม่เหมาะสม",
        createdAt: "2025-12-01 12:05",
      },
    ],
    logs: [
      {
        id: 1,
        action: "User posted",
        by: "Username1",
        createdAt: "2025-12-01 10:15",
      },
      {
        id: 2,
        action: "Post reported",
        by: "student_999",
        createdAt: "2025-12-01 11:20",
      },
    ],
  },
  {
    id: 2,
    authorName: "Username2",
    authorAvatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=user2",
    title: "แชร์ประสบการณ์ฝึกงานบริษัท Software ที่กรุงเทพ",
    category: "เรื่องทั่วไป",
    createdAt: "2025-12-01 09:30",
    status: "active",
    reportCount: 0,
    content:
      "เพิ่งฝึกงานกลับมาสด ๆ ร้อน ๆ เลย อยากมาแชร์ว่าบรรยากาศและงานจริงต่างจากในห้องเรียนยังไงบ้าง เผื่อใครสนใจสมัครปีหน้า...",
    logs: [
      {
        id: 1,
        action: "User posted",
        by: "Username2",
        createdAt: "2025-12-01 09:30",
      },
    ],
  },
  {
    id: 3,
    authorName: "Username3",
    authorAvatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=user3",
    title: "ร้านก๋วยเตี๋ยวหน้า ม. ราคานักศึกษา",
    category: "ร้านอาหาร",
    createdAt: "2025-11-30 20:10",
    status: "deleted",
    reportCount: 5,
    deletedReason: "ข้อความมีคำหยาบคายและพาดพิงร้านในเชิงทำลายชื่อเสียง",
    content:
      "ก๋วยเตี๋ยวร้านนี้ให้เยอะมาก แต่วันที่ไปเจอคนเยอะเลยรอนานไปหน่อย รสชาติใช้ได้แต่ติดเค็มไปนิดนึง ถ้าไม่รีบก็ถือว่าโอเคนะ",
    reports: [
      {
        id: 1,
        reporter: "user_abc",
        reason: "ใช้คำพูดรุนแรงเกินไป",
        createdAt: "2025-11-30 20:30",
      },
      {
        id: 2,
        reporter: "user_xyz",
        reason: "พาดพิงร้านค้าในเชิงลบมากเกินไป",
        createdAt: "2025-11-30 21:05",
      },
    ],
    logs: [
      {
        id: 1,
        action: "User posted",
        by: "Username3",
        createdAt: "2025-11-30 20:10",
      },
      {
        id: 2,
        action: "Post reported",
        by: "user_abc",
        createdAt: "2025-11-30 20:30",
      },
      {
        id: 3,
        action: "Admin deleted",
        by: "Admin_A",
        createdAt: "2025-11-30 22:00",
      },
    ],
  },
  {
    id: 4,
    authorName: "Username4",
    authorAvatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=user4",
    title: "รวมรูปบรรยากาศทริปเขาใหญ่กับเพื่อน ๆ",
    category: "สถานที่ท่องเที่ยว",
    createdAt: "2025-11-30 18:05",
    status: "reported",
    reportCount: 2,
    content:
      "ไปเขาใหญ่มากับเพื่อนกลุ่มใหญ่ สนุกมาก มีทั้งเดินป่า ชมวิว ถ่ายรูปเยอะมาก เลยเอามาแชร์ เผื่อเป็นไอเดียทริปต่อไปของเพื่อน ๆ",
    reports: [
      {
        id: 1,
        reporter: "user555",
        reason: "มีรูปใบหน้าคนอื่นที่อาจจะไม่ยินยอม",
        createdAt: "2025-11-30 18:40",
      },
    ],
  },
  {
    id: 5,
    authorName: "Username5",
    authorAvatar: "https://api.dicebear.com/7.x/thumbs/svg?seed=user5",
    title: "มาชวนวิ่งรอบหอ สายสุขภาพเชิญทางนี้",
    category: "กีฬา",
    createdAt: "2025-11-29 22:40",
    status: "active",
    reportCount: 0,
    content:
      "ช่วงนี้เริ่มจริงจังกับการวิ่ง เลยอยากชวนเพื่อน ๆ แถวหอออกมาวิ่งด้วยกันตอนเย็น ใครสนใจมาคอมเมนต์ไว้ได้เลยครับ",
  },
];

// ---------- Component ----------
const PostManage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostItem[]>([]);
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

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await adminPostService.getAll();
        const apiPosts = response.data.data;

        // Map API response to PostItem format
        const mappedPosts: PostItem[] = apiPosts.map((p) => {
          // Get author name from backend
          let authorName = "ไม่เปิดเผยชื่อ";
          let authorAvatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=anonymous`;
          if (!p.is_anonymous && p.author) {
            authorName = p.author.username || `${p.author.first_name} ${p.author.last_name}`;
            authorAvatar = p.author.member_picture || `https://api.dicebear.com/7.x/thumbs/svg?seed=user${p.author_id}`;
          }

          // Get category name from backend
          let categoryName = "ไม่มีหมวดหมู่";
          if (p.MainCategory?.title) {
            categoryName = p.MainCategory.title;
            if (p.SubCategoryL1?.title) {
              categoryName += ` > ${p.SubCategoryL1.title}`;
            }
          }

          return {
            id: p.ID,
            authorName,
            authorAvatar,
            title: p.title,
            category: categoryName,
            createdAt: new Date(p.created_at).toLocaleString("th-TH"),
            status: (p.status?.toLowerCase() || "active") as PostStatus,
            reportCount: p.reports?.length || 0,
            content: p.content,
            reports: p.reports?.map((r) => ({
              id: r.ID,
              reporter: r.reporter,
              reason: r.reason,
              createdAt: r.created_at,
            })),
          };
        });

        setPosts(mappedPosts);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        message.error("ไม่สามารถโหลดรายการโพสต์ได้");
        // Fallback to mock data for development
        setPosts(initialPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
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
  const openDetailDrawer = (post: PostItem) => {
    setDetailPost(post);
    setDetailOpen(true);
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
