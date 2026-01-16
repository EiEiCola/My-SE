// PostDetail.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    Typography,
    Button,
    Space,
    Avatar,
    Row,
    Col,
    Input,
    Switch,
    Spin,
    Tooltip,
    Image,
    Modal,
    Upload,
    App,
} from "antd";
import type { UploadFile } from "antd";
import {
    ArrowLeftOutlined,
    LikeOutlined,
    LikeFilled,
    MessageOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    WarningOutlined,
    StarOutlined,
    StarFilled,
    BookOutlined,
    BookFilled,
    DownloadOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileZipOutlined,
    PictureOutlined,
    PaperClipOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import postService from "../../../../services/http/post_service";
import { memberAPI, type MemberProfileResponse } from "../../../../services/http/member_profile";
import { friendAPI } from "../../../../services/http/friend";
import { getUserIdFromToken } from "../../../../utils/jwt";
import ReportPostModal from "./ReportPostModal";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ORANGE = "#ff6a00";
const API_BASE = import.meta.env.VITE_API_URL || "";

// Helper function to format avatar URL
const formatAvatarUrl = (url: string | undefined | null, seed?: string | number): string => {
    if (!url) return `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed || 'default'}`;
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url; // Support Base64
    if (url.startsWith("/")) return `${API_BASE}${url}`;
    return `${API_BASE}/${url}`;
};

const REPORT_REASONS = [
    "เนื้อหาไม่เหมาะสม / ลามก",
    "สแปม / โฆษณา",
    "เนื้อหาแสดงความเกลียดชัง / พาดพิง",
    "ข้อมูลส่วนตัว / ละเมิดลิขสิทธิ์",
    "การปนุ / คุกคาม",
    "เหตุผลอื่นๆ (ระบุเพิ่มเติม)",
];

interface ImageItem {
    id: number;
    url: string;
    orderIndex: number;
}

interface AttachmentItem {
    id: number;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    orderIndex: number;
}

interface PostData {
    id: number;
    title: string;
    content: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    ownerName: string;
    ownerAvatar: string;
    authorId: number | null;
    isAnonymous: boolean;
    isOwner: boolean;
    images: ImageItem[];
    attachments: AttachmentItem[];
}
interface CommentItem {
    id: number;
    content: string;
    likeCount: number;
    createdAt: string;
    ownerName: string;
    ownerAvatar: string;
    isAnonymous: boolean;
    isOwner: boolean;
    authorId?: number; // สำหรับเปรียบเทียบกับ currentUser.ID
    parentId?: number | null;
    replies?: CommentItem[];
    images?: ImageItem[];
    attachments?: AttachmentItem[];
}

// ---------------- Component ----------------
const PostDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [modal, contextHolder] = Modal.useModal();
    const { message } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState<PostData | null>(null);
    const [currentUser, setCurrentUser] = useState<MemberProfileResponse | null>(null);

    // Fetch current user
    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await memberAPI.getMe();
                if (res.data) {
                    setCurrentUser(res.data);
                }
            } catch (err) {
                console.error("Failed to load current user:", err);
            }
        };
        fetchMe();
    }, []);

    // Fetch post from API
    useEffect(() => {
        const fetchPost = async () => {
            if (!id) {
                navigate("/User/Post");
                return;
            }
            try {
                setLoading(true);

                const postResponse = await postService.getById(Number(id));

                const apiPost = postResponse.data.data;

                // Map API response to PostData format
                const createdDate = new Date(apiPost.created_at);
                const currentUserId = getUserIdFromToken();

                // Get author name and avatar
                let ownerName = "ไม่เปิดเผยชื่อ";
                let ownerAvatar = `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128`;

                if (!apiPost.is_anonymous && apiPost.author) {
                    ownerName = apiPost.author.username || `${apiPost.author.first_name} ${apiPost.author.last_name}`;
                    ownerAvatar = formatAvatarUrl(apiPost.author.member_picture, apiPost.author_id);
                }

                setPost({
                    id: apiPost.ID,
                    title: apiPost.title,
                    content: apiPost.content,
                    likeCount: apiPost.like_count,
                    commentCount: apiPost.comment_count,
                    createdAt: createdDate.toLocaleString("th-TH"),
                    ownerName,
                    ownerAvatar,
                    authorId: apiPost.is_anonymous ? null : apiPost.author_id,
                    isAnonymous: apiPost.is_anonymous,
                    // ใช้ currentUser.ID (Member ID) แทน getUserIdFromToken() (Account ID)
                    isOwner: false, // จะถูก update หลัง currentUser โหลด
                    images: (apiPost.images || []).map((img: { ID: number; url: string; order_index: number }) => ({
                        id: img.ID,
                        url: img.url,
                        orderIndex: img.order_index,
                    })),
                    attachments: (apiPost.attachments || []).map((att: { ID: number; file_url: string; file_name: string; file_size: number; order_index: number }) => ({
                        id: att.ID,
                        fileUrl: att.file_url,
                        fileName: att.file_name,
                        fileSize: att.file_size,
                        orderIndex: att.order_index,
                    })),
                });
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

    // Update isOwner when currentUser is loaded (using Member ID, not Account ID)
    useEffect(() => {
        if (currentUser && post) {
            const myMemberId = (currentUser as any)?.ID || (currentUser as any)?.id;
            if (myMemberId && post.authorId) {
                setPost(prev => prev ? {
                    ...prev,
                    isOwner: myMemberId === prev.authorId
                } : prev);
            }
        }
    }, [currentUser, post?.authorId]);

    // Comments state
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [starred, setStarred] = useState(false);

    // Fetch comments when post is loaded
    useEffect(() => {
        const fetchComments = async () => {
            if (!id) return;
            try {
                const response = await postService.getComments(Number(id));
                const apiComments = response.data.data || [];

                // Map API comments to CommentItem format
                const currentUserId = getUserIdFromToken();
                const mappedComments: CommentItem[] = apiComments.map((c) => {
                    let ownerName = "ไม่เปิดเผยชื่อ";
                    let ownerAvatar = `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128`;

                    if (!c.is_anonymous && c.author) {
                        ownerName = c.author.username || `${c.author.first_name} ${c.author.last_name}`;
                        ownerAvatar = c.author.member_picture || `https://api.dicebear.com/7.x/thumbs/svg?seed=${c.author_id}`;
                    }

                    return {
                        id: c.ID,
                        content: c.content,
                        likeCount: c.like_count,
                        createdAt: new Date(c.created_at).toLocaleString("th-TH"),
                        ownerName,
                        ownerAvatar,
                        isAnonymous: c.is_anonymous,
                        isOwner: false, // จะถูก update ใน useEffect เมื่อ currentUser โหลด
                        authorId: c.author_id, // เก็บ author_id ไว้ใช้ทีหลัง
                        parentId: null,
                        replies: [],
                        images: (c.images || []).map((img: { ID: number; url: string; order_index: number }) => ({
                            id: img.ID,
                            url: img.url,
                            orderIndex: img.order_index,
                        })),
                        attachments: (c.attachments || []).map((att: { ID: number; file_url: string; file_name: string; file_size: number; order_index: number }) => ({
                            id: att.ID,
                            fileUrl: att.file_url,
                            fileName: att.file_name,
                            fileSize: att.file_size,
                            orderIndex: att.order_index,
                        })),
                    };
                });

                setComments(mappedComments);

                // Initialize commentLikedMap from API response (is_liked field)
                const likedMap: Record<number, boolean> = {};
                apiComments.forEach((c: any) => {
                    if (c.is_liked) {
                        likedMap[c.ID] = true;
                    }
                });
                setCommentLikedMap(likedMap);
            } catch (error) {
                console.error("Failed to fetch comments:", error);
            }
        };

        // Check user status (like, bookmark, star)
        const checkUserStatus = async () => {
            if (!id) return;
            try {
                const response = await postService.getLikeStatus(Number(id));
                setLiked(response.data.is_liked);
                setBookmarked(response.data.is_bookmarked);
                setStarred(response.data.is_starred);
            } catch (error) {
                console.error("Failed to check status:", error);
            }
        };

        fetchComments();
        checkUserStatus();
    }, [id]);

    // Update comments isOwner when currentUser or comments are loaded (using Member ID)
    useEffect(() => {
        if (currentUser && comments.length > 0) {
            const myMemberId = (currentUser as any)?.ID || (currentUser as any)?.id;
            if (myMemberId) {
                // เช็คว่ามี comment ที่ยังไม่ได้ update isOwner หรือไม่
                const needsUpdate = comments.some(c =>
                    c.authorId !== undefined && c.isOwner !== (c.authorId === myMemberId)
                );
                if (needsUpdate) {
                    setComments(prev => prev.map(c => ({
                        ...c,
                        isOwner: c.authorId === myMemberId
                    })));
                }
            }
        }
    }, [currentUser, comments.length]);

    // input comment
    const [commentText, setCommentText] = useState("");
    const [commentAnonymous, setCommentAnonymous] = useState(false);
    const [commentImages, setCommentImages] = useState<UploadFile[]>([]);
    const [commentAttachments, setCommentAttachments] = useState<UploadFile[]>([]);

    // state: กำลังตอบกลับคอมเมนต์ไหน
    const [replyTo, setReplyTo] = useState<CommentItem | null>(null);

    // state: id ของคอมเมนต์ที่เปิด/ซ่อน reply
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>(
        {}
    );

    // state: track ว่า user ไลค์ comment ไหนบ้าง (commentId -> isLiked)
    const [commentLikedMap, setCommentLikedMap] = useState<Record<number, boolean>>({});

    // Toggle like for a comment
    const handleToggleLikeComment = async (commentId: number) => {
        if (!post) return;
        try {
            const response = await postService.toggleLikeComment(post.id, commentId);
            const { is_liked, like_count } = response.data;

            // Update liked state
            setCommentLikedMap(prev => ({ ...prev, [commentId]: is_liked }));

            // Update comment like count
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, likeCount: like_count } : c
            ));
        } catch (error) {
            console.error("Failed to toggle like comment:", error);
            message.error("ไม่สามารถกดไลค์ได้");
        }
    };
    // Report modal states
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedReportReason, setSelectedReportReason] = useState("");
    const [otherReportReason, setOtherReportReason] = useState("");


    const handleToggleLikePost = async () => {
        if (!post) return;
        try {
            const response = await postService.toggleLike(post.id);
            setLiked(response.data.is_liked);
            setPost((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    likeCount: Number(response.data.like_count),
                };
            });
        } catch (error) {
            console.error("Failed to toggle like:", error);
            message.error("ไม่สามารถกด like ได้");
        }
    };

    const handleToggleBookmark = async () => {
        if (!post) return;
        try {
            const response = await postService.toggleBookmark(post.id);
            setBookmarked(response.data.is_bookmarked);
            if (response.data.is_bookmarked) {
                message.success("บันทึกโพสต์ใน My Fav แล้ว");
            } else {
                message.success("ยกเลิกการบันทึกโพสต์แล้ว");
            }
        } catch (error: any) {
            console.error("Failed to toggle bookmark:", error);
            const errorMsg = error?.response?.data?.error || "ไม่สามารถบันทึกโพสต์ได้";
            message.error(errorMsg);
        }
    };

    const handleSendStar = async () => {
        if (!post) return;
        if (starred) {
            message.info("คุณได้มอบดาวให้โพสต์นี้ไปแล้ว");
            return;
        }
        try {
            const response = await postService.sendStar(post.id);
            if (response.data.is_starred) {
                setStarred(true);
                message.success("มอบดาวให้ผู้เขียนเรียบร้อย (ผู้เขียนได้รับคะแนน)");
            }
        } catch (error: any) {
            console.error("Failed to send star:", error);
            if (error.response?.data?.error) {
                message.error(error.response.data.error);
            } else {
                message.error("ไม่สามารถมอบดาวได้");
            }
        }
    };

    const handleDeletePost = () => {
        if (!post) return;
        modal.confirm({
            title: "ยืนยันการลบโพสต์",
            content: "คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
            okText: "ลบโพสต์",
            okType: "danger",
            cancelText: "ยกเลิก",
            centered: true,
            onOk: async () => {
                try {
                    await postService.delete(post.id);
                    message.success("ลบโพสต์สำเร็จ");
                    navigate("/User/Post");
                } catch (error) {
                    console.error("Failed to delete post:", error);
                    message.error("ไม่สามารถลบโพสต์ได้");
                }
            },
        });
    };

    const handleReportPost = () => {
        if (!post) return;
        setIsReportModalOpen(true);
    };

    const handleSubmitReport = async () => {
        if (!post) return;

        const title = selectedReportReason;
        const description =
            selectedReportReason === "เหตุผลอื่นๆ (ระบุเพิ่มเติม)"
                ? otherReportReason
                : selectedReportReason;

        if (!description.trim()) {
            message.error("กรุณากรอกรายละเอียดการรายงาน");
            return;
        }

        try {
            await postService.reportPost(post.id, {
                title,
                description,
                medias: [],
            });
            message.success("ส่งรายงานเรียบร้อยแล้ว ทีมงานจะตรวจสอบในเร็วๆนี้");
            setIsReportModalOpen(false);
            setSelectedReportReason("");
            setOtherReportReason("");
        } catch (error: any) {
            console.error("Failed to report post:", error);
            const errorMsg = error?.response?.data?.error || "ไม่สามารถส่งรายงานได้";
            message.error(errorMsg);
        }
    };

    // ส่งคอมเมนต์ (ถ้า replyTo != null → ตอบกลับคอมเมนต์นั้น)
    const handleSubmitComment = async () => {
        if (!commentText.trim()) {
            message.warning("กรุณากรอกเนื้อหาความคิดเห็น");
            return;
        }
        if (!post) return;

        try {
            let response;

            // Check if there are files to upload
            const hasFiles = commentImages.length > 0 || commentAttachments.length > 0;

            if (hasFiles) {
                // Use FormData for multipart upload
                const formData = new FormData();
                formData.append("content", commentText);
                formData.append("is_anonymous", commentAnonymous.toString());

                // Add images
                for (const file of commentImages) {
                    if (file.originFileObj) {
                        formData.append("images", file.originFileObj);
                    }
                }

                // Add attachments
                for (const file of commentAttachments) {
                    if (file.originFileObj) {
                        formData.append("attachments", file.originFileObj);
                    }
                }

                response = await postService.createCommentWithFiles(post.id, formData);
            } else {
                // Use JSON for simple comment without files
                response = await postService.createComment(post.id, commentText, commentAnonymous);
            }

            const newComment = response.data.data;

            // Map API response to CommentItem format
            const baseComment: CommentItem = {
                id: newComment.ID,
                content: newComment.content,
                likeCount: newComment.like_count,
                createdAt: new Date(newComment.created_at).toLocaleString("th-TH"),
                ownerName: newComment.is_anonymous ? "ไม่เปิดเผยชื่อ" : (newComment.author?.username || currentUser?.username || "คุณ"),
                ownerAvatar: newComment.is_anonymous
                    ? `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128`
                    : formatAvatarUrl(newComment.author?.member_picture || currentUser?.member_picture),
                isAnonymous: newComment.is_anonymous,
                isOwner: true,
                parentId: replyTo ? replyTo.id : null,
                replies: [],
                images: (newComment.images || []).map((img: { ID: number; url: string; order_index: number }) => ({
                    id: img.ID,
                    url: img.url,
                    orderIndex: img.order_index,
                })),
                attachments: (newComment.attachments || []).map((att: { ID: number; file_url: string; file_name: string; file_size: number; order_index: number }) => ({
                    id: att.ID,
                    fileUrl: att.file_url,
                    fileName: att.file_name,
                    fileSize: att.file_size,
                    orderIndex: att.order_index,
                })),
            };

            if (replyTo) {
                // เพิ่มเป็น reply ของคอมเมนต์ที่เลือกตอบ
                setComments((prev) =>
                    prev.map((c) => {
                        if (c.id === replyTo.id) {
                            const replies = c.replies ?? [];
                            return { ...c, replies: [...replies, baseComment] };
                        }
                        return c;
                    })
                );
                // เปิดส่วนตอบกลับของคอมเมนต์นั้นอัตโนมัติ
                setExpandedReplies((prev) => ({ ...prev, [replyTo.id]: true }));
                setReplyTo(null);
            } else {
                // เป็นคอมเมนต์ใหม่ระดับบนสุด
                setComments((prev) => [baseComment, ...prev]);
            }

            setPost((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    commentCount: prev.commentCount + 1,
                };
            });
            setCommentText("");
            setCommentAnonymous(false);
            setCommentImages([]);
            setCommentAttachments([]);
            message.success("เพิ่มความคิดเห็นสำเร็จ");
        } catch (error) {
            console.error("Failed to create comment:", error);
            message.error("ไม่สามารถเพิ่มความคิดเห็นได้");
        }
    };

    const handleDeleteComment = (commentId: number, parentId?: number | null) => {
        if (parentId) {
            // ลบ reply
            setComments((prev) =>
                prev.map((c) => {
                    if (c.id === parentId) {
                        const before = c.replies ?? [];
                        const after = before.filter((r) => r.id !== commentId);
                        return { ...c, replies: after };
                    }
                    return c;
                })
            );
            setPost((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    commentCount: Math.max(0, prev.commentCount - 1),
                };
            });
        } else {
            // ลบคอมเมนต์หลัก + หักจำนวนตาม reply ด้วย
            setComments((prev) => {
                const target = prev.find((c) => c.id === commentId);
                const replyCount = target?.replies?.length ?? 0;
                const after = prev.filter((c) => c.id !== commentId);
                setPost((p) => {
                    if (!p) return p;
                    return {
                        ...p,
                        commentCount: Math.max(0, p.commentCount - (1 + replyCount)),
                    };
                });
                return after;
            });
        }
    };

    // คลิก "ตอบกลับ" ที่คอมเมนต์หลัก
    const handleReplyComment = (comment: CommentItem) => {
        const displayName = comment.isAnonymous
            ? "ไม่เปิดเผยชื่อ"
            : comment.ownerName;
        const mention = `@${displayName} `;
        setReplyTo(comment);
        setCommentText((prev) =>
            prev.trim().length > 0 ? `${prev} \n${mention} ` : mention
        );
        message.info("กำลังตอบกลับความคิดเห็น");
    };

    const toggleRepliesVisible = (commentId: number) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    // Loading state
    if (loading) {
        return (
            <main className="flex-1 overflow-y-auto bg-orange-100">
                <div className="flex items-center justify-center h-64">
                    <Spin size="large" />
                </div>
            </main>
        );
    }

    // Null guard for post
    if (!post) {
        return (
            <main className="flex-1 overflow-y-auto bg-orange-100">
                <div className="flex items-center justify-center h-64">
                    <Text>ไม่พบโพสต์</Text>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto bg-orange-100">
            {contextHolder}
            <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
                {/* Back */}
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ paddingLeft: 2, marginBottom: 8 }}
                >
                    กลับ
                </Button>

                {/* การ์ดโพสต์หลัก */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 18,
                        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                        marginBottom: 16,
                        position: "relative", // For absolute positioning if needed
                    }}
                    bodyStyle={{ padding: 20 }}
                >
                    {/* แถวบน: Bookmark + Title + Action */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        {/* Left: Bookmark Icon & Title */}
                        <div style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
                            {/* ซ่อนปุ่ม Bookmark ถ้าเป็นโพสต์ตัวเอง */}
                            {!post.isOwner && (
                                <Tooltip title="บันทึกใน My Fav">
                                    <Button
                                        type="text"
                                        icon={bookmarked ? <BookFilled style={{ fontSize: 20 }} /> : <BookOutlined style={{ fontSize: 20 }} />}
                                        onClick={handleToggleBookmark}
                                        style={{ marginRight: 8, padding: 0, height: "auto", color: bookmarked ? "#333" : "#888" }}
                                    />
                                </Tooltip>
                            )}
                            <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                                {post.title}
                            </Title>
                        </div>

                        {/* Right: Actions */}
                        <div>
                            {post.isOwner && (
                                <Space>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => navigate(`/User/Post/edit/${post.id}`)}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={handleDeletePost}
                                    />
                                </Space>
                            )}
                        </div>
                    </div>

                    {/* เนื้อหาโพสต์ (รองรับอีโมจิ) */}
                    <div
                        style={{
                            padding: 16,
                            background: "#f9fafb",
                            borderRadius: 12,
                            minHeight: 120,
                        }}
                    >
                        <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                            {post.content}
                        </Paragraph>
                    </div>

                    {/* Image Gallery */}
                    {post.images && post.images.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <Space align="center" style={{ marginBottom: 12 }}>
                                <PictureOutlined style={{ fontSize: 18, color: ORANGE }} />
                                <Text strong style={{ fontSize: 15 }}>รูปภาพแนบ ({post.images.length})</Text>
                            </Space>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                                gap: 12,
                                background: "#f5f5f5",
                                padding: 12,
                                borderRadius: 12,
                            }}>
                                <Image.PreviewGroup>
                                    {post.images.sort((a, b) => a.orderIndex - b.orderIndex).map((img) => (
                                        <div
                                            key={img.id}
                                            style={{
                                                borderRadius: 8,
                                                overflow: "hidden",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                background: "#fff",
                                            }}
                                        >
                                            <Image
                                                src={`${img.url}`}
                                                alt={`Post image ${img.orderIndex + 1}`}
                                                style={{
                                                    width: "100%",
                                                    height: 120,
                                                    objectFit: "cover",
                                                    cursor: "pointer",
                                                }}
                                                placeholder={
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        height: 120,
                                                        background: "#fafafa"
                                                    }}>
                                                        <Spin size="small" />
                                                    </div>
                                                }
                                            />
                                        </div>
                                    ))}
                                </Image.PreviewGroup>
                            </div>
                        </div>
                    )}

                    {/* Attachment List */}
                    {post.attachments && post.attachments.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <Space align="center" style={{ marginBottom: 12 }}>
                                <FileOutlined style={{ fontSize: 18, color: ORANGE }} />
                                <Text strong style={{ fontSize: 15 }}>ไฟล์แนบ ({post.attachments.length})</Text>
                            </Space>
                            <div style={{
                                background: "#f5f5f5",
                                borderRadius: 12,
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}>
                                {post.attachments.sort((a, b) => a.orderIndex - b.orderIndex).map((file) => {
                                    const ext = file.fileName.split(".").pop()?.toLowerCase() || "";
                                    let icon = <FileOutlined />;
                                    let iconColor = "#666";
                                    if (ext === "pdf") { icon = <FilePdfOutlined />; iconColor = "#e74c3c"; }
                                    else if (ext === "docx" || ext === "doc") { icon = <FileWordOutlined />; iconColor = "#2980b9"; }
                                    else if (ext === "xlsx" || ext === "xls") { icon = <FileExcelOutlined />; iconColor = "#27ae60"; }
                                    else if (ext === "zip" || ext === "rar") { icon = <FileZipOutlined />; iconColor = "#f39c12"; }

                                    const formatSize = (bytes: number) => {
                                        if (bytes < 1024) return `${bytes} B`;
                                        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                                        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                                    };

                                    return (
                                        <a
                                            key={file.id}
                                            href={`${file.fileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={file.fileName}
                                            style={{ textDecoration: "none" }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "12px 16px",
                                                    background: "#fff",
                                                    borderRadius: 8,
                                                    border: "1px solid #e8e8e8",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = ORANGE;
                                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(255,106,0,0.15)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = "#e8e8e8";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                <span style={{ fontSize: 24, marginRight: 12, color: iconColor }}>{icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <Text strong style={{ display: "block", color: "#333" }}>{file.fileName}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{formatSize(file.fileSize)}</Text>
                                                </div>
                                                <DownloadOutlined style={{ fontSize: 18, color: ORANGE }} />
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* แถวล่าง: like / star / comment / owner / report */}
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Space size="large">
                                <Space>
                                    {/* Like Button (No Tooltip) */}
                                    <Button
                                        type="text"
                                        icon={liked ? <LikeFilled /> : <LikeOutlined />}
                                        onClick={handleToggleLikePost}
                                        style={{ paddingInline: 4, color: liked ? ORANGE : undefined }}
                                    />
                                    <Text strong style={{ color: ORANGE }}>
                                        {post.likeCount}
                                    </Text>
                                </Space>

                                {/* Star Button (With Tooltip) */}
                                <Space>
                                    <Tooltip title="กดเพื่อบอกว่าเนื้อหานี้ดี (เจ้าของโพสต์จะได้รับคะแนน)">
                                        <Button
                                            type="text"
                                            icon={starred ? <StarFilled /> : <StarOutlined />}
                                            onClick={handleSendStar}
                                            style={{ paddingInline: 4, color: starred ? "#fadb14" : undefined }} // Yellow/Gold for star
                                        />
                                    </Tooltip>
                                </Space>

                                <Space>
                                    <MessageOutlined />
                                    <Text>{post.commentCount}</Text>
                                </Space>
                            </Space>
                        </Col>

                        <Col>
                            <Space size="large">
                                <Space
                                    style={{
                                        cursor: post.authorId ? "pointer" : "default"
                                    }}
                                    onClick={async () => {
                                        // ถ้า anonymous ไม่ต้องทำอะไร
                                        if (!post.authorId || post.isAnonymous) return;

                                        // เช็คว่าเป็นโพสต์ตัวเอง (เปรียบเทียบ Member ID)
                                        const myMemberId = (currentUser as any)?.ID || (currentUser as any)?.id;
                                        const isMyPost = currentUser && myMemberId === post.authorId;

                                        if (isMyPost || post.isOwner) {
                                            // ไปหน้า Profile ของตัวเอง
                                            navigate("/User/Profile");
                                            return;
                                        }

                                        try {
                                            // เช็คว่าเป็นเพื่อนกันหรือไม่
                                            const friendsData = await friendAPI.getMyFriends();
                                            const friends = friendsData?.data || friendsData || [];
                                            const isFriend = Array.isArray(friends) && friends.some(
                                                (f: any) => f.id === post.authorId || f.ID === post.authorId || f.member_id === post.authorId
                                            );

                                            if (isFriend) {
                                                // เป็นเพื่อนแล้ว -> ไปหน้าเพื่อนทั้งหมด พร้อม auto-select
                                                navigate("/User/Friends/FriendRelation", { state: { selectedId: post.authorId } });
                                                return;
                                            }

                                            // ไม่ใช่เพื่อน: เช็คว่าเขาส่งคำขอมาหาเราหรือไม่
                                            const receivedData = await friendAPI.getReceivedRequests();
                                            const receivedRequests = receivedData?.data || receivedData || [];
                                            const hasPendingFromThem = Array.isArray(receivedRequests) && receivedRequests.some(
                                                (req: any) => {
                                                    // API ส่ง sent_mem_id หรือ sent_member.ID มา
                                                    const senderMemberId = req.sent_mem_id || req.sent_member?.ID || req.sent_member?.id;
                                                    return senderMemberId === post.authorId;
                                                }
                                            );

                                            if (hasPendingFromThem) {
                                                // เขาส่งคำขอมาหาเรา -> ไปหน้าคำขอเป็นเพื่อน พร้อม auto-select
                                                navigate("/User/Friends/Request", { state: { selectedId: post.authorId } });
                                            } else {
                                                // เราส่งคำขอไปหาเขา หรือยังไม่มีคำขอ -> ไปหน้าเพื่อนแนะนำ
                                                navigate("/User/Friends/Popular", { state: { selectedId: post.authorId } });
                                            }
                                        } catch (error) {
                                            console.error("Failed to check friend status:", error);
                                            // Fallback: ไปหน้าเพื่อนแนะนำ พร้อม auto-select
                                            navigate("/User/Friends/Popular", { state: { selectedId: post.authorId } });
                                        }
                                    }}
                                >
                                    <Avatar
                                        size="small"
                                        src={post.ownerAvatar}
                                        icon={<UserOutlined />}
                                        style={{ marginRight: 8 }}
                                    />
                                    <div>
                                        <Text style={{
                                            display: "block",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: "#334155",
                                            ...(post.authorId && !post.isOwner ? {
                                                cursor: "pointer",
                                            } : {})
                                        }}
                                            className={post.authorId && !post.isOwner ? "hover:text-orange-500 hover:underline" : ""}
                                        >
                                            {post.ownerName}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {post.createdAt}
                                        </Text>
                                    </div>
                                </Space>

                                {/* ปุ่ม report - ซ่อนถ้าเป็นโพสต์ตัวเอง */}
                                {!post.isOwner && (
                                    <Tooltip title="รายงานโพสต์นี้">
                                        <Button
                                            type="text"
                                            icon={<WarningOutlined />}
                                            onClick={handleReportPost}
                                        />
                                    </Tooltip>
                                )}
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* การ์ดเขียนความคิดเห็น */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 18,
                        boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
                        marginBottom: 16,
                    }}
                    bodyStyle={{ padding: 16 }}
                >
                    <Row gutter={12}>
                        <Col flex="40px">
                            <Avatar
                                src={currentUser?.member_picture || undefined}
                                icon={<UserOutlined />}
                            />
                        </Col>
                        <Col flex="auto">
                            {replyTo && (
                                <div
                                    style={{
                                        fontSize: 12,
                                        marginBottom: 6,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span>
                                        กำลังตอบกลับ{" "}
                                        <strong>
                                            {replyTo.isAnonymous
                                                ? "ไม่เปิดเผยชื่อ"
                                                : replyTo.ownerName}
                                        </strong>
                                    </span>
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={() => setReplyTo(null)}
                                    >
                                        ยกเลิกการตอบกลับ
                                    </Button>
                                </div>
                            )}

                            <div
                                style={{
                                    marginBottom: 8,
                                    borderRadius: 10,
                                    border: "1px solid #d1d5db",
                                    padding: 4,
                                }}
                            >
                                <TextArea
                                    placeholder="เขียนความคิดเห็นของคุณ… (สามารถใส่อีโมจิได้เช่น 🙂🎉)"
                                    autoSize={{ minRows: 3, maxRows: 5 }}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    bordered={false}
                                />
                            </div>

                            {/* Upload buttons row */}
                            <Row style={{ marginBottom: 8 }} gutter={8}>
                                <Col>
                                    <Upload
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        maxCount={5}
                                        fileList={commentImages}
                                        onChange={({ fileList }) => setCommentImages(fileList)}
                                        beforeUpload={() => false}
                                        showUploadList={false}
                                    >
                                        <Button
                                            type="text"
                                            icon={<PictureOutlined />}
                                            size="small"
                                            style={{ color: "#666" }}
                                        >
                                            รูปภาพ
                                        </Button>
                                    </Upload>
                                </Col>
                                <Col>
                                    <Upload
                                        accept=".pdf,.docx,.xlsx,.zip"
                                        multiple
                                        maxCount={2}
                                        fileList={commentAttachments}
                                        onChange={({ fileList }) => setCommentAttachments(fileList)}
                                        beforeUpload={() => false}
                                        showUploadList={false}
                                    >
                                        <Button
                                            type="text"
                                            icon={<PaperClipOutlined />}
                                            size="small"
                                            style={{ color: "#666" }}
                                        >
                                            ไฟล์แนบ
                                        </Button>
                                    </Upload>
                                </Col>
                            </Row>

                            {/* Preview selected files */}
                            {(commentImages.length > 0 || commentAttachments.length > 0) && (
                                <div style={{
                                    marginBottom: 8,
                                    padding: 8,
                                    background: "#f5f5f5",
                                    borderRadius: 8,
                                }}>
                                    {commentImages.length > 0 && (
                                        <div style={{ marginBottom: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                รูปภาพ ({commentImages.length}):
                                            </Text>
                                            <Space wrap style={{ marginTop: 4 }}>
                                                {commentImages.map((file, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            background: "#fff",
                                                            padding: "2px 8px",
                                                            borderRadius: 4,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        <PictureOutlined style={{ marginRight: 4, color: ORANGE }} />
                                                        {file.name.length > 15 ? file.name.slice(0, 12) + "..." : file.name}
                                                        <CloseCircleOutlined
                                                            onClick={() => setCommentImages(prev => prev.filter((_, i) => i !== idx))}
                                                            style={{ marginLeft: 4, cursor: "pointer", color: "#999" }}
                                                        />
                                                    </span>
                                                ))}
                                            </Space>
                                        </div>
                                    )}
                                    {commentAttachments.length > 0 && (
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                ไฟล์แนบ ({commentAttachments.length}):
                                            </Text>
                                            <Space wrap style={{ marginTop: 4 }}>
                                                {commentAttachments.map((file, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            background: "#fff",
                                                            padding: "2px 8px",
                                                            borderRadius: 4,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        <FileOutlined style={{ marginRight: 4, color: "#2980b9" }} />
                                                        {file.name.length > 15 ? file.name.slice(0, 12) + "..." : file.name}
                                                        <CloseCircleOutlined
                                                            onClick={() => setCommentAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                            style={{ marginLeft: 4, cursor: "pointer", color: "#999" }}
                                                        />
                                                    </span>
                                                ))}
                                            </Space>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Row justify="space-between" align="middle">
                                <Col>
                                    <Space>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            แสดงความเห็นแบบไม่เปิดเผยชื่อ
                                        </Text>
                                        <Switch
                                            checked={commentAnonymous}
                                            onChange={setCommentAnonymous}
                                            checkedChildren="เปิด"
                                            unCheckedChildren="ปิด"
                                            style={{
                                                backgroundColor: commentAnonymous ? ORANGE : undefined,
                                            }}
                                        />
                                    </Space>
                                </Col>
                                <Col>
                                    <Button
                                        type="primary"
                                        onClick={handleSubmitComment}
                                        style={{
                                            borderRadius: 999,
                                            background: ORANGE,
                                            borderColor: ORANGE,
                                            fontWeight: 600,
                                            paddingInline: 24,
                                        }}
                                    >
                                        ส่งข้อความ
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card>

                {/* ส่วนแสดงความคิดเห็นทั้งหมด */}
                <div>
                    <Space align="center" style={{ marginBottom: 8 }}>
                        <Text strong>{post.commentCount} ความคิดเห็น</Text>
                    </Space>

                    {comments.map((c) => {
                        const replyCount = c.replies?.length ?? 0;
                        const isExpanded = expandedReplies[c.id] ?? false;

                        return (
                            <Card
                                key={c.id}
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                    boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
                                    marginBottom: 12,
                                }}
                                bodyStyle={{ padding: 16 }}
                            >
                                {/* Header: ชื่อคนคอมเมนต์ */}
                                <Row style={{ marginBottom: 8, paddingLeft: 4 }}>
                                    <Col>
                                        <Space align="center" size={8}>
                                            <Avatar
                                                size="small"
                                                src={c.ownerAvatar}
                                                icon={<UserOutlined />}
                                            />
                                            <div style={{ lineHeight: 1.2 }}>
                                                <Text style={{ fontSize: 13, fontWeight: 600, display: "block" }}>
                                                    {c.ownerName}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 10 }}>
                                                    {c.createdAt}
                                                </Text>
                                            </div>
                                        </Space>
                                    </Col>
                                </Row>

                                {/* คอมเมนต์หลัก */}
                                <div
                                    style={{
                                        borderRadius: 10,
                                        background: "#f9fafb",
                                        padding: "12px 12px",
                                        marginBottom: 10,
                                        minHeight: 70,
                                    }}
                                >
                                    <Paragraph
                                        style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}
                                    >
                                        {c.content}
                                    </Paragraph>

                                    {/* Comment Images */}
                                    {c.images && c.images.length > 0 && (
                                        <div style={{ marginTop: 12 }}>
                                            <Image.PreviewGroup>
                                                <Space wrap>
                                                    {c.images.sort((a, b) => a.orderIndex - b.orderIndex).map((img) => (
                                                        <Image
                                                            key={img.id}
                                                            src={`${img.url}`}
                                                            alt="comment image"
                                                            style={{
                                                                width: 80,
                                                                height: 80,
                                                                objectFit: "cover",
                                                                borderRadius: 6,
                                                                cursor: "pointer",
                                                            }}
                                                        />
                                                    ))}
                                                </Space>
                                            </Image.PreviewGroup>
                                        </div>
                                    )}

                                    {/* Comment Attachments */}
                                    {c.attachments && c.attachments.length > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <Space wrap>
                                                {c.attachments.sort((a, b) => a.orderIndex - b.orderIndex).map((file) => {
                                                    const ext = file.fileName.split(".").pop()?.toLowerCase() || "";
                                                    let icon = <FileOutlined />;
                                                    let iconColor = "#666";
                                                    if (ext === "pdf") { icon = <FilePdfOutlined />; iconColor = "#e74c3c"; }
                                                    else if (ext === "docx" || ext === "doc") { icon = <FileWordOutlined />; iconColor = "#2980b9"; }
                                                    else if (ext === "xlsx" || ext === "xls") { icon = <FileExcelOutlined />; iconColor = "#27ae60"; }
                                                    else if (ext === "zip" || ext === "rar") { icon = <FileZipOutlined />; iconColor = "#f39c12"; }

                                                    return (
                                                        <a
                                                            key={file.id}
                                                            href={`${file.fileUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            download={file.fileName}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                background: "#fff",
                                                                padding: "4px 10px",
                                                                borderRadius: 6,
                                                                border: "1px solid #e8e8e8",
                                                                textDecoration: "none",
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            <span style={{ color: iconColor, marginRight: 6 }}>{icon}</span>
                                                            <span style={{ color: "#333" }}>
                                                                {file.fileName.length > 20 ? file.fileName.slice(0, 17) + "..." : file.fileName}
                                                            </span>
                                                            <DownloadOutlined style={{ marginLeft: 6, color: ORANGE, fontSize: 12 }} />
                                                        </a>
                                                    );
                                                })}
                                            </Space>
                                        </div>
                                    )}
                                </div>

                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Space size="large">
                                            <Space
                                                style={{ cursor: "pointer" }}
                                                onClick={() => handleToggleLikeComment(c.id)}
                                            >
                                                {commentLikedMap[c.id] ? (
                                                    <LikeFilled style={{ color: ORANGE }} />
                                                ) : (
                                                    <LikeOutlined style={{ color: "#666" }} />
                                                )}
                                                <Text strong style={{ color: ORANGE }}>
                                                    {c.likeCount}
                                                </Text>
                                            </Space>

                                            {/* ปุ่มดู/ซ่อนตอบกลับ */}
                                            {replyCount > 0 && (
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    onClick={() => toggleRepliesVisible(c.id)}
                                                    style={{ paddingInline: 0 }}
                                                >
                                                    {isExpanded
                                                        ? `ซ่อนตอบกลับ(${replyCount})`
                                                        : `ดูตอบกลับ(${replyCount})`}
                                                </Button>
                                            )}
                                        </Space>
                                    </Col>
                                    <Col>
                                        <Space align="center">
                                            {/* ปุ่มตอบกลับ + ลบ (ถ้าเป็นของเรา) */}
                                            <Button
                                                type="link"
                                                size="small"
                                                style={{ paddingInline: 4 }}
                                                onClick={() => handleReplyComment(c)}
                                            >
                                                ตอบกลับ
                                            </Button>

                                            {c.isOwner && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDeleteComment(c.id, null)}
                                                />
                                            )}
                                        </Space>
                                    </Col>
                                </Row>

                                {/* แสดง reply ใต้คอมเมนต์ (ถ้าเปิดดู) */}
                                {isExpanded &&
                                    replyCount > 0 &&
                                    c.replies!.map((r) => (
                                        <div
                                            key={r.id}
                                            style={{
                                                marginTop: 10,
                                                paddingLeft: 32,
                                                borderLeft: "2px solid #e5e7eb",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    borderRadius: 10,
                                                    background: "#f9fafb",
                                                    padding: "10px 10px",
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <Paragraph
                                                    style={{
                                                        marginBottom: 0,
                                                        whiteSpace: "pre-wrap",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {r.content}
                                                </Paragraph>
                                            </div>

                                            <Row justify="space-between" align="middle">
                                                <Col>
                                                    <Space>
                                                        <LikeOutlined style={{ fontSize: 12 }} />
                                                        <Text
                                                            strong
                                                            style={{ color: ORANGE, fontSize: 12 }}
                                                        >
                                                            {r.likeCount}
                                                        </Text>
                                                    </Space>
                                                </Col>
                                                <Col>
                                                    <Space size="small">
                                                        <Avatar
                                                            size="small"
                                                            src={r.ownerAvatar}
                                                            icon={<UserOutlined />}
                                                            style={{ marginRight: 4 }}
                                                        />
                                                        <div>
                                                            <Text style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
                                                                {r.ownerName}
                                                            </Text>
                                                            <Text
                                                                type="secondary"
                                                                style={{ fontSize: 10 }}
                                                            >
                                                                {r.createdAt}
                                                            </Text>
                                                        </div>

                                                        {r.isOwner && (
                                                            <Button
                                                                type="text"
                                                                danger
                                                                size="small"
                                                                icon={<DeleteOutlined />}
                                                                onClick={() =>
                                                                    handleDeleteComment(r.id, c.id)
                                                                }
                                                            />
                                                        )}
                                                    </Space>
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                            </Card>
                        );
                    })}

                    {comments.length === 0 && (
                        <Text type="secondary">
                            ยังไม่มีความคิดเห็น ใส่คอมเมนต์แรกได้เลย 🙌
                        </Text>
                    )}
                </div>
            </div>

            {/* Report Post Modal */}
            <ReportPostModal
                open={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reasons={REPORT_REASONS}
                selectedReason={selectedReportReason}
                setSelectedReason={setSelectedReportReason}
                otherReason={otherReportReason}
                setOtherReason={setOtherReportReason}
                onSubmit={handleSubmitReport}
            />
        </main >
    );
};

export default PostDetail;
