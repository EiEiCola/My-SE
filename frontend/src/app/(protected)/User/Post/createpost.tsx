// CreatePost.tsx
import React, { useState, useMemo, useEffect } from "react";
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
    Upload,
    Modal,
    App,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
    PictureOutlined,
    PlusOutlined,
    ArrowLeftOutlined,
    RightOutlined,
    FileOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import postService from "../../../../services/http/post_service";
import { publicCategoryAPI } from "../../../../services/http/admin_category";
import type {
    MainCategory,
    SubCategoryL1,
    SubCategoryL2,
} from "../../../../services/http/admin_category";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ORANGE = "#ff6a00";
const ORANGE_LIGHT = "#fff3e6";

// ---------------- Component ----------------
const CreatePost: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { message } = App.useApp();
    const [title, setTitle] = useState("");
    const [detail, setDetail] = useState("");

    // Loading state for categories
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Category data from API
    const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
    const [subCategoriesL1, setSubCategoriesL1] = useState<SubCategoryL1[]>([]);
    const [subCategoriesL2, setSubCategoriesL2] = useState<SubCategoryL2[]>([]);

    // Selected category state
    const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
    const [selectedSub1Id, setSelectedSub1Id] = useState<number | null>(null);
    const [selectedSub2Ids, setSelectedSub2Ids] = useState<number[]>([]);
    const [searchText, setSearchText] = useState("");

    const [anonymous, setAnonymous] = useState(false);

    // File upload states
    const [imageList, setImageList] = useState<UploadFile[]>([]);
    const [attachmentList, setAttachmentList] = useState<UploadFile[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");

    // File validation constants
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20 MB
    const MAX_IMAGES = 10;
    const MAX_ATTACHMENTS = 3;
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const ALLOWED_ATTACHMENT_TYPES = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "application/x-zip-compressed",
    ];

    // Get query params for pre-selecting categories
    const mainCategoryIdFromUrl = searchParams.get("mainCategoryId");
    const subCategory1IdFromUrl = searchParams.get("subCategory1Id");
    const subCategory2IdFromUrl = searchParams.get("subCategory2Id");

    // Fetch main categories on mount
    useEffect(() => {
        const fetchMainCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await publicCategoryAPI.listMain();
                const cats = response.data.data || [];
                setMainCategories(cats);

                // Pre-select from URL params or default to first
                if (mainCategoryIdFromUrl) {
                    const id = parseInt(mainCategoryIdFromUrl, 10);
                    if (cats.some((c: MainCategory) => c.ID === id)) {
                        setSelectedMainId(id);
                    } else if (cats.length > 0) {
                        setSelectedMainId(cats[0].ID);
                    }
                } else if (cats.length > 0) {
                    setSelectedMainId(cats[0].ID);
                }
            } catch (error) {
                console.error("Failed to fetch main categories:", error);
                message.error("ไม่สามารถโหลดหมวดหมู่ได้");
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchMainCategories();
    }, [mainCategoryIdFromUrl]);

    // Fetch sub categories L1 when main category changes
    useEffect(() => {
        if (!selectedMainId) {
            setSubCategoriesL1([]);
            setSelectedSub1Id(null);
            return;
        }

        const fetchSub1 = async () => {
            try {
                const response = await publicCategoryAPI.listSub1(selectedMainId);
                const subs = response.data.data || [];
                setSubCategoriesL1(subs);

                // Pre-select from URL params
                if (subCategory1IdFromUrl) {
                    const id = parseInt(subCategory1IdFromUrl, 10);
                    if (subs.some((c: SubCategoryL1) => c.ID === id)) {
                        setSelectedSub1Id(id);
                    } else {
                        setSelectedSub1Id(null);
                    }
                } else {
                    setSelectedSub1Id(null);
                }
                setSubCategoriesL2([]);
                setSelectedSub2Ids([]);
            } catch (error) {
                console.error("Failed to fetch sub categories L1:", error);
            }
        };
        fetchSub1();
    }, [selectedMainId, subCategory1IdFromUrl]);

    // Fetch sub categories L2 when sub category L1 changes
    useEffect(() => {
        if (!selectedSub1Id) {
            setSubCategoriesL2([]);
            setSelectedSub2Ids([]);
            return;
        }

        const fetchSub2 = async () => {
            try {
                const response = await publicCategoryAPI.listSub2(selectedSub1Id);
                const subs = response.data.data || [];
                setSubCategoriesL2(subs);

                // Pre-select from URL params
                if (subCategory2IdFromUrl) {
                    const id = parseInt(subCategory2IdFromUrl, 10);
                    if (subs.some((c: SubCategoryL2) => c.ID === id)) {
                        setSelectedSub2Ids([id]);
                    } else {
                        setSelectedSub2Ids([]);
                    }
                } else {
                    setSelectedSub2Ids([]);
                }
            } catch (error) {
                console.error("Failed to fetch sub categories L2:", error);
            }
        };
        fetchSub2();
    }, [selectedSub1Id, subCategory2IdFromUrl]);

    // Filtered sub1 list based on search
    const filteredSub1List = useMemo(() => {
        if (!searchText.trim()) return subCategoriesL1;
        const lower = searchText.toLowerCase();
        return subCategoriesL1.filter((c) =>
            c.title.toLowerCase().includes(lower)
        );
    }, [subCategoriesL1, searchText]);

    const toggleSub2 = (id: number, checked: boolean) => {
        setSelectedSub2Ids((prev) =>
            checked ? [...prev, id] : prev.filter((k) => k !== id)
        );
    };

    // Image upload validation
    const beforeImageUpload = (file: File) => {
        const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type);
        if (!isValidType) {
            message.error("รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น");
            return Upload.LIST_IGNORE;
        }
        const isValidSize = file.size <= MAX_IMAGE_SIZE;
        if (!isValidSize) {
            message.error("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
            return Upload.LIST_IGNORE;
        }
        return false; // Prevent auto upload
    };

    // Attachment upload validation
    const beforeAttachmentUpload = (file: File) => {
        const isValidType = ALLOWED_ATTACHMENT_TYPES.includes(file.type);
        if (!isValidType) {
            message.error("รองรับเฉพาะไฟล์ PDF, DOCX, XLSX, ZIP เท่านั้น");
            return Upload.LIST_IGNORE;
        }
        const isValidSize = file.size <= MAX_ATTACHMENT_SIZE;
        if (!isValidSize) {
            message.error("ไฟล์แนบต้องมีขนาดไม่เกิน 20 MB");
            return Upload.LIST_IGNORE;
        }
        return false; // Prevent auto upload
    };

    // Handle image list change
    const handleImageChange: UploadProps["onChange"] = ({ fileList }) => {
        setImageList(fileList.slice(0, MAX_IMAGES));
    };

    // Handle attachment list change
    const handleAttachmentChange: UploadProps["onChange"] = ({ fileList }) => {
        setAttachmentList(fileList.slice(0, MAX_ATTACHMENTS));
    };

    // Preview image
    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as File);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf("/") + 1) || "");
    };

    const getBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handleSubmit = async () => {
        if (!title.trim() || !detail.trim()) {
            message.warning("กรุณากรอกหัวข้อและรายละเอียดโพสต์");
            return;
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", detail);
            formData.append("is_anonymous", String(anonymous));
            if (selectedMainId) {
                formData.append("main_category_id", String(selectedMainId));
            }
            if (selectedSub1Id) {
                formData.append("sub_category1_id", String(selectedSub1Id));
            }
            if (selectedSub2Ids.length > 0) {
                formData.append("sub_category2_id", String(selectedSub2Ids[0]));
            }

            // Append images
            imageList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("images", file.originFileObj);
                }
            });

            // Append attachments
            attachmentList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("attachments", file.originFileObj);
                }
            });

            await postService.createWithFiles(formData);
            message.success("สร้างโพสต์สำเร็จ");
            navigate("/User/Post");
        } catch (error) {
            console.error("Failed to create post:", error);
            message.error("ไม่สามารถสร้างโพสต์ได้ กรุณาลองใหม่อีกครั้ง");
        }
    };

    const handleCancel = () => {
        navigate("/User/Post");
    };

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50">
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
                        <TextArea
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            rows={8}
                            style={{
                                marginTop: 8,
                                borderRadius: 10,
                            }}
                            placeholder="พิมพ์เนื้อหาโพสต์ของคุณที่นี่…"
                        />
                    </section>

                    {/* 3. อัปโหลดรูปภาพ */}
                    <section className="mb-6">
                        <Text strong>3. อัปโหลดรูปภาพ</Text>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            (JPG, PNG, WEBP - ไม่เกิน 5 MB/รูป, สูงสุด 10 รูป)
                        </Text>
                        <div style={{ marginTop: 8 }}>
                            <Upload
                                listType="picture-card"
                                fileList={imageList}
                                onPreview={handlePreview}
                                onChange={handleImageChange}
                                beforeUpload={beforeImageUpload}
                                accept=".jpg,.jpeg,.png,.webp"
                                multiple
                            >
                                {imageList.length >= MAX_IMAGES ? null : (
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>เพิ่มรูป</div>
                                    </div>
                                )}
                            </Upload>
                        </div>
                    </section>

                    {/* 4. อัปโหลดไฟล์แนบ */}
                    <section className="mb-6">
                        <Text strong>4. แนบไฟล์</Text>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            (PDF, DOCX, XLSX, ZIP - ไม่เกิน 20 MB/ไฟล์, สูงสุด 3 ไฟล์)
                        </Text>
                        <div style={{ marginTop: 8 }}>
                            <Upload
                                fileList={attachmentList}
                                onChange={handleAttachmentChange}
                                beforeUpload={beforeAttachmentUpload}
                                accept=".pdf,.docx,.xlsx,.zip"
                                multiple
                            >
                                {attachmentList.length >= MAX_ATTACHMENTS ? null : (
                                    <Button icon={<FileOutlined />}>
                                        เลือกไฟล์แนบ ({attachmentList.length}/{MAX_ATTACHMENTS})
                                    </Button>
                                )}
                            </Upload>
                        </div>
                    </section>

                    {/* 5. เลือกหมวดหมู่ */}
                    <section className="mb-6">
                        <Text strong>5. เลือกหมวดหมู่ของโพสต์</Text>

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
                                                <span>{cat.title}</span>
                                                <RightOutlined style={{ fontSize: 10 }} />
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
                                    {filteredSub1List.length === 0 && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            ไม่มีหัวข้อย่อยในหมวดนี้
                                        </Text>
                                    )}
                                    {filteredSub1List.map((sub) => {
                                        const isActive = selectedSub1Id === sub.ID;
                                        return (
                                            <div
                                                key={sub.ID}
                                                onClick={() => {
                                                    setSelectedSub1Id(sub.ID);
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
                                                <RightOutlined style={{ fontSize: 10 }} />
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
                                    {subCategoriesL2.length === 0 ? (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            เลือกหัวข้อย่อยด้านซ้าย
                                        </Text>
                                    ) : (
                                        subCategoriesL2.map((sub2) => (
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

            {/* Image Preview Modal */}
            <Modal
                open={previewOpen}
                title={previewTitle}
                footer={null}
                onCancel={() => setPreviewOpen(false)}
            >
                <img alt="preview" style={{ width: "100%" }} src={previewImage} />
            </Modal>
        </main>
    );
};

export default CreatePost;
