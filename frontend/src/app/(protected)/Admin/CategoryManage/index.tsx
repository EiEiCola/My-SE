// GroupManage.tsx - Category Management with API Integration
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Row,
  Col,
  Card,
  Dropdown,
  Modal,
  Form,
  Space,
  message,
  Drawer,
  Tag,
  Divider,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { RightOutlined, DownOutlined, LoadingOutlined } from "@ant-design/icons";
import {
  mainCategoryAPI,
  subCategoryL1API,
  subCategoryL2API,
  categoryStatsAPI,
  type MainCategory,
  type SubCategoryL1,
  type SubCategoryL2,
  type CategoryStatsResponse,
} from "../../../../services/http/admin_category";

const { Search, TextArea } = Input;

// ---------- Types ----------
type CategoryContent = {
  posts: number;
  reviews: number;
  polls: number;
};

type CategoryNode = {
  key: string;
  id: number;
  icon?: string;
  name: string;
  slug: string;
  description?: string;
  level: 1 | 2 | 3;
  content: CategoryContent;
  children?: CategoryNode[];
  parentId?: number;
};

type ModalMode = "create-root" | "create-sub" | "edit";

// ---------- Icon options (must match backend validation) ----------
const ICON_OPTIONS = [
  "Book", "School", "Tech", "Music", "Food", "Travel",
  "Shopping", "Health", "Sports", "Movie", "Game", "Beauty",
  "Home", "Car", "Pet", "Fashion", "Finance", "Art",
  "Photography", "News"
] as const;

// Icon display mapping (key -> emoji for visual display)
const ICON_DISPLAY_MAP: Record<string, string> = {
  Book: "📚",
  School: "🏫",
  Tech: "💻",
  Music: "🎵",
  Food: "🍜",
  Travel: "🏕️",
  Shopping: "🛒",
  Health: "🏥",
  Sports: "⚽️",
  Movie: "🎬",
  Game: "🎮",
  Beauty: "💄",
  Home: "🏠",
  Car: "🚗",
  Pet: "🐕",
  Fashion: "👗",
  Finance: "💰",
  Art: "🎨",
  Photography: "📷",
  News: "📰",
};

// ---------- Helper ----------
const flattenCategories = (nodes: CategoryNode[]): CategoryNode[] => {
  const result: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    list.forEach((n) => {
      result.push(n);
      if (n.children) walk(n.children);
    });
  };
  walk(nodes);
  return result;
};

// หา path จาก root → node ที่ต้องการ
const findNodePath = (
  nodes: CategoryNode[],
  key: string
): CategoryNode[] | null => {
  const path: CategoryNode[] = [];

  const dfs = (list: CategoryNode[]): boolean => {
    for (const n of list) {
      path.push(n);
      if (n.key === key) return true;
      if (n.children && dfs(n.children)) return true;
      path.pop();
    }
    return false;
  };

  return dfs(nodes) ? path : null;
};

// รวมสถิติ node + ลูกทั้งหมด
const aggregateStats = (node: CategoryNode): CategoryContent => {
  let posts = node.content.posts;
  let reviews = node.content.reviews;
  let polls = node.content.polls;

  const walk = (n: CategoryNode) => {
    if (n.children) {
      n.children.forEach((c) => {
        posts += c.content.posts;
        reviews += c.content.reviews;
        polls += c.content.polls;
        walk(c);
      });
    }
  };

  walk(node);
  return { posts, reviews, polls };
};

// Stats map type for quick lookup
type StatsMap = Map<number, { posts: number; reviews: number; polls: number }>;

