// EditPost.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    Input,
    Button,
    Space,
    Typography,
    Switch,
    Spin,
    Upload,
    Image,
    App,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
    ArrowLeftOutlined,
    PlusOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileZipOutlined,
    DeleteOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import postService from "../../../../services/http/post_service";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ORANGE = "#ff6a00";

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

interface ExistingImage {
    id: number;
    url: string;
    orderIndex: number;
}

interface ExistingAttachment {
    id: number;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    orderIndex: number;
}

// ---------------- Component ----------------
const EditPost: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { message } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [detail, setDetail] = useState("");
    const [anonymous, setAnonymous] = useState(false);

    // Existing files from server
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
    const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([]);

    // New files to upload
    const [newImageList, setNewImageList] = useState<UploadFile[]>([]);
    const [newAttachmentList, setNewAttachmentList] = useState<UploadFile[]>([]);

    // Fetch existing post data
    useEffect(() => {
        const fetchPost = async () => {
            if (!id) {
                navigate("/User/Post");
                return;
            }
            try {
                setLoading(true);
                const response = await postService.getById(Number(id));
                const post = response.data.data;
                setTitle(post.title);
                setDetail(post.content);
                setAnonymous(post.is_anonymous);

                // Load existing images
                const images = (post.images || []).map((img: { ID: number; url: string; order_index: number }) => ({
                    id: img.ID,
                    url: img.url,
                    orderIndex: img.order_index,
                }));
                setExistingImages(images);

                // Load existing attachments
                const attachments = (post.attachments || []).map((att: { ID: number; file_url: string; file_name: string; file_size: number; order_index: number }) => ({
                    id: att.ID,
                    fileUrl: att.file_url,
                    fileName: att.file_name,
                    fileSize: att.file_size,
                    orderIndex: att.order_index,
                }));
                setExistingAttachments(attachments);
            } catch (error) {
                console.error("Failed to fetch post:", error);
                message.error("ไม่สามารถโหลดโพสต์ได้");
                navigate("/User/Post");
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id, navigate]);

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
        return false;
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
        return false;
    };

    const handleNewImageChange: UploadProps["onChange"] = ({ fileList }) => {
        const remaining = MAX_IMAGES - (existingImages.length - deletedImageIds.length);
        setNewImageList(fileList.slice(0, remaining));
    };

    const handleNewAttachmentChange: UploadProps["onChange"] = ({ fileList }) => {
        const remaining = MAX_ATTACHMENTS - (existingAttachments.length - deletedAttachmentIds.length);
        setNewAttachmentList(fileList.slice(0, remaining));
    };

    const handleDeleteExistingImage = (imageId: number) => {
        setDeletedImageIds([...deletedImageIds, imageId]);
    };

    const handleDeleteExistingAttachment = (attachmentId: number) => {
        setDeletedAttachmentIds([...deletedAttachmentIds, attachmentId]);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        if (ext === "pdf") return <FilePdfOutlined style={{ color: "#e74c3c" }} />;
        if (ext === "docx" || ext === "doc") return <FileWordOutlined style={{ color: "#2980b9" }} />;
        if (ext === "xlsx" || ext === "xls") return <FileExcelOutlined style={{ color: "#27ae60" }} />;
        if (ext === "zip" || ext === "rar") return <FileZipOutlined style={{ color: "#f39c12" }} />;
        return <FileOutlined style={{ color: "#666" }} />;
    };

    const handleSubmit = async () => {
        if (!title.trim() || !detail.trim()) {
            message.warning("กรุณากรอกหัวข้อและรายละเอียดโพสต์");
            return;
        }

        try {
            setSaving(true);

            // Create FormData
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", detail);
            formData.append("is_anonymous", String(anonymous));

            // Append deleted file IDs
            deletedImageIds.forEach((imgId) => {
                formData.append("deleted_image_ids", String(imgId));
            });
            deletedAttachmentIds.forEach((attId) => {
                formData.append("deleted_attachment_ids", String(attId));
            });

            // Append new images
            newImageList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("images", file.originFileObj);
                }
            });

            // Append new attachments
            newAttachmentList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("attachments", file.originFileObj);
                }
            });

            await postService.updateWithFiles(Number(id), formData);
            message.success("แก้ไขโพสต์สำเร็จ");
            navigate(`/User/Post/detail/${id}`);
        } catch (error) {
            console.error("Failed to update post:", error);
            message.error("ไม่สามารถแก้ไขโพสต์ได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/User/Post/detail/${id}`);
    };

    if (loading) {
        return (
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <div className="flex items-center justify-center h-64">
                    <Spin size="large" />
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
                {/* Back */}
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(`/User/Post/detail/${id}`)}
                    style={{ paddingLeft: 0, marginBottom: 8 }}
                >
                    กลับไปหน้าโพสต์
                </Button>

                <Card
                    bordered={false}
                    style={{
                        borderRadius: 18,
                        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                    bodyStyle={{ padding: 24 }}
                >
                    <Title level={4} style={{ marginBottom: 16 }}>
                        แก้ไขโพสต์
                    </Title>

                    {/* หัวข้อ */}
                    <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
                        <Text strong>หัวข้อโพสต์</Text>
                        <Input
                            placeholder="กรอกหัวข้อโพสต์"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                        />
                    </Space>

                    {/* รายละเอียด */}
                    <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
                        <Text strong>รายละเอียด</Text>
                        <TextArea
                            placeholder="กรอกรายละเอียดโพสต์..."
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            rows={8}
                            maxLength={5000}
                        />
                    </Space>

                    {/* รูปภาพ */}
                    <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
                        <Text strong>
                            รูปภาพ{" "}
                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                                (JPG, PNG, WEBP - ไม่เกิน 5 MB/รูป, สูงสุด {MAX_IMAGES} รูป)
                            </Text>
                        </Text>

                        {/* Existing images */}
                        {existingImages.filter(img => !deletedImageIds.includes(img.id)).length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                                {existingImages
                                    .filter(img => !deletedImageIds.includes(img.id))
                                    .map((img) => (
                                        <div key={img.id} style={{ position: "relative" }}>
                                            <Image
                                                src={`${img.url}`}
                                                alt="Existing"
                                                width={100}
                                                height={100}
                                                style={{ objectFit: "cover", borderRadius: 8 }}
                                            />
                                            <Button
                                                type="primary"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleDeleteExistingImage(img.id)}
                                                style={{
                                                    position: "absolute",
                                                    top: 4,
                                                    right: 4,
                                                    borderRadius: "50%",
                                                    width: 24,
                                                    height: 24,
                                                    padding: 0,
                                                }}
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Upload new images */}
                        <Upload
                            listType="picture-card"
                            fileList={newImageList}
                            onChange={handleNewImageChange}
                            beforeUpload={beforeImageUpload}
                            accept=".jpg,.jpeg,.png,.webp"
                            multiple
                        >
                            {(existingImages.length - deletedImageIds.length + newImageList.length) < MAX_IMAGES && (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>เพิ่มรูป</div>
                                </div>
                            )}
                        </Upload>
                    </Space>

                    {/* ไฟล์แนบ */}
                    <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
                        <Text strong>
                            ไฟล์แนบ{" "}
                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                                (PDF, DOCX, XLSX, ZIP - ไม่เกิน 20 MB/ไฟล์, สูงสุด {MAX_ATTACHMENTS} ไฟล์)
                            </Text>
                        </Text>

                        {/* Existing attachments */}
                        {existingAttachments.filter(att => !deletedAttachmentIds.includes(att.id)).length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                                {existingAttachments
                                    .filter(att => !deletedAttachmentIds.includes(att.id))
                                    .map((att) => (
                                        <div
                                            key={att.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "8px 12px",
                                                background: "#f5f5f5",
                                                borderRadius: 8,
                                                gap: 12,
                                            }}
                                        >
                                            <span style={{ fontSize: 20 }}>{getFileIcon(att.fileName)}</span>
                                            <div style={{ flex: 1 }}>
                                                <Text strong style={{ display: "block" }}>{att.fileName}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{formatSize(att.fileSize)}</Text>
                                            </div>
                                            <Button
                                                type="text"
                                                icon={<DownloadOutlined />}
                                                href={`${att.fileUrl}`}
                                                target="_blank"
                                            />
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleDeleteExistingAttachment(att.id)}
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Upload new attachments */}
                        {(existingAttachments.length - deletedAttachmentIds.length + newAttachmentList.length) < MAX_ATTACHMENTS && (
                            <Upload
                                fileList={newAttachmentList}
                                onChange={handleNewAttachmentChange}
                                beforeUpload={beforeAttachmentUpload}
                                accept=".pdf,.docx,.xlsx,.zip"
                                multiple
                            >
                                <Button icon={<FileOutlined />}>
                                    เพิ่มไฟล์แนบ ({existingAttachments.length - deletedAttachmentIds.length + newAttachmentList.length}/{MAX_ATTACHMENTS})
                                </Button>
                            </Upload>
                        )}
                    </Space>

                    {/* Anonymous */}
                    <Space style={{ marginBottom: 24 }}>
                        <Switch
                            checked={anonymous}
                            onChange={setAnonymous}
                            style={{ backgroundColor: anonymous ? ORANGE : undefined }}
                        />
                        <Text>โพสต์แบบไม่เปิดเผยชื่อ</Text>
                    </Space>

                    {/* ปุ่ม */}
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                        <Button onClick={handleCancel}>ยกเลิก</Button>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={saving}
                            style={{ backgroundColor: ORANGE, borderColor: ORANGE }}
                        >
                            บันทึกการแก้ไข
                        </Button>
                    </Space>
                </Card>
            </div>
        </main>
    );
};

export default EditPost;
