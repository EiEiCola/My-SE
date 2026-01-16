import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Poll/MyPolls.css";
import "./ReviewListPage.css";

import { fetchMyReviews, deleteReview } from "../../../../services/http/reviewApi";

interface ReviewItem {
    id: number;
    memberId?: number;
    username: string;
    title: string;
    content: string;
    date: string;
    rawDate: string;
    category?: string;
    mainCat?: string;
    sub1?: string;
    sub2?: string;
    rating: number;
    images: string[];
    helpfulCount: number;
    notHelpfulCount: number;
    myVoteType?: "helpful" | "not_helpful" | null;
    isAnonymous?: boolean;
    avatarUrl?: string;
    reports?: any[];
    reportCount?: number;
    deletedAt?: string | null;
    deletedByType?: "OWNER" | "ADMIN" | "" | null;
    adminDeleteReason?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const toFullUrl = (url?: string) => {
    if (!url) return "";
    const u = String(url).trim();
    if (!u) return "";
    if (u.startsWith("http") || u.startsWith("data:") || u.startsWith("blob:")) return u;
    if (u.startsWith("/")) return `${API_BASE}${u}`;
    return `${API_BASE}/${u}`;
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const MyReviews: React.FC = () => {
    const navigate = useNavigate();

    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedReviewIdForDelete, setSelectedReviewIdForDelete] = useState<number | null>(null);

    // Filters
    const [activeTab, setActiveTab] = useState<"all" | "published" | "deleted">("all");
    const [sortOrder, setSortOrder] = useState<"latest" | "popular">("latest");
    const [searchTerm, setSearchTerm] = useState("");

    // Detail Modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await fetchMyReviews();

                const items = (data || []).map((r: any) => {
                    const rawImgs = r.ReviewImages ?? r.review_images ?? r.images ?? [];
                    let images: string[] = [];
                    if (Array.isArray(rawImgs)) {
                        images = rawImgs
                            .map((img: any) => {
                                if (typeof img === "string") return toFullUrl(img);
                                // ✅ Check multiple field name variations
                                const urlValue = img.url ?? img.URL ?? img.Url ?? img.image_url ?? img.ImageURL ?? "";
                                return toFullUrl(urlValue);
                            })
                            .filter(Boolean);
                    }

                    const createdAt = r.created_at ?? r.CreatedAt ?? new Date().toISOString();
                    const deletedAt = r.deleted_at ?? r.DeletedAt ?? null;
                    // ✅ Fix: Support both "Reports" (capital) and "reports" (lowercase) from backend
                    const reports = r.reports ?? r.Reports ?? [];
                    const deletedByTypeRaw = r.deleted_by_type ?? r.DeletedByType ?? "";
                    const deletedByType = String(deletedByTypeRaw || "").toUpperCase();

                    return {
                        id: r.ID ?? r.id,
                        username: r.Member?.username || "Me",
                        title: r.title || r.Title || "",
                        content: r.content || r.Content || "",
                        rating: r.rating ?? r.Rating ?? 0,
                        date: formatDate(createdAt),
                        rawDate: createdAt,
                        mainCat: r.MainCategory?.title,
                        sub1: r.SubCategoryL1?.title,
                        sub2: r.SubCategoryL2?.title,
                        helpfulCount: r.helpful_count ?? r.HelpfulCount ?? 0,
                        notHelpfulCount: r.not_helpful_count ?? r.NotHelpfulCount ?? 0,
                        images,
                        reports,
                        reportCount: reports?.length || 0,
                        deletedAt: deletedAt && deletedAt !== "0001-01-01T00:00:00Z" ? deletedAt : null,
                        deletedByType: deletedByType === "ADMIN" || deletedByType === "OWNER" ? (deletedByType as any) : "",
                        adminDeleteReason: r.admin_delete_reason ?? r.AdminDeleteReason,
                    } as ReviewItem;
                })
                    .filter((r) => r.deletedByType !== "OWNER"); // ✅ Hide owner-deleted reviews

                items.sort((a: ReviewItem, b: ReviewItem) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
                setReviews(items);
            } catch (e: any) {
                setError(e.message || "Failed to load");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleDeleteConfirm = async () => {
        if (selectedReviewIdForDelete == null) return;
        try {
            await deleteReview(selectedReviewIdForDelete);
            window.location.reload();
        } catch (e: any) {
            alert(e.message);
        }
    };

    // Filter Logic
    const filteredReviews = reviews
        .filter((r) => {
            if (activeTab === "published" && r.deletedAt) return false;
            if (activeTab === "deleted" && !r.deletedAt) return false;

            const term = searchTerm.toLowerCase();
            const matches = r.title.toLowerCase().includes(term) || r.content.toLowerCase().includes(term) || r.id.toString().includes(term);

            return matches;
        })
        .sort((a, b) => {
            if (sortOrder === "latest") {
                return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
            } else {
                return b.helpfulCount - a.helpfulCount;
            }
        });

    return (
        <div className="my-polls-page">
            {/* Back Button */}
            <div style={{ marginBottom: 16 }}>
                <button className="my-back-btn" onClick={() => navigate("/User/Review")}>
                    ← กลับ
                </button>
            </div>

            {/* HEADER & DASHBOARD */}
            <div className="my-hero">
                <div>
                    <div className="my-title">My Reviews</div>
                    <div className="my-sub">จัดการรีวิวทั้งหมดของคุณ</div>
                </div>
                <div className="my-toolbar">
                    <button className="btn btn-primary" onClick={() => navigate("/User/Review/createreview")}>
                        + เขียนรีวิว
                    </button>
                </div>
            </div>

            {/* STATS */}
            {!loading && (
                <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    <div className="stat">
                        <div className="k">Total</div>
                        <div className="v">{reviews.length}</div>
                    </div>
                    <div className="stat">
                        <div className="k" style={{ color: "#16a34a" }}>
                            Published
                        </div>
                        <div className="v">{reviews.filter((r) => !r.deletedAt).length}</div>
                    </div>
                    <div className="stat">
                        <div className="k" style={{ color: "#dc2626" }}>
                            Reported
                        </div>
                        <div className="v">{reviews.reduce((a, b) => a + (b.reports?.length || 0), 0)}</div>
                    </div>
                    <div className="stat">
                        <div className="k">Admin Deleted</div>
                        <div className="v">{reviews.filter((r) => !!r.deletedAt).length}</div>
                    </div>
                </div>
            )}

            {/* FILTERS */}
            <div
                className="my-tabs"
                style={{ marginTop: 24, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
                <div style={{ display: "flex", gap: 8 }}>
                    <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
                        All
                    </button>
                    <button className={`tab ${activeTab === "published" ? "active" : ""}`} onClick={() => setActiveTab("published")}>
                        Published
                    </button>
                    <button className={`tab ${activeTab === "deleted" ? "active" : ""}`} onClick={() => setActiveTab("deleted")}>
                        Deleted
                    </button>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "latest" | "popular")}
                        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer" }}
                    >
                        <option value="latest">Latest</option>
                        <option value="popular">Popular (Most Helpful)</option>
                    </select>
                    <div className="search-box" style={{ width: 250 }}>
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="table-card">
                <div className="table-head">
                    <div className="table-title">Review List</div>
                    {loading && <div className="loading">Loading...</div>}
                </div>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 80 }}>ID</th>
                                <th>Title</th>
                                <th style={{ width: 140 }}>Status</th>
                                <th style={{ width: 100 }}>Helpful</th>
                                <th style={{ width: 100 }}>Not Helpful</th>
                                <th style={{ width: 100 }}>Reports</th>
                                <th style={{ width: 180 }}>Created</th>
                                <th style={{ width: 120, textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading &&
                                filteredReviews.map((r) => (
                                    <tr key={r.id} style={{ opacity: r.deletedAt ? 0.6 : 1 }}>
                                        <td className="mono">{r.id}</td>
                                        <td>
                                            <div
                                                style={{ fontWeight: 600, cursor: "pointer" }}
                                                onClick={() => {
                                                    setSelectedReview(r);
                                                    setDetailOpen(true);
                                                }}
                                            >
                                                {r.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#64748b",
                                                    maxWidth: "300px",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {r.content}
                                            </div>
                                        </td>
                                        <td>
                                            {r.deletedAt ? (
                                                <div>
                                                    <span className="badge badge-rejected">Deleted</span>
                                                    {r.deletedByType === "ADMIN" && (
                                                        <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>🚫 by Admin</div>
                                                    )}
                                                    {r.deletedByType === "OWNER" && (
                                                        <div style={{ fontSize: 11, color: "#d97706", marginTop: 2 }}>🗑️ by You</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="badge badge-approved">Published</span>
                                            )}
                                        </td>
                                        <td>{r.helpfulCount} 👍</td>
                                        <td>{r.notHelpfulCount} 👎</td>
                                        <td>
                                            {r.reports && r.reports.length > 0 ? (
                                                <span style={{ color: "red", fontWeight: 600 }}>{r.reports.length} ⚠️</span>
                                            ) : (
                                                <span style={{ color: "#cbd5e1" }}>-</span>
                                            )}
                                        </td>
                                        <td className="muted">{r.date}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <div className="actions">

                                                {!r.deletedAt && (
                                                    <button
                                                        className="btn btn-ghost-danger"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // prevent row click
                                                            setSelectedReviewIdForDelete(r.id);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        🗑
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && filteredReviews.length === 0 && (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="empty">
                                            <div className="empty-box">📝</div>
                                            <div className="empty-title">No reviews found</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL */}
            {detailOpen && selectedReview && (
                <div className="card-backdrop" onClick={() => setDetailOpen(false)}>
                    <div className="card-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="card-head">
                            <div>
                                <div className="card-title">{selectedReview.title}</div>
                                <div className="card-sub">
                                    {selectedReview.date} •{" "}
                                    {[selectedReview.mainCat, selectedReview.sub1, selectedReview.sub2].filter(Boolean).join(" > ") || "ทั่วไป"}
                                </div>
                            </div>
                            <button className="icon-btn" onClick={() => setDetailOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="card-body">
                            {/* Status Info */}
                            {selectedReview.deletedAt && (
                                <div
                                    style={{
                                        background: selectedReview.deletedByType === "ADMIN" ? "#fef2f2" : "#fffbeb",
                                        border: selectedReview.deletedByType === "ADMIN" ? "2px solid #dc2626" : "2px solid #d97706",
                                        color: selectedReview.deletedByType === "ADMIN" ? "#b91c1c" : "#92400e",
                                        padding: 16,
                                        borderRadius: 12,
                                        marginBottom: 20,
                                    }}
                                >
                                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                                        {selectedReview.deletedByType === "ADMIN" && "🚫 รีวิวนี้ถูกลบโดยแอดมิน"}
                                        {selectedReview.deletedByType === "OWNER" && "🗑️ รีวิวนี้ถูกลบโดยคุณ"}
                                        {!selectedReview.deletedByType && "❌ รีวิวนี้ถูกลบแล้ว"}
                                    </div>
                                    <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                                        <div>
                                            <strong>ลบเมื่อ:</strong> {formatDate(selectedReview.deletedAt)}
                                        </div>
                                        {selectedReview.deletedByType === "ADMIN" && selectedReview.adminDeleteReason && (
                                            <div style={{ marginTop: 8, padding: 12, background: "rgba(220, 38, 38, 0.1)", borderRadius: 8 }}>
                                                <strong>📌 เหตุผลจากแอดมิน:</strong>
                                                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>
                                                    "{selectedReview.adminDeleteReason}"
                                                </div>
                                            </div>
                                        )}
                                        {selectedReview.deletedByType === "OWNER" && (
                                            <div style={{ marginTop: 8, fontStyle: "italic", opacity: 0.9 }}>
                                                คุณเป็นผู้ลบรีวิวนี้เอง
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Report Info */}
                            {selectedReview.reports && selectedReview.reports.length > 0 && (
                                <div
                                    style={{
                                        background: "#fff7ed",
                                        border: "1px solid #ffedd5",
                                        padding: 16,
                                        borderRadius: 8,
                                        marginBottom: 16,
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: "#9a3412", marginBottom: 12 }}>
                                        ⚠️ รีวิวนี้ถูกรายงาน ({selectedReview.reports.length} ครั้ง)
                                    </div>
                                    {selectedReview.reports.map((report: any, idx: number) => (
                                        <div
                                            key={idx}
                                            style={{
                                                background: "white",
                                                padding: 12,
                                                borderRadius: 6,
                                                marginTop: 8,
                                                fontSize: 13,
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, color: "#dc2626" }}>{report.title || "รายงาน"}</div>
                                            {report.description && (
                                                <div style={{ color: "#64748b", marginTop: 4 }}>{report.description}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#334155" }}>
                                {selectedReview.content}
                            </div>

                            {selectedReview.images.length > 0 && (
                                <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto" }}>
                                    {selectedReview.images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img}
                                            alt=""
                                            onClick={() => setLightboxImg(img)}
                                            style={{ height: 150, borderRadius: 8, border: "1px solid #e2e8f0", cursor: "zoom-in" }}
                                        />
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: 24, borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", gap: 16 }}>
                                <div>
                                    <div className="detail-label">Rating</div>
                                    <div className="detail-value">⭐ {selectedReview.rating}/5</div>
                                </div>
                                <div>
                                    <div className="detail-label">Helpful</div>
                                    <div className="detail-value" style={{ color: "#16a34a" }}>
                                        {selectedReview.helpfulCount} 👍
                                    </div>
                                </div>
                                <div>
                                    <div className="detail-label">Not Helpful</div>
                                    <div className="detail-value" style={{ color: "#dc2626" }}>
                                        {selectedReview.notHelpfulCount} 👎
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX */}
            {lightboxImg && (
                <div className="img-overlay" onClick={() => setLightboxImg(null)}>
                    <div className="img-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="img-close" onClick={() => setLightboxImg(null)}>
                            ✕
                        </button>
                        <img src={lightboxImg} className="img-full" alt="Full size" />
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="rl-modalOverlay" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="rl-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="rl-modalIcon">🗑️</div>
                        <h3 className="rl-modalTitle">ลบรีวิวนี้ใช่ไหม?</h3>
                        <p className="rl-modalDesc">รีวิวนี้จะถูกลบออกจากรีวิวของคุณ</p>
                        <div className="rl-modalActions">
                            <button className="rl-btn rl-btnDanger" onClick={handleDeleteConfirm}>
                                ลบรีวิว
                            </button>
                            <button className="rl-btn rl-btnGhost" onClick={() => setIsDeleteModalOpen(false)}>
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyReviews;