// Transform API data to tree structure with real stats
const buildCategoryTree = (
  mainCategories: MainCategory[],
  sub1Categories: SubCategoryL1[],
  sub2Categories: SubCategoryL2[],
  stats?: CategoryStatsResponse
): CategoryNode[] => {
  // Build stats maps for quick lookup
  const mainStatsMap: StatsMap = new Map();
  const sub1StatsMap: StatsMap = new Map();
  const sub2StatsMap: StatsMap = new Map();

  if (stats) {
    stats.main?.forEach((s) => mainStatsMap.set(s.category_id, { posts: s.post_count, reviews: s.review_count, polls: s.poll_count }));
    stats.sub1?.forEach((s) => sub1StatsMap.set(s.category_id, { posts: s.post_count, reviews: s.review_count, polls: s.poll_count }));
    stats.sub2?.forEach((s) => sub2StatsMap.set(s.category_id, { posts: s.post_count, reviews: s.review_count, polls: s.poll_count }));
  }

  // Build L2 map by parent ID
  const sub2ByParent = new Map<number, SubCategoryL2[]>();
  sub2Categories.forEach((s2) => {
    const list = sub2ByParent.get(s2.sub_category_l1_id) || [];
    list.push(s2);
    sub2ByParent.set(s2.sub_category_l1_id, list);
  });

  // Build L1 map by parent ID
  const sub1ByParent = new Map<number, SubCategoryL1[]>();
  sub1Categories.forEach((s1) => {
    const list = sub1ByParent.get(s1.main_category_id) || [];
    list.push(s1);
    sub1ByParent.set(s1.main_category_id, list);
  });

  // Build tree
  return mainCategories.map((main) => {
    const sub1List = sub1ByParent.get(main.ID) || [];
    const mainContent = mainStatsMap.get(main.ID) || { posts: 0, reviews: 0, polls: 0 };

    const children: CategoryNode[] = sub1List.map((s1) => {
      const sub2List = sub2ByParent.get(s1.ID) || [];
      const sub1Content = sub1StatsMap.get(s1.ID) || { posts: 0, reviews: 0, polls: 0 };

      const l2Children: CategoryNode[] = sub2List.map((s2) => {
        const sub2Content = sub2StatsMap.get(s2.ID) || { posts: 0, reviews: 0, polls: 0 };
        return {
          key: `sub2-${s2.ID}`,
          id: s2.ID,
          name: s2.title,
          slug: s2.title.toLowerCase().replace(/\s+/g, "-"),
          description: s2.description,
          level: 3 as const,
          content: sub2Content,
          parentId: s2.sub_category_l1_id,
        };
      });

      return {
        key: `sub1-${s1.ID}`,
        id: s1.ID,
        name: s1.title,
        slug: s1.title.toLowerCase().replace(/\s+/g, "-"),
        description: s1.description,
        level: 2 as const,
        content: sub1Content,
        children: l2Children.length > 0 ? l2Children : undefined,
        parentId: s1.main_category_id,
      };
    });

    return {
      key: `main-${main.ID}`,
      id: main.ID,
      icon: main.icon,
      name: main.title,
      slug: main.title.toLowerCase().replace(/\s+/g, "-"),
      description: main.description,
      level: 1 as const,
      content: mainContent,
      children: children.length > 0 ? children : undefined,
    };
  });
};

