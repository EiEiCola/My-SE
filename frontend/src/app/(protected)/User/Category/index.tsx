// Group.tsx - User Category Page with API Integration
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  Tag,
  Space,
  Segmented,
  Select,
  List,
  Avatar,
  Badge,
  Empty,
  Button,
  Spin,
  message,
} from "antd";
import {
  BookOutlined,
  FlagOutlined,
  CoffeeOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  MessageOutlined,
  LikeOutlined,
  PlusCircleOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  publicCategoryAPI,
  type MainCategory,
  type SubCategoryL1,
  type SubCategoryL2,
} from "../../../../services/http/admin_category";
import postService from "../../../../services/http/post_service";
import { useNavigate, useSearchParams } from "react-router-dom";

const { Search } = Input;

// 🎨 Theme Colors (SUT Orange)
const ACCENT_COLOR_HEX = "#ff6a00";
const ACCENT_COLOR_BG = "#fff3e6";

// Icon mapping based on category title/keywords
const getIconForCategory = (title: string): React.ReactNode => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("กีฬา") || lowerTitle.includes("sport")) return <FlagOutlined />;
  if (lowerTitle.includes("อาหาร") || lowerTitle.includes("food")) return <CoffeeOutlined />;
  if (lowerTitle.includes("ท่อง") || lowerTitle.includes("travel")) return <EnvironmentOutlined />;
  if (lowerTitle.includes("ชมรม") || lowerTitle.includes("club")) return <TeamOutlined />;
  return <BookOutlined />;
};

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

// Get emoji from icon key
const getEmojiIcon = (iconKey?: string): string | null => {
  if (!iconKey) return null;
  return ICON_DISPLAY_MAP[iconKey] || iconKey;
};

// ---------- Types ----------
type ContentType = "post" | "review" | "poll";

type UserCategory = {
  id: number;
  key: string;
  icon: React.ReactNode;
  emojiIcon?: string;
  name: string;
  slug: string;
  description: string;
  stats: {
    posts: number;
    reviews: number;
    polls: number;
  };
  subcategories: SubCategoryL1WithChildren[];
};

type SubCategoryL1WithChildren = SubCategoryL1 & {
  children?: SubCategoryL2[];
};

type PostItem = {
  id: number;
  categoryKey: string;
  subKey: string;
  subSubKey?: string;
  type: ContentType;
  title: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  likes: number;
  comments: number;
  excerpt: string;
};

