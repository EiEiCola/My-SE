import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReviewCard from "./components/ReviewCard";
import ReportReviewModal from "./ReportReviewModal";
import "./ReviewListPage.css";

import { fetchReviews, fetchMyReviews, deleteReview, voteReview } from "../../../../services/http/reviewApi";
import { categoryAPI } from "../../../../services/http/poll";

interface ReviewItem {
  id: number;
  memberId?: number;
  username: string;
  title: string;
  content: string;
  date: string; // ISO หรือ string ที่ format แล้วก็ได้
  category: string;
  rating: number;
  images: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  myVoteType?: "helpful" | "not_helpful" | null;
  isAnonymous?: boolean;
  avatarUrl?: string;
  mainCatId?: number;
  subL1Id?: number;
  subL2Id?: number;
}


const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const toFullUrl = (url?: string) => {
  if (!url) return "";
  const u = String(url).trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:") || u.startsWith("blob:")) return u;
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

const REPORT_REASONS = [
  "เนื้อหาไม่เหมาะสม / ลามก",
  "สแปม / โฆษณา",
  "เนื้อหาแสดงความเกลียดชัง / พาดพิง",
  "ข้อมูลส่วนตัว / ละเมิดลิขสิทธิ์",
  "การข่มขู่ / คุกคาม",
  "เหตุผลอื่นๆ (ระบุเพิ่มเติม)",
];

type CatRow = { id: number; title: string };

const getMyMemberId = () => {
  try {
    // ✅ พยายามอ่านจาก userData ก่อน (ปกติมักมีข้อมูล member)
    const rawUser = localStorage.getItem("userData");
    if (rawUser) {
      const u = JSON.parse(rawUser);

      const cand =
        u.member_id ??
        u.MemberID ??
        u.memberId ??
        u.id ??       // บางโปรเจคเก็บ member id ไว้ที่ id ใน userData
        u.ID;

      const n = Number(cand);
      if (Number.isFinite(n)) return n;
    }

    // ✅ fallback: บางคนเก็บ memberId แยก
    const raw = localStorage.getItem("memberId") || localStorage.getItem("member_id");
    const n2 = raw ? Number(raw) : NaN;
    return Number.isFinite(n2) ? n2 : null;
  } catch {
    return null;
  }
};


const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const myId = getMyMemberId();
  //console.log("DEBUG myId =", myId); // ✅ ใส่ตรงนี้

  // const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [filterBy, setFilterBy] = useState<"all" | "my">("all");

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReviewIdForReport, setSelectedReviewIdForReport] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReviewIdForDelete, setSelectedReviewIdForDelete] = useState<number | null>(null);

  // ====== Category 3 dropdown ======
  const [mainCats, setMainCats] = useState<CatRow[]>([]);
  const [l1Cats, setL1Cats] = useState<CatRow[]>([]);
  const [l2Cats, setL2Cats] = useState<CatRow[]>([]);

  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
  const [selectedL1Id, setSelectedL1Id] = useState<number | null>(null);
  const [selectedL2Id, setSelectedL2Id] = useState<number | null>(null);

  const [allReviews, setAllReviews] = useState<ReviewItem[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewItem[]>([]);
  const myReviewIdSet = useMemo(() => new Set(myReviews.map((r) => r.id)), [myReviews]);
  const ANON_AVATAR = "/anon-avatar.png";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [allData, myData] = await Promise.all([
          fetchReviews(),
          fetchMyReviews(),
        ]);

        const mapToItems = (apiData: any[]) =>
          (apiData || []).map((r: any) => {
            const memberId =
              r.member_id ??
              r.MemberID ??
              r.memberId ??
              r.Member?.id ??
              r.Member?.ID;

            const rawImgs = r.ReviewImages ?? r.review_images ?? r.images ?? [];
            const imgArr = Array.isArray(rawImgs) ? rawImgs : [];
            const images = imgArr
              .slice()
              .sort((a: any, b: any) => (a.sort_order ?? a.SortOrder ?? 0) - (b.sort_order ?? b.SortOrder ?? 0))
              .map((img: any) => toFullUrl(img.url ?? img.URL))
              .filter((u: string) => !!u);

            const createdAt = r.created_at ?? r.CreatedAt ?? new Date().toISOString();
            const isAnonymous = r.is_anonymous ?? r.IsAnonymous ?? false;
            const realName = r.Member?.username || r.username || "ผู้ใช้";
            const username = isAnonymous ? "ไม่เปิดเผยชื่อ" : realName;
            // ✅ ดึงรูปโปรไฟล์จาก Member
            const rawPic =
              r.Member?.member_picture ??
              r.Member?.MemberPicture ??
              r.Member?.avatar_url ??
              r.Member?.AvatarURL ??
              r.member_picture ??
              r.MemberPicture ??
              r.avatar_url ??
              r.AvatarURL ??
              "";

            // ✅ ถ้า anonymous = ห้ามส่งรูปจริงออกมา
            const avatarUrl = isAnonymous ? ANON_AVATAR : toFullUrl(rawPic);

            return {
              id: r.ID ?? r.id,
              memberId,
              username,
              isAnonymous,
              avatarUrl,
              title: r.title || r.Title || "",
              content: r.content || r.Content || "",
              rating: r.rating ?? r.Rating ?? 0,
              date: formatDate(createdAt),
              category: r.SubCategoryL2?.title || r.SubCategoryL1?.title || r.MainCategory?.title || "ทั่วไป",
              helpfulCount: r.helpful_count ?? r.HelpfulCount ?? 0,
              notHelpfulCount: r.not_helpful_count ?? r.NotHelpfulCount ?? 0,
              images,
              mainCatId: r.main_category_id ?? r.MainCategoryID,
              subL1Id: r.sub_category_l1_id ?? r.SubCategoryL1ID,
              subL2Id: r.sub_category_l2_id ?? r.SubCategoryL2ID,
              myVoteType: r.my_vote_type ?? null,
            } as ReviewItem;
          });

        setAllReviews(mapToItems(allData));
        setMyReviews(mapToItems(myData));
      } catch (e: any) {
        setError(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);


  // 2) โหลดหมวดหมู่ 3 ชั้น (ไม่ทำเป็น tree — ใช้ 3 dropdown)
  useEffect(() => {
    (async () => {
      try {
        const rows = await categoryAPI.listMain();
        setMainCats(rows);
      } catch (e) {
        // ไม่ให้หน้าแตก ถ้าหมวดหมู่พัง
        setMainCats([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // reset
        setL1Cats([]);
        setL2Cats([]);
        setSelectedL1Id(null);
        setSelectedL2Id(null);

        if (!selectedMainId) return;

        const rows = await categoryAPI.listSub1(selectedMainId);
        setL1Cats(rows);
      } catch (e) {
        setL1Cats([]);
      }
    })();
  }, [selectedMainId]);

  useEffect(() => {
    (async () => {
      try {
        setL2Cats([]);
        setSelectedL2Id(null);

        if (!selectedL1Id) return;

        const rows = await categoryAPI.listSub2(selectedL1Id);
        setL2Cats(rows);
      } catch (e) {
        setL2Cats([]);
      }
    })();
  }, [selectedL1Id]);

  // 3) Filter + Sort
  const filteredAndSortedReviews = useMemo(() => {
    const baseList = filterBy === "my" ? myReviews : allReviews;

    let list = baseList.filter((r) => {
      const matchesSearch = (r.title + " " + r.content + " " + r.username)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // หมวดหมู่
      let matchesCategory = true;
      if (selectedL2Id) matchesCategory = r.subL2Id === selectedL2Id;
      else if (selectedL1Id) matchesCategory = r.subL1Id === selectedL1Id;
      else if (selectedMainId) matchesCategory = r.mainCatId === selectedMainId;

      return matchesSearch && matchesCategory;
    });
    if (sortBy === "latest") {
      // NOTE: r.date เป็น string ที่ format แล้ว (th-TH) อาจ parse ไม่แม่น
      // ถ้าอยากชัวร์ ให้เก็บ createdAt ISO อีก field แล้ว sort ด้วย ISO
      list.sort((a, b) => (a.id < b.id ? 1 : -1)); // fallback แบบง่าย
    } else {
      list.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    return list;
  }, [allReviews, myReviews, searchTerm, selectedMainId, selectedL1Id, selectedL2Id, sortBy, filterBy]);

  const handleVote = async (reviewId: number, voteType: "helpful" | "not_helpful") => {
    try {
      const data = await voteReview(reviewId, voteType);

      const patch = (arr: ReviewItem[]) =>
        arr.map((r) =>
          r.id === reviewId
            ? {
              ...r,
              helpfulCount: data.helpful_count,
              notHelpfulCount: data.not_helpful_count,
              myVoteType: data.my_vote_type,
            }
            : r
        );

      setAllReviews((prev) => patch(prev));
      setMyReviews((prev) => patch(prev));
    } catch (e: any) {
      alert(e.message);
    }
  };


  const handleDeleteConfirm = async () => {
    if (selectedReviewIdForDelete == null) return;
    try {
      await deleteReview(selectedReviewIdForDelete);

      setAllReviews((prev) => prev.filter((r) => r.id !== selectedReviewIdForDelete));
      setMyReviews((prev) => prev.filter((r) => r.id !== selectedReviewIdForDelete));

      setIsDeleteModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };
  //รีเซ็ต fillter
  const handleResetFilters = () => {
    setSearchTerm("");
    setSortBy("latest");
    setFilterBy("all");

    setSelectedMainId(null);
    setSelectedL1Id(null);
    setSelectedL2Id(null);
  };

  return (

    <div className="rl-page">
      <div className="rl-wrap">
        <div className="rl-stickyHead">
          <div className="rl-headTop" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
            <div>
              <div className="rl-eyebrow">COMMUNITY REVIEW</div>
              <div className="rl-title">
                รีวิวจากเพื่อนถึงเพื่อน <span className="rl-bubble">💬</span>
              </div>
            </div>
            <button
              className="rl-btn-primary"
              style={{
                padding: "10px 18px",
                borderRadius: "20px",
                border: "none",
                background: "linear-gradient(135deg, #ff7a18, #ff9a3c)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 14px 28px rgba(255, 122, 24, 0.25)",
                flexShrink: 0
              }}
              onClick={() => navigate("/User/Review/my")}
            >
              📝 รีวิวของฉัน
            </button>
          </div>


          <div className="rl-toolbar">
            <div className="rl-search">
              <span className="rl-searchIcon">🔎</span>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ค้นหารีวิว..." />
            </div>

            <div className="rl-filters">
              {/* 3 dropdown แบบหน้า CreateReview (ไม่บังคับครบ 3 ชั้น) */}
              <div className="rl-selectWrap" style={{ display: "flex", gap: 12 }}>
                {/* Main */}
                <select
                  className="rl-categorySelect"
                  value={selectedMainId ?? ""}
                  onChange={(e) => setSelectedMainId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">หมวดหมู่ทั้งหมด</option>
                  {mainCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>

                {/* Sub1 */}
                <select
                  className="rl-categorySelect"
                  value={selectedL1Id ?? ""}
                  onChange={(e) => setSelectedL1Id(e.target.value ? Number(e.target.value) : null)}
                  disabled={!selectedMainId}
                >
                  <option value="">{selectedMainId ? "ประเภท" : "เลือกหมวดหมู่หลักก่อน"}</option>
                  {l1Cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>

                {/* Sub2 */}
                <select
                  className="rl-categorySelect"
                  value={selectedL2Id ?? ""}
                  onChange={(e) => setSelectedL2Id(e.target.value ? Number(e.target.value) : null)}
                  disabled={!selectedL1Id}
                >
                  <option value="">{selectedL1Id ? "รายละเอียด" : "เลือกประเภทก่อน"}</option>
                  {l2Cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rl-tabs">
                <button className={`rl-tab ${filterBy === "all" ? "is-active" : ""}`} onClick={() => setFilterBy("all")}>
                  รีวิวทั้งหมด 🌐
                </button>
                <button className={`rl-tab ${filterBy === "my" ? "is-active" : ""}`} onClick={() => setFilterBy("my")}>
                  รีวิวของฉัน 👤
                </button>
                <button className={`rl-tab ${sortBy === "latest" ? "is-active" : ""}`} onClick={() => setSortBy("latest")}>
                  ล่าสุด ✨
                </button>
                <button className={`rl-tab ${sortBy === "popular" ? "is-active" : ""}`} onClick={() => setSortBy("popular")}>
                  ยอดนิยม 🔥
                </button>

                {/* ✅ NEW: Reset (สไตล์เดียวกับปุ่มอื่น) */}
                <button className="rl-tab" onClick={handleResetFilters} type="button">
                  รีเซ็ต ♻️
                </button>
              </div>
            </div>
          </div>

        </div>


        {loading && <div className="rl-status">กำลังโหลดรีวิว...</div>}
        {error && <div className="rl-status rl-error">{error}</div>}

        <div className="rl-list">
          {!loading &&
            filteredAndSortedReviews.map((review) => {
              const isMine = myReviewIdSet.has(review.id); // ✅ เช็คเจ้าของจาก myReviews

              return (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentMemberId={myId ?? undefined}
                  isMine={isMine}
                  canDelete={isMine}
                  canReport={!isMine}   // ✅ ของตัวเองไม่ให้แจ้งปัญหา

                  onDelete={() => {
                    if (!isMine) return;
                    setSelectedReviewIdForDelete(review.id);
                    setIsDeleteModalOpen(true);
                  }}

                  onReport={() => {
                    if (isMine) return;
                    setSelectedReviewIdForReport(review.id);
                    setIsReportModalOpen(true);
                  }}

                  onVote={(type) => handleVote(review.id, type)}
                />
              );
            })}

          {!loading && filteredAndSortedReviews.length === 0 && (
            <div className="rl-empty">ไม่พบรีวิวที่คุณค้นหา</div>
          )}
        </div>



        <button className="rl-fab" onClick={() => navigate("/User/Review/createreview")}>
          <span className="rl-fabPlus">＋</span>สร้างรีวิว
        </button>
      </div>

      <ReportReviewModal
        open={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reasons={REPORT_REASONS}
        selectedReason={selectedReportReason}
        setSelectedReason={setSelectedReportReason}
        otherReason={otherReason}
        setOtherReason={setOtherReason}
        onSubmit={async () => {
          if (!selectedReviewIdForReport) return;

          try {
            const title = selectedReportReason;
            const description = selectedReportReason === "เหตุผลอื่นๆ (ระบุเพิ่มเติม)" ? otherReason : selectedReportReason;

            const token = localStorage.getItem("token");
            const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

            const response = await fetch(`${API_BASE}/api/members/reports`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                target_type: "Review",
                target_id: selectedReviewIdForReport,
                title,
                description,
                medias: [],
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to submit report");
            }

            // Show success toast
            setShowSuccessToast(true);
            setIsReportModalOpen(false);

            // Auto-hide toast and reload after 2 seconds
            setTimeout(() => {
              setShowSuccessToast(false);
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error("Report error:", error);
            alert("เกิดข้อผิดพลาดในการส่งรายงาน");
          }
        }}
      />

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10000,
            background: "#ffffff", // พื้นหลังขาว
            color: "#1e293b", // สีตัวอักษรเข้ม
            padding: "32px 48px",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", // เงานุ่มๆ
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            textAlign: "center",
            animation: "fadeIn 0.2s ease-out",
            border: "1px solid #f1f5f9" // ขอบบางๆ
          }}
        >
          <div style={{
            width: "64px",
            height: "64px",
            background: "#10b981",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            boxShadow: "0 0 0 8px rgba(16, 185, 129, 0.15)"
          }}>
            ✅
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "4px", color: "#0f172a" }}>แจ้งปัญหาสำเร็จ!</div>
            <div style={{ fontSize: "15px", color: "#64748b", fontWeight: 600 }}>
              ขอบคุณที่แจ้งปัญหา เราจะตรวจสอบโดยเร็วที่สุด
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="ลบรีวิวนี้ใช่ไหม?"
        description="รีวิวนี้จะถูกลบออกจากรีวิวของคุณ"
      />
    </div>
  );
};

// --- Sub Components ---
const DeleteConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ open, title, description, onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="delete-modal-backdrop" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="delete-icon-svg"
          >
            <path
              fillRule="evenodd"
              d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V5.25h4.5a.75.75 0 0 1 0 1.5h-.69l-1.02 13.2A2.25 2.25 0 0 1 15.55 22.5H8.45a2.25 2.25 0 0 1-2.24-2.55L5.19 6.75H4.5a.75.75 0 0 1 0-1.5H9V3.75Zm1.5 1.5h3V3.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v1.5ZM7.7 6.75l.99 12.9a.75.75 0 0 0 .75.7h5.12a.75.75 0 0 0 .75-.7l.99-12.9H7.7Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="delete-modal-title">{title}</div>
        <div className="delete-modal-desc">{description}</div>
        <div className="delete-modal-actions">
          <button className="delete-modal-btn delete-modal-btn-danger" onClick={onConfirm}>
            ลบรีวิว
          </button>
          <button className="delete-modal-btn delete-modal-btn-cancel" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};


export default ReviewListPage;