// =========================================================
// Component
// =========================================================
const GroupManage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create-root");
  const [currentRecord, setCurrentRecord] = useState<CategoryNode | null>(null);
  const [parentRecord, setParentRecord] = useState<CategoryNode | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // Drawer สำหรับรายละเอียดหมวดหมู่
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<CategoryNode | null>(null);
  const [detailPath, setDetailPath] = useState<CategoryNode[]>([]);

  // Track selected rows for highlighting (multiple can be selected)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());

  // ---------- Fetch Data ----------
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const [mainRes, sub1Res, sub2Res, statsRes] = await Promise.all([
        mainCategoryAPI.list(),
        subCategoryL1API.list(),
        subCategoryL2API.list(),
        categoryStatsAPI.get(),
      ]);

      const tree = buildCategoryTree(
        mainRes.data.data || [],
        sub1Res.data.data || [],
        sub2Res.data.data || [],
        statsRes.data.data
      );
      setCategories(tree);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      messageApi.error("ไม่สามารถโหลดข้อมูลหมวดหมู่ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ---------- Stats ----------
  const flat = useMemo(() => flattenCategories(categories), [categories]);
  const totalCategories = flat.length;
  const totalPosts = flat.reduce((sum, c) => sum + c.content.posts, 0);
  const totalReviews = flat.reduce((sum, c) => sum + c.content.reviews, 0);
  const totalPolls = flat.reduce((sum, c) => sum + c.content.polls, 0);

  // ---------- Filter tree ----------
  const filterTree = (nodes: CategoryNode[]): CategoryNode[] => {
    if (!searchText.trim()) return nodes;
    const lower = searchText.toLowerCase();

    const matchNode = (n: CategoryNode) =>
      n.name.toLowerCase().includes(lower) ||
      n.slug.toLowerCase().includes(lower) ||
      (n.description || "").toLowerCase().includes(lower);

    const walk = (list: CategoryNode[]): CategoryNode[] => {
      const res: CategoryNode[] = [];
      list.forEach((n) => {
        const matched = matchNode(n);
        const childMatched = n.children ? walk(n.children) : [];
        if (matched || childMatched.length) {
          res.push({
            ...n,
            children: childMatched.length ? childMatched : n.children,
          });
        }
      });
      return res;
    };

    return walk(nodes);
  };

  const dataSource = useMemo(
    () => filterTree(categories),
    [categories, searchText]
  );

  // ---------- เปิด Modal ----------
  const openCreateRootModal = () => {
    setModalMode("create-root");
    setCurrentRecord(null);
    setParentRecord(null);
    setSelectedIcon(null);
    form.setFieldsValue({ name: "", description: "", icon: "" });
    setIsModalOpen(true);
  };

  const openCreateSubModal = (parent: CategoryNode) => {
    setModalMode("create-sub");
    setCurrentRecord(null);
    setParentRecord(parent);
    setSelectedIcon(null);
    form.setFieldsValue({ name: "", description: "", icon: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (record: CategoryNode) => {
    setModalMode("edit");
    setCurrentRecord(record);
    setParentRecord(null);
    setSelectedIcon(record.icon ?? null);
    form.setFieldsValue({
      name: record.name,
      description: record.description || "",
      icon: record.icon || "",
    });
    setIsModalOpen(true);
  };

  // ---------- Drawer: เปิดรายละเอียด ----------
  const openDetailDrawer = (record: CategoryNode) => {
    const path = findNodePath(categories, record.key) || [record];
    setDetailRecord(record);
    setDetailPath(path);
    // Add this row and its ancestors to highlighted set
    const newKeys = new Set(selectedRowKeys);
    path.forEach(n => newKeys.add(n.key));
    setSelectedRowKeys(newKeys);
    setDetailOpen(true);
  };

  // ---------- Action Menu ----------
  const handleAction = (action: string, record: CategoryNode) => {
    if (action === "create-sub") {
      if (record.level >= 3) {
        messageApi.warning(
          "หมวดหมู่นี้เป็นชั้นสุดท้ายแล้ว ไม่สามารถสร้างหมวดย่อยเพิ่มเติมได้"
        );
        return;
      }
      openCreateSubModal(record);
    } else if (action === "edit") {
      openEditModal(record);
    } else if (action === "delete") {
      modal.confirm({
        title: "ยืนยันการลบหมวดหมู่",
        content: `คุณต้องการลบหมวดหมู่ "${record.name}" หรือไม่?`,
        okText: "ลบ",
        okButtonProps: { danger: true },
        cancelText: "ยกเลิก",
        onOk: async () => {
          try {
            if (record.level === 1) {
              await mainCategoryAPI.delete(record.id);
            } else if (record.level === 2) {
              await subCategoryL1API.delete(record.id);
            } else {
              await subCategoryL2API.delete(record.id);
            }
            messageApi.success("ลบหมวดหมู่สำเร็จ");
            fetchCategories();
          } catch (error) {
            console.error("Failed to delete:", error);
            messageApi.error("ไม่สามารถลบหมวดหมู่ได้");
          }
        },
      });
    }
  };

  const getActionMenu = (record: CategoryNode): MenuProps => {
    const items: MenuProps["items"] = [];
    if (record.level < 3) {
      items.push({ key: "create-sub", label: "สร้างหมวดย่อย" });
    }
    items.push(
      { key: "edit", label: "แก้ไขหมวดหมู่" },
      { key: "delete", label: "ลบหมวดหมู่", danger: true }
    );
    return { items, onClick: ({ key }) => handleAction(key as string, record) };
  };

  // ---------- Submit Modal ----------
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { name, description, icon } = values as {
        name: string;
        description: string;
        icon?: string;
      };

      setSubmitting(true);

      if (modalMode === "create-root") {
        await mainCategoryAPI.create({
          title: name,
          description: description,
          icon: icon || "",
          order_index: categories.length,
        });
        messageApi.success("สร้างหมวดหมู่หลักสำเร็จ");
      } else if (modalMode === "create-sub" && parentRecord) {
        if (parentRecord.level === 1) {
          await subCategoryL1API.create({
            title: name,
            description: description,
            main_category_id: parentRecord.id,
            order_index: 0,
          });
        } else if (parentRecord.level === 2) {
          await subCategoryL2API.create({
            title: name,
            description: description,
            sub_category_l1_id: parentRecord.id,
            order_index: 0,
          });
        }
        messageApi.success("สร้างหมวดย่อยสำเร็จ");
      } else if (modalMode === "edit" && currentRecord) {
        if (currentRecord.level === 1) {
          await mainCategoryAPI.update(currentRecord.id, {
            title: name,
            description: description,
            icon: icon || "",
          });
        } else if (currentRecord.level === 2) {
          await subCategoryL1API.update(currentRecord.id, {
            title: name,
            description: description,
          });
        } else {
          await subCategoryL2API.update(currentRecord.id, {
            title: name,
            description: description,
          });
        }
        messageApi.success("แก้ไขหมวดหมู่สำเร็จ");
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Submit error:", error);
      messageApi.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Columns ----------
  const columns: ColumnsType<CategoryNode> = [
    {
      title: "หมวดหมู่",
      dataIndex: "name",
      key: "name",
      render: (_: any, record) => (
        <Space align="start">
          {record.level === 1 && record.icon && (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                border: "1px solid #f1f1f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                background:
                  "linear-gradient(135deg, rgba(248,250,252,1), rgba(241,245,249,1))",
              }}
            >
              {ICON_DISPLAY_MAP[record.icon] || record.icon}
            </div>
          )}
          <div>
            <Button
              type="link"
              style={{
                padding: 0,
                height: "auto",
                fontWeight: 500,
                color: "#111827",
              }}
              onClick={(e) => {
                e.stopPropagation();
                openDetailDrawer(record);
              }}
            >
              {record.name}
            </Button>
            {record.description && (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                {record.description}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "โพสต์",
      dataIndex: ["content", "posts"],
      key: "posts",
      width: 90,
      align: "right",
      render: (v: number) => (
        <span style={{ fontWeight: 500, color: "#0f766e" }}>{v}</span>
      ),
    },
    {
      title: "รีวิว",
      dataIndex: ["content", "reviews"],
      key: "reviews",
      width: 90,
      align: "right",
      render: (v: number) => (
        <span style={{ fontWeight: 500, color: "#4338ca" }}>{v}</span>
      ),
    },
    {
      title: "โพล / แบบสำรวจ",
      dataIndex: ["content", "polls"],
      key: "polls",
      width: 130,
      align: "right",
      render: (v: number) => (
        <span style={{ fontWeight: 500, color: "#c05621" }}>{v}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      align: "right",
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
          <Button
            type="text"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 18, lineHeight: 1 }}
          >
            ⋯
          </Button>
        </Dropdown>
      ),
    },
  ];

  // Helper: label level
  const levelLabel = (level: 1 | 2 | 3) => {
    if (level === 1) return "หมวดหลัก";
    if (level === 2) return "หมวดย่อย";
    return "หมวดย่อย (ชั้นสุดท้าย)";
  };

  // =========================================================
  // Render
  // =========================================================
  return (
    <main style={{ flex: 1, padding: 24, background: "transparent" }}>
      <style>
        {`
          .selected-category-row > td {
            background-color: #fff7ed !important;
          }
          .selected-category-row:hover > td {
            background-color: #ffedd5 !important;
          }
        `}
      </style>
      {contextHolder}
      {modalContextHolder}
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <Row
          style={{ width: "100%", marginBottom: 24 }}
          align="middle"
          justify="space-between"
        >
          <Col>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
              จัดการหมวดหมู่
            </h1>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              จัดการหมวดหมู่หลักและหมวดย่อยสำหรับโพสต์ รีวิว และโพลใน Community
            </div>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              shape="round"
              onClick={openCreateRootModal}
            >
              + สร้างหมวดหมู่หลัก
            </Button>
          </Col>
        </Row>

        {/* Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              bodyStyle={{ padding: 16 }}
              style={{
                borderRadius: 18,
                background: "linear-gradient(135deg, #ecfeff, #cffafe)",
              }}
            >
              <div style={{ fontSize: 12, color: "#0f766e", marginBottom: 4 }}>
                หมวดหมู่ทั้งหมด
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a" }}>
                {totalCategories}
              </div>
              <div style={{ fontSize: 11, color: "#0f766e", marginTop: 4 }}>
                รวมทุกระดับ (หลัก + ย่อย)
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              bodyStyle={{ padding: 16 }}
              style={{
                borderRadius: 18,
                background: "linear-gradient(135deg, #e0f2fe, #bfdbfe)",
              }}
            >
              <div style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 4 }}>
                โพสต์ทั้งหมด
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0b1120" }}>
                {totalPosts}
              </div>
              <div style={{ fontSize: 11, color: "#1e40af", marginTop: 4 }}>
                เนื้อหาโพสต์ในทุกหมวดหมู่
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              bodyStyle={{ padding: 16 }}
              style={{
                borderRadius: 18,
                background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
              }}
            >
              <div style={{ fontSize: 12, color: "#4c1d95", marginBottom: 4 }}>
                รีวิวทั้งหมด
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#111827" }}>
                {totalReviews}
              </div>
              <div style={{ fontSize: 11, color: "#4c1d95", marginTop: 4 }}>
                รีวิวรายวิชา / ร้านอาหาร ฯลฯ
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              bodyStyle={{ padding: 16 }}
              style={{
                borderRadius: 18,
                background: "linear-gradient(135deg, #ffedd5, #fed7aa)",
              }}
            >
              <div style={{ fontSize: 12, color: "#9a3412", marginBottom: 4 }}>
                โพล / แบบสำรวจ
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2933" }}>
                {totalPolls}
              </div>
              <div style={{ fontSize: 11, color: "#9a3412", marginTop: 4 }}>
                สำรวจความสนใจใน Community
              </div>
            </Card>
          </Col>
        </Row>

        {/* Search */}
        <div style={{ marginBottom: 16, maxWidth: 320 }}>
          <Search
            placeholder="ค้นหาชื่อหมวดหมู่ / คำอธิบาย..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card
          size="small"
          bordered={false}
          style={{
            borderRadius: 20,
          }}
          bodyStyle={{ padding: 0 }}
        >
          {loading ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <div style={{ marginTop: 12, color: "#9ca3af" }}>กำลังโหลด...</div>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              rowKey="key"
              size="middle"
              rowClassName={(record) => {
                // Check if this row is in the highlighted set
                return selectedRowKeys.has(record.key) ? "selected-category-row" : "";
              }}
              onRow={(record) => ({
                onClick: (e) => {
                  // Don't open drawer if clicking on expand button, action dropdown, or dropdown menu
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('button') ||
                    target.closest('.ant-dropdown-trigger') ||
                    target.closest('.ant-dropdown') ||
                    target.closest('.ant-dropdown-menu')
                  ) {
                    return;
                  }
                  openDetailDrawer(record);
                },
                style: { cursor: "pointer" },
              })}
              expandable={{
                defaultExpandAllRows: false,
                expandIcon: ({ expanded, onExpand, record }) =>
                  record.children && record.children.length > 0 ? (
                    <Button
                      type="text"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newKeys = new Set(selectedRowKeys);

                        // Helper to get all descendant keys
                        const getAllDescendantKeys = (node: CategoryNode): string[] => {
                          const keys: string[] = [node.key];
                          if (node.children) {
                            node.children.forEach(child => {
                              keys.push(...getAllDescendantKeys(child));
                            });
                          }
                          return keys;
                        };

                        if (expanded) {
                          // Collapse: remove this row and all its descendants from highlight
                          getAllDescendantKeys(record).forEach(key => newKeys.delete(key));
                        } else {
                          // Expand: add this row and all its descendants to highlight
                          getAllDescendantKeys(record).forEach(key => newKeys.add(key));
                        }

                        setSelectedRowKeys(newKeys);
                        onExpand(record, e);
                      }}
                      icon={expanded ? <DownOutlined /> : <RightOutlined />}
                      style={{ marginRight: 4 }}
                    />
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        width: 32,
                        marginRight: 4,
                      }}
                    />
                  ),
              }}
              style={{ borderRadius: 20, overflow: "hidden" }}
            />
          )}
        </Card>

        {/* Modal: สร้าง/แก้ไขหมวดหมู่ */}
        <Modal
          open={isModalOpen}
          title={
            modalMode === "create-root"
              ? "สร้างหมวดหมู่ใหม่"
              : modalMode === "create-sub"
                ? parentRecord
                  ? `สร้างหมวดย่อยใน "${parentRecord.name}"`
                  : "สร้างหมวดย่อย"
                : currentRecord
                  ? `แก้ไขหมวดหมู่ "${currentRecord.name}"`
                  : "แก้ไขหมวดหมู่"
          }
          okText="บันทึก"
          cancelText="ยกเลิก"
          onCancel={() => setIsModalOpen(false)}
          onOk={handleSubmit}
          confirmLoading={submitting}
          destroyOnClose
        >
          {modalMode === "create-sub" && parentRecord && (
            <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280" }}>
              หมวดแม่: <b>{parentRecord.name}</b>
            </div>
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              label="ระบุชื่อหมวดหมู่"
              name="name"
              rules={[
                { required: true, message: "กรุณากรอกชื่อหมวดหมู่" },
                { min: 2, message: "ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร" },
                { max: 60, message: "ชื่อหมวดหมู่ต้องไม่เกิน 60 ตัวอักษร" },
              ]}
            >
              <Input
                size="large"
                placeholder="เช่น กีฬา, การศึกษา, อาหาร"
                maxLength={60}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="ใส่คำอธิบายหมวดหมู่"
              name="description"
              rules={[
                { required: true, message: "กรุณากรอกคำอธิบายหมวดหมู่" },
                { min: 1, message: "คำอธิบายต้องมีอย่างน้อย 1 ตัวอักษร" },
                { max: 300, message: "คำอธิบายต้องไม่เกิน 300 ตัวอักษร" },
              ]}
            >
              <TextArea
                rows={3}
                placeholder="อธิบายหมวดหมู่สั้น ๆ เช่น ใช้สำหรับโพสต์เกี่ยวกับกีฬาและกิจกรรมออกกำลังกาย"
                maxLength={300}
                showCount
              />
            </Form.Item>

            {(modalMode === "create-root" || (modalMode === "edit" && currentRecord?.level === 1)) && (
              <Form.Item
                label="เลือก icon สำหรับหมวดหมู่"
                name="icon"
                rules={[
                  { required: true, message: "กรุณาเลือก icon สำหรับหมวดหมู่" },
                ]}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  {ICON_OPTIONS.map((iconKey) => {
                    const active = selectedIcon === iconKey;
                    const emoji = ICON_DISPLAY_MAP[iconKey] || iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        title={iconKey}
                        onClick={() => {
                          setSelectedIcon(iconKey);
                          form.setFieldValue("icon", iconKey);
                        }}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 12,
                          border: active
                            ? "2px solid #f97316"
                            : "1px solid #e5e7eb",
                          backgroundColor: active ? "#fff7ed" : "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          cursor: "pointer",
                          transition:
                            "background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease",
                          boxShadow: active
                            ? "0 0 0 3px rgba(249, 115, 22, 0.2)"
                            : "none",
                        }}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Drawer: รายละเอียดหมวดหมู่ */}
        <Drawer
          title="รายละเอียดหมวดหมู่"
          placement="right"
          width={420}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
          }}
        >
          {detailRecord && (
            <div>
              {/* ส่วนบน: icon + ชื่อ + level */}
              <Space align="center" style={{ marginBottom: 12 }}>
                {detailRecord.icon && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      background:
                        "linear-gradient(135deg, #f9fafb, #e5e7eb)",
                    }}
                  >
                    {ICON_DISPLAY_MAP[detailRecord.icon] || detailRecord.icon}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {detailRecord.name}
                  </div>
                  <Tag color={detailRecord.level === 1 ? "blue" : detailRecord.level === 2 ? "green" : "orange"}>
                    {levelLabel(detailRecord.level)}
                  </Tag>
                </div>
              </Space>

              {/* breadcrumb */}
              {detailPath.length > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    marginBottom: 12,
                  }}
                >
                  เส้นทางหมวดหมู่:{" "}
                  {detailPath.map((n, idx) => (
                    <span key={n.key}>
                      {idx > 0 && " > "}
                      {n.name}
                    </span>
                  ))}
                </div>
              )}

              {/* description */}
              {detailRecord.description && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#4b5563",
                    marginBottom: 12,
                  }}
                >
                  {detailRecord.description}
                </p>
              )}

              {/* Stats */}
              <Divider orientation="left" plain>
                สถิติเนื้อหา
              </Divider>
              {(() => {
                const own = detailRecord.content;
                const agg = aggregateStats(detailRecord);
                const hasChildren = !!detailRecord.children?.length;
                return (
                  <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                    <Col span={hasChildren ? 12 : 24}>
                      <Card
                        size="small"
                        bordered={false}
                        style={{
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #eff6ff, #dbeafe)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#1d4ed8",
                            marginBottom: 4,
                          }}
                        >
                          ในหมวดนี้
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>
                          {own.posts} โพสต์
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#1d4ed8",
                            marginTop: 4,
                          }}
                        >
                          รีวิว {own.reviews} • โพล {own.polls}
                        </div>
                      </Card>
                    </Col>
                    {hasChildren && (
                      <Col span={12}>
                        <Card
                          size="small"
                          bordered={false}
                          style={{
                            borderRadius: 12,
                            background:
                              "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              color: "#047857",
                              marginBottom: 4,
                            }}
                          >
                            รวมหมวดย่อยทั้งหมด
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700 }}>
                            {agg.posts} โพสต์
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#047857",
                              marginTop: 4,
                            }}
                          >
                            รีวิว {agg.reviews} • โพล {agg.polls}
                          </div>
                        </Card>
                      </Col>
                    )}
                  </Row>
                );
              })()}

              {/* Children list */}
              <Divider orientation="left" plain>
                หมวดย่อยในหมวดนี้
              </Divider>
              {detailRecord.children && detailRecord.children.length > 0 ? (
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size={8}
                >
                  {detailRecord.children.map((child) => {
                    const cAgg = aggregateStats(child);
                    return (
                      <Card
                        key={child.key}
                        size="small"
                        bordered={false}
                        style={{
                          borderRadius: 10,
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          cursor: "pointer",
                        }}
                        onClick={() => openDetailDrawer(child)}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>
                              {child.name}
                            </div>
                            {child.description && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#9ca3af",
                                  marginTop: 2,
                                }}
                              >
                                {child.description}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: 11,
                                color: "#6b7280",
                                marginTop: 2,
                              }}
                            >
                              โพสต์ {cAgg.posts} • รีวิว {cAgg.reviews} • โพล{" "}
                              {cAgg.polls}
                            </div>
                          </div>
                          <RightOutlined style={{ fontSize: 12 }} />
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              ) : (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  ไม่มีหมวดย่อยในหมวดนี้
                </div>
              )}

              {/* Actions */}
              <Divider />
              <Space wrap>
                {detailRecord.level < 3 && (
                  <Button
                    size="small"
                    onClick={() => {
                      handleAction("create-sub", detailRecord);
                    }}
                  >
                    + สร้างหมวดย่อย
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={() => {
                    handleAction("edit", detailRecord);
                  }}
                >
                  แก้ไขหมวดหมู่
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => {
                    handleAction("delete", detailRecord);
                    setDetailOpen(false);
                  }}
                >
                  ลบหมวดหมู่
                </Button>
              </Space>
            </div>
          )}
        </Drawer>
      </div>
    </main>
  );
};

export default GroupManage;