// ---------------------------------------------
// Component
// ---------------------------------------------
const Group: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [allPosts, setAllPosts] = useState<PostItem[]>([]);

  const [searchText, setSearchText] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [selectedSubKey, setSelectedSubKey] = useState<string | "all">("all");
  const [selectedSubSubKey, setSelectedSubSubKey] = useState<string | "all">("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | "all">("all");

  // ---------- Fetch Categories ----------
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const [mainRes, sub1Res, sub2Res, postsRes] = await Promise.all([
        publicCategoryAPI.listMain(),
        publicCategoryAPI.listSub1(),
        publicCategoryAPI.listSub2(),
        postService.getAll(),
      ]);

      const mainCategories = mainRes.data.data || [];
      const sub1Categories = sub1Res.data.data || [];
      const sub2Categories = sub2Res.data.data || [];
      const allPostsData = postsRes.data.data || [];

      // Transform posts to PostItem format
      const transformedPosts: PostItem[] = allPostsData.map((post) => {
        const createdDate = new Date(post.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let createdAt = "";
        if (diffMins < 60) {
          createdAt = `${diffMins} นาทีที่แล้ว`;
        } else if (diffHours < 24) {
          createdAt = `${diffHours} ชั่วโมงที่แล้ว`;
        } else if (diffDays === 0) {
          createdAt = "วันนี้";
        } else if (diffDays === 1) {
          createdAt = "เมื่อวานนี้";
        } else {
          createdAt = createdDate.toLocaleDateString("th-TH");
        }

        return {
          id: post.ID,
          categoryKey: post.main_category_id ? String(post.main_category_id) : "",
          subKey: post.sub_category1_id ? String(post.sub_category1_id) : "",
          subSubKey: post.sub_category2_id ? String(post.sub_category2_id) : undefined,
          type: "post" as ContentType,
          title: post.title,
          authorName: post.is_anonymous
            ? "ไม่เปิดเผยชื่อ"
            : (post.author?.username || post.author?.first_name || `User #${post.author_id}`),
          authorAvatar: post.is_anonymous
            ? `https://api.dicebear.com/7.x/thumbs/svg?seed=anonymous`
            : (post.author?.member_picture || `https://api.dicebear.com/7.x/thumbs/svg?seed=${post.author_id}`),
          createdAt,
          likes: post.like_count,
          comments: post.comment_count,
          excerpt: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
        };
      });

      setAllPosts(transformedPosts);

      // Count posts per main category
      const postCountByCategory = new Map<number, number>();
      allPostsData.forEach((post) => {
        if (post.main_category_id) {
          const count = postCountByCategory.get(post.main_category_id) || 0;
          postCountByCategory.set(post.main_category_id, count + 1);
        }
      });

      // Build sub2 by parent map
      const sub2ByParent = new Map<number, SubCategoryL2[]>();
      sub2Categories.forEach((s2) => {
        const list = sub2ByParent.get(s2.sub_category_l1_id) || [];
        list.push(s2);
        sub2ByParent.set(s2.sub_category_l1_id, list);
      });

      // Build sub1 by parent map with children
      const sub1ByParent = new Map<number, SubCategoryL1WithChildren[]>();
      sub1Categories.forEach((s1) => {
        const list = sub1ByParent.get(s1.main_category_id) || [];
        list.push({
          ...s1,
          children: sub2ByParent.get(s1.ID) || [],
        });
        sub1ByParent.set(s1.main_category_id, list);
      });

      // Transform to UserCategory
      const transformed: UserCategory[] = mainCategories.map((main) => ({
        id: main.ID,
        key: String(main.ID),
        icon: main.icon ? null : getIconForCategory(main.title),
        emojiIcon: getEmojiIcon(main.icon) || undefined,
        name: main.title,
        slug: main.title.toLowerCase().replace(/\s+/g, "-"),
        description: main.description || "หมวดหมู่ " + main.title,
        stats: {
          posts: postCountByCategory.get(main.ID) || 0,
          reviews: 0,
          polls: 0
        },
        subcategories: sub1ByParent.get(main.ID) || [],
      }));

      setCategories(transformed);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      messageApi.error("ไม่สามารถโหลดข้อมูลหมวดหมู่ได้");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-select category from URL query parameter
  useEffect(() => {
    const categoryId = searchParams.get("category");
    if (categoryId && categories.length > 0) {
      const found = categories.find((c) => c.key === categoryId);
      if (found) {
        setSelectedCategoryKey(found.key);
      }
    }
  }, [searchParams, categories]);

  const selectedCategory = useMemo(() => {
    return selectedCategoryKey
      ? categories.find((c) => c.key === selectedCategoryKey) || null
      : null;
  }, [selectedCategoryKey, categories]);

  const activeSubCategory = useMemo(() => {
    return selectedCategory && selectedSubKey !== "all"
      ? selectedCategory.subcategories.find((s) => String(s.ID) === selectedSubKey) || null
      : null;
  }, [selectedCategory, selectedSubKey]);

  const filteredCategories = useMemo(() => {
    if (selectedCategoryKey) return categories;
    if (!searchText.trim()) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.description.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, selectedCategoryKey, categories]);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return [];
    let current = allPosts.filter((p) => p.categoryKey === selectedCategory.key);

    if (selectedSubKey !== "all")
      current = current.filter((p) => p.subKey === selectedSubKey);

    if (selectedSubSubKey !== "all")
      current = current.filter((p) => p.subSubKey === selectedSubSubKey);

    if (contentTypeFilter !== "all")
      current = current.filter((p) => p.type === contentTypeFilter);

    if (searchText.trim())
      current = current.filter((p) =>
        p.title.toLowerCase().includes(searchText.toLowerCase())
      );

    return current.sort((a, b) => b.id - a.id);
  }, [selectedCategory, selectedSubKey, selectedSubSubKey, contentTypeFilter, searchText, allPosts]);

  const handleBack = () => {
    setSelectedCategoryKey(null);
    setSelectedSubKey("all");
    setSelectedSubSubKey("all");
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: ACCENT_COLOR_HEX }} spin />} />
          <p className="mt-4 text-gray-500">กำลังโหลดหมวดหมู่...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      {contextHolder}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ------------------------------------------------------ */}
        {/* Breadcrumb */}
        {selectedCategory && (
          <Button
            onClick={handleBack}
            type="link"
            icon={<ArrowLeftOutlined />}
            style={{ paddingLeft: 0, color: ACCENT_COLOR_HEX }}
          >
            กลับหน้าหลัก
          </Button>
        )}

        {/* ------------------------------------------------------ */}
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {selectedCategory
            ? selectedCategory.name
            : "หมวดหมู่ทั้งหมด"}
        </h1>

        <p className="text-gray-500 mb-6 text-sm">
          {selectedCategory
            ? selectedCategory.description
            : "ค้นหาหมวดหมู่ที่สนใจ"}
        </p>

        {/* ------------------------------------------------------ */}
        {/* Search */}
        <Search
          placeholder="ค้นหา..."
          style={{ maxWidth: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />

        {/* ------------------------------------------------------ */}
        {/* LEVEL 1 Category */}
        {!selectedCategory && (
          <Row gutter={[24, 24]} className="mt-8">
            {filteredCategories.length === 0 ? (
              <Col span={24}>
                <Empty description="ไม่พบหมวดหมู่" />
              </Col>
            ) : (
              filteredCategories.map((cat) => (
                <Col key={cat.key} xs={24} sm={12} lg={8}>
                  <Card
                    hoverable
                    bordered={false}
                    bodyStyle={{ padding: 20 }}
                    onClick={() => setSelectedCategoryKey(cat.key)}
                    style={{
                      borderRadius: 16,
                      cursor: "pointer",
                      background: ACCENT_COLOR_BG,
                      boxShadow: "0 4px 16px rgba(255, 106, 0, 0.15)",
                      transition: "0.25s",
                    }}
                  >
                    <Space align="start" size={16}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          background: ACCENT_COLOR_HEX,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: cat.emojiIcon ? 24 : 22,
                          boxShadow: "0 0 10px rgba(255, 106, 0, 0.4)",
                        }}
                      >
                        {cat.emojiIcon || cat.icon}
                      </div>

                      <div>
                        <h3 className="text-base font-bold">{cat.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {cat.description}
                        </p>
                      </div>
                    </Space>

                    <div
                      style={{
                        borderTop: "1px solid #ffd7b4",
                        marginTop: 14,
                        paddingTop: 6,
                        fontSize: 12,
                        display: "flex",
                        gap: 18,
                        color: ACCENT_COLOR_HEX,
                      }}
                    >
                      <span>
                        {cat.stats.posts} โพสต์
                      </span>
                      <span>
                        {cat.subcategories.length} หัวข้อย่อย
                      </span>
                    </div>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        )}

        {/* ------------------------------------------------------ */}
        {/* LEVEL 2 Category */}
        {selectedCategory && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              <Tag
                color={selectedSubKey === "all" ? "orange" : "default"}
                onClick={() => {
                  setSelectedSubKey("all");
                  setSelectedSubSubKey("all");
                }}
                style={{
                  borderRadius: 999,
                  cursor: "pointer",
                }}
              >
                ทั้งหมด
              </Tag>

              {selectedCategory.subcategories.map((sub) => (
                <Tag
                  key={sub.ID}
                  color={selectedSubKey === String(sub.ID) ? "orange" : "default"}
                  onClick={() => {
                    setSelectedSubKey(String(sub.ID));
                    setSelectedSubSubKey("all");
                  }}
                  style={{
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  {sub.title}
                </Tag>
              ))}
            </div>

            {activeSubCategory?.children && activeSubCategory.children.length > 0 && (
              <div className="mt-4">
                <Select
                  style={{ width: 240 }}
                  value={selectedSubSubKey === "all" ? undefined : selectedSubSubKey}
                  placeholder="เลือกหัวข้อย่อยย่อย"
                  onChange={(val) => setSelectedSubSubKey(val ?? "all")}
                  allowClear
                  options={[
                    { value: "all", label: "ทั้งหมด" },
                    ...activeSubCategory.children.map((c) => ({
                      value: String(c.ID),
                      label: c.title,
                    })),
                  ]}
                />
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-4">
              <Segmented
                value={contentTypeFilter}
                onChange={(val) => setContentTypeFilter(val as ContentType | "all")}
                options={[
                  { label: "ทั้งหมด", value: "all" },
                  { label: "โพสต์", value: "post" },
                  { label: "รีวิว", value: "review" },
                  { label: "โพล", value: "poll" },
                ]}
              />

              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                style={{
                  borderRadius: 12,
                  background: ACCENT_COLOR_HEX,
                  borderColor: ACCENT_COLOR_HEX,
                }}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (selectedCategory) params.set("mainCategoryId", selectedCategory.key);
                  if (selectedSubKey !== "all") params.set("subCategory1Id", selectedSubKey);
                  if (selectedSubSubKey !== "all") params.set("subCategory2Id", selectedSubSubKey);
                  navigate(`/User/Post/create_post?${params.toString()}`);
                }}
              >
                สร้างโพสต์ใหม่
              </Button>

              <Button
                icon={<PlusCircleOutlined />}
                style={{
                  borderRadius: 12,
                  borderColor: ACCENT_COLOR_HEX,
                  color: ACCENT_COLOR_HEX,
                }}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (selectedCategory) params.set("mainCategoryId", selectedCategory.key);
                  if (selectedSubKey !== "all") params.set("subCategory1Id", selectedSubKey);
                  if (selectedSubSubKey !== "all") params.set("subCategory2Id", selectedSubSubKey);
                  navigate(`/User/Review/createreview?${params.toString()}`);
                }}
              >
                สร้างรีวิว
              </Button>

              <Button
                icon={<PlusCircleOutlined />}
                style={{
                  borderRadius: 12,
                  borderColor: "#8b5cf6",
                  color: "#8b5cf6",
                }}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (selectedCategory) params.set("mainCategoryId", selectedCategory.key);
                  if (selectedSubKey !== "all") params.set("subCategory1Id", selectedSubKey);
                  if (selectedSubSubKey !== "all") params.set("subCategory2Id", selectedSubSubKey);
                  navigate(`/User/Voting/create?${params.toString()}`);
                }}
              >
                สร้างโพล
              </Button>
            </div>

            <Card
              style={{
                marginTop: 26,
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(255, 106, 0, 0.08)",
              }}
              bodyStyle={{ padding: 0 }}
            >
              {filteredPosts.length === 0 ? (
                <Empty
                  style={{ padding: "52px 0" }}
                  description="ไม่พบเนื้อหาในหมวดนี้"
                />
              ) : (
                <List
                  dataSource={filteredPosts}
                  itemLayout="vertical"
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      onClick={() => navigate(`/User/Post/detail/${item.id}`)}
                      style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #FFF1E0",
                        cursor: "pointer",
                      }}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={item.authorAvatar} />}
                        title={
                          <div className="text-base font-bold text-gray-800">
                            {item.title}
                          </div>
                        }
                        description={
                          <div>
                            <span className="text-xs text-gray-500">
                              {item.authorName} · {item.createdAt}
                            </span>

                            {item.type === "review" && (
                              <Badge
                                color="purple"
                                text="รีวิว"
                                style={{ marginLeft: 8 }}
                              />
                            )}

                            {item.type === "poll" && (
                              <Badge
                                color="orange"
                                text="โพล"
                                style={{ marginLeft: 8 }}
                              />
                            )}

                            <p className="mt-1 text-gray-600 text-sm">
                              {item.excerpt}
                            </p>
                          </div>
                        }
                      />

                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          gap: 12,
                          fontSize: 12,
                          color: ACCENT_COLOR_HEX,
                        }}
                      >
                        <span>
                          <LikeOutlined /> {item.likes} ถูกใจ
                        </span>
                        <span>
                          <MessageOutlined /> {item.comments} ความเห็น
                        </span>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </>
        )}
      </div>
    </main>
  );
};

export default Group;
