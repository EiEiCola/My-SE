// CreatePost.tsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Switch,
  Row,
  Col,
  Checkbox,
  Spin,
  message,
} from "antd";
import {
  PictureOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  publicCategoryAPI,
  type MainCategory,
  type SubCategoryL1,
  type SubCategoryL2,
} from "../../../../services/http/admin_category";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ORANGE = "#ff6a00";
const ORANGE_LIGHT = "#fff3e6";

// ---------------- Component ----------------
const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  // Category data from API
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [sub1Categories, setSub1Categories] = useState<SubCategoryL1[]>([]);
  const [sub2Categories, setSub2Categories] = useState<SubCategoryL2[]>([]);
  const [loading, setLoading] = useState(true);

  // สำหรับเลือกหมวดหมู่ 3 คอลัมน์
  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
  const [selectedSub1Id, setSelectedSub1Id] = useState<number | null>(null);
  const [selectedSub2Ids, setSelectedSub2Ids] = useState<number[]>([]);
  const [searchText, setSearchText] = useState("");

  const [anonymous, setAnonymous] = useState(false);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const [mainRes, sub1Res, sub2Res] = await Promise.all([
        publicCategoryAPI.listMain(),
        publicCategoryAPI.listSub1(),
        publicCategoryAPI.listSub2(),
      ]);

      const mainData = mainRes.data.data || [];
      setMainCategories(mainData);
      setSub1Categories(sub1Res.data.data || []);
      setSub2Categories(sub2Res.data.data || []);

      // Set default selection to first main category
      if (mainData.length > 0) {
        setSelectedMainId(mainData[0].ID);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      messageApi.error("ไม่สามารถโหลดหมวดหมู่ได้");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Get selected main category
  const selectedMain = useMemo(
    () => mainCategories.find((m) => m.ID === selectedMainId) ?? null,
    [mainCategories, selectedMainId]
  );

  // Filter sub1 by selected main category
  const sub1List: SubCategoryL1[] = useMemo(() => {
    if (!selectedMainId) return [];
    let filtered = sub1Categories.filter((s) => s.main_category_id === selectedMainId);

    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter((c) =>
        c.title.toLowerCase().includes(lower)
      );
    }
    return filtered;
  }, [sub1Categories, selectedMainId, searchText]);

  // Get selected sub1 category
  const selectedSub1 = useMemo(
    () => sub1List.find((s) => s.ID === selectedSub1Id) ?? null,
    [sub1List, selectedSub1Id]
  );

  // Filter sub2 by selected sub1 category
  const sub2List: SubCategoryL2[] = useMemo(() => {
    if (!selectedSub1Id) return [];
    return sub2Categories.filter((s) => s.sub_category_l1_id === selectedSub1Id);
  }, [sub2Categories, selectedSub1Id]);

  const toggleSub2 = (id: number, checked: boolean) => {
    setSelectedSub2Ids((prev) =>
      checked ? [...prev, id] : prev.filter((k) => k !== id)
    );
  };

  const handleSubmit = () => {
    // เลือก priority: L2 > L1 > Main
    const categoryIds =
      selectedSub2Ids.length > 0
        ? selectedSub2Ids
        : selectedSub1Id
          ? [selectedSub1Id]
          : selectedMainId
            ? [selectedMainId]
            : [];

    const payload = {
      title,
      detail,
      category_ids: categoryIds,
      isAnonymous: anonymous,
    };
    console.log("submit post", payload);
    // TODO: ต่อ backend: POST /api/posts

    navigate("/User/Post");
  };

  const handleCancel = () => {
    navigate("/User/Post");
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      {contextHolder}
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Back */}
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/User/Post")}
          style={{ paddingLeft: 0, marginBottom: 8 }}
        >
          กลับไปหน้าโพสต์
        </Button>

        <Card
          bordered={false}
          style={{
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            background: "#f9fafb",
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Title level={3} style={{ marginBottom: 24 }}>
            สร้างโพสต์
          </Title>

          {/* 1. หัวข้อ */}
          <section className="mb-6">
            <Text strong>1. ระบุหัวข้อของโพสต์คุณ</Text>
            <Input
              placeholder="หัวข้อโพสต์"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginTop: 8, borderRadius: 10 }}
            />
          </section>

          {/* 2. เนื้อหาโพสต์ */}
          <section className="mb-6">
            <Text strong>2. เขียนรายละเอียดของโพสต์</Text>
            <div
              style={{
                marginTop: 8,
                borderRadius: "10px 10px 0 0",
                border: "1px solid #d1d5db",
                borderBottom: "none",
                padding: "6px 10px",
                background: "#f3f4f6",
                display: "flex",
                gap: 8,
              }}
            >
              <Button
                icon={<PictureOutlined />}
                size="small"
                style={{
                  borderRadius: 8,
                  borderColor: "#d1d5db",
                  background: "#fff",
                }}
              >
                รูปภาพ
              </Button>
              <Button
                icon={<PlusOutlined />}
                size="small"
                style={{
                  borderRadius: 8,
                  borderColor: "#d1d5db",
                  background: "#fff",
                }}
              >
                ไฟล์อื่น ๆ
              </Button>
            </div>
            <TextArea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={8}
              style={{
                borderRadius: "0 0 10px 10px",
                borderTop: "none",
              }}
              placeholder="พิมพ์เนื้อหาโพสต์ของคุณที่นี่…"
            />
          </section>

          {/* 3. เลือกหมวดหมู่ */}
          <section className="mb-6">
            <Text strong>3. เลือกหมวดหมู่ของโพสต์</Text>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              {/* คอลัมน์ซ้าย: หมวดหลัก */}
              <Col xs={24} md={8}>
                <Input.Search
                  placeholder="ค้นหาหมวดหมู่ที่ต้องการ"
                  style={{ marginBottom: 8 }}
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    padding: 8,
                    maxHeight: 260,
                    overflow: "auto",
                    background: "#fff",
                  }}
                >
                  {mainCategories.map((cat) => {
                    const isActive = selectedMainId === cat.ID;
                    return (
                      <div
                        key={cat.ID}
                        onClick={() => {
                          setSelectedMainId(cat.ID);
                          setSelectedSub1Id(null);
                          setSelectedSub2Ids([]);
                        }}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 8,
                          marginBottom: 4,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isActive ? ORANGE_LIGHT : "transparent",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        <span>{cat.icon} {cat.title}</span>
                        {sub1Categories.some(s => s.main_category_id === cat.ID) && (
                          <RightOutlined style={{ fontSize: 10 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Col>

              {/* คอลัมน์กลาง: หมวดย่อย L1 */}
              <Col xs={24} md={8}>
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    padding: 8,
                    maxHeight: 260,
                    overflow: "auto",
                    background: "#fff",
                  }}
                >
                  {sub1List.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ไม่มีหัวข้อย่อยในหมวดนี้
                    </Text>
                  )}
                  {sub1List.map((sub) => {
                    const isActive = selectedSub1Id === sub.ID;
                    return (
                      <div
                        key={sub.ID}
                        onClick={() => {
                          setSelectedSub1Id(sub.ID);
                          setSelectedSub2Ids([]);
                        }}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 8,
                          marginBottom: 4,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isActive ? ORANGE_LIGHT : "transparent",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        <span>{sub.title}</span>
                        {sub2Categories.some(s => s.sub_category_l1_id === sub.ID) && (
                          <RightOutlined style={{ fontSize: 10 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Col>

              {/* คอลัมน์ขวา: หมวดย่อย L2 (checkbox) */}
              <Col xs={24} md={8}>
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    padding: 8,
                    maxHeight: 260,
                    overflow: "auto",
                    background: "#fff",
                  }}
                >
                  {sub2List.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      เลือกหัวข้อย่อยด้านซ้าย หรือโพสต์อยู่ในหัวข้อ "{selectedSub1?.title ??
                        selectedMain?.title ??
                        "-"}"
                    </Text>
                  ) : (
                    sub2List.map((sub2) => (
                      <div key={sub2.ID} style={{ marginBottom: 4 }}>
                        <Checkbox
                          checked={selectedSub2Ids.includes(sub2.ID)}
                          onChange={(e) =>
                            toggleSub2(sub2.ID, e.target.checked)
                          }
                        >
                          {sub2.title}
                        </Checkbox>
                      </div>
                    ))
                  )}
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block", marginTop: 4 }}
                >
                  * สามารถเลือกได้มากกว่า 1 หัวข้อย่อย เพื่อให้เพื่อน ๆ หาโพสต์ของคุณเจอง่ายขึ้น
                </Text>
              </Col>
            </Row>
          </section>

          {/* แถบล่าง: anonymous + ปุ่ม */}
          <Row justify="space-between" align="middle">
            <Col>
              <Space align="center">
                <Text>โพสต์แบบไม่เปิดเผยชื่อ</Text>
                <Switch
                  checked={anonymous}
                  onChange={(v) => setAnonymous(v)}
                  checkedChildren="เปิด"
                  unCheckedChildren="ปิด"
                  style={{
                    backgroundColor: anonymous ? ORANGE : undefined,
                  }}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button type="text" danger onClick={handleCancel}>
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  style={{
                    borderRadius: 999,
                    background: ORANGE,
                    borderColor: ORANGE,
                    fontWeight: 600,
                    paddingInline: 28,
                  }}
                >
                  สร้างโพสต์
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    </main>
  );
};

export default CreatePost;