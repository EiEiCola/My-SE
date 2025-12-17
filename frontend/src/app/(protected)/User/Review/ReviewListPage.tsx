import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReviewCard from "./components/ReviewCard";
import ReportReviewModal from "./ReportReviewModal";
import "./ReviewListPage.css";
import { fetchReviews, deleteReview, voteReview } from "../../../../services/http/reviewApi";

// --- Interfaces สำหรับหมวดหมู่ 3 ชั้น ---
interface SubL2 {
  id: number;
  title: string;
}
interface SubL1 {
  id: number;
  title: string;
  subCategoryL2?: SubL2[];
}
interface MainCategory {
  id: number;
  title: string;
  subCategoryL1?: SubL1[];
}

interface ReviewItem {
  id: number;
  memberId?: number;
  username: string;
  title: string;
  content: string;
  date: string;
  category: string;
  rating: number;
  images: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  myVoteType?: "helpful" | "not_helpful" | null;
  // เพิ่ม ID เพื่อใช้ในการ Filter แม่นยำขึ้น
  mainCatId?: number;
  subL1Id?: number;
  subL2Id?: number;
}

const MY_MEMBER_ID = 1;
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

const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [categories, setCategories] = useState<MainCategory[]>([]); // สำหรับ Dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  // เก็บเป็น string "type-id" เช่น "main-1", "l1-2", "l2-5"
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [filterBy, setFilterBy] = useState<"all" | "my">("all");

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReviewIdForReport, setSelectedReviewIdForReport] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReviewIdForDelete, setSelectedReviewIdForDelete] = useState<number | null>(null);

  // 1. โหลดข้อมูลรีวิวและหมวดหมู่ (ดึงจาก Seed ที่ทำไว้)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const apiData = await fetchReviews();
        
        // Mock ข้อมูล Category ให้ตรงกับ Seed (ในงานจริงควร fetch จาก API /categories)
        // เพื่อให้คุณเห็นผลทันที ผมจะจำลองโครงสร้างที่ตรงกับ Seed Go ของคุณครับ
        const mockCategories: MainCategory[] = [
          {
            id: 1,
            title: "หอพัก",
            subCategoryL1: [
              {
                id: 1, title: "หอใน",
                subCategoryL2: [{ id: 1, title: "โซน A" }]
              },
              { id: 2, title: "หอนอก" }
            ]
          }
        ];
        setCategories(mockCategories);

        const mapped: ReviewItem[] = (apiData || []).map((r: any) => {
          const memberId = r.member_id ?? r.MemberID;
          const rawImgs = r.ReviewImages ?? r.review_images ?? r.images ?? [];
          const imgArr = Array.isArray(rawImgs) ? rawImgs : [];

          const images = imgArr
            .slice()
            .sort((a: any, b: any) => (a.sort_order ?? a.SortOrder ?? 0) - (b.sort_order ?? b.SortOrder ?? 0))
            .map((img: any) => toFullUrl(img.url ?? img.URL))
            .filter((u: string) => !!u);

          return {
            id: r.ID ?? r.id,
            memberId,
            username: r.Member?.username || r.username || "anonymous",
            title: r.title || "",
            content: r.content || "",
            rating: r.rating ?? 0,
            date: formatDate(r.created_at || r.CreatedAt || new Date().toISOString()),
            // เก็บชื่อหมวดหมู่ที่ละเอียดที่สุดเพื่อแสดงผล
            category: r.SubCategoryL2?.title || r.SubCategoryL1?.title || r.MainCategory?.title || "ทั่วไป",
            helpfulCount: r.helpful_count ?? 0,
            notHelpfulCount: r.not_helpful_count ?? 0,
            images,
            mainCatId: r.main_category_id,
            subL1Id: r.sub_category_l1_id,
            subL2Id: r.sub_category_l2_id,
          };
        });

        setReviews(mapped);
      } catch (e: any) {
        setError(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // 2. Logic การ Filter รีวิว (รองรับ 3 ชั้น)
  const filteredAndSortedReviews = useMemo(() => {
    let list = reviews.filter((r) => {
      const matchesSearch = (r.title + " " + r.content + " " + r.username)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesFilter = filterBy === "all" || r.memberId === MY_MEMBER_ID;

      // Filter ตามลำดับชั้น
      let matchesCategory = true;
      if (selectedCategoryKey !== "all") {
        const [type, idStr] = selectedCategoryKey.split("-");
        const id = parseInt(idStr);
        if (type === "main") matchesCategory = r.mainCatId === id;
        if (type === "l1") matchesCategory = r.subL1Id === id;
        if (type === "l2") matchesCategory = r.subL2Id === id;
      }

      return matchesSearch && matchesFilter && matchesCategory;
    });

    if (sortBy === "latest") {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      list.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    return list;
  }, [reviews, searchTerm, selectedCategoryKey, sortBy, filterBy]);

  // Handlers (Report, Delete, Vote)
  const handleVote = async (reviewId: number, voteType: "helpful" | "not_helpful") => {
    try {
      const data = await voteReview(reviewId, voteType);
      setReviews(prev => prev.map(r => r.id === reviewId ? { 
        ...r, 
        helpfulCount: data.helpful_count, 
        notHelpfulCount: data.not_helpful_count,
        myVoteType: data.my_vote_type 
      } : r));
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteConfirm = async () => {
    if (selectedReviewIdForDelete == null) return;
    try {
      await deleteReview(selectedReviewIdForDelete);
      setReviews(prev => prev.filter(r => r.id !== selectedReviewIdForDelete));
      setIsDeleteModalOpen(false);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="rl-page">
      <div className="rl-wrap">
        <div className="rl-stickyHead">
          <div className="rl-headTop">
            <div>
              <div className="rl-eyebrow">COMMUNITY REVIEW</div>
              <div className="rl-title">รีวิวจากเพื่อนถึงเพื่อน <span className="rl-bubble">💬</span></div>
            </div>
            <div className="rl-live"><span className="rl-liveDot" />Live</div>
          </div>

          <div className="rl-search">
            <span className="rl-searchIcon">🔎</span>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ค้นหารีวิว..." />
          </div>

          <div className="rl-filters">
            {/* --- Dropdown 3 ชั้น --- */}
            <div className="rl-selectWrap">
              <select 
                value={selectedCategoryKey} 
                onChange={(e) => setSelectedCategoryKey(e.target.value)}
                className="rl-categorySelect"
              >
                <option value="all">📂 หมวดหมู่ทั้งหมด</option>
                {categories.map(main => (
                  <React.Fragment key={`main-${main.id}`}>
                    <option value={`main-${main.id}`} className="opt-main">
                      📦 {main.title}
                    </option>
                    {main.subCategoryL1?.map(l1 => (
                      <React.Fragment key={`l1-${l1.id}`}>
                        <option value={`l1-${l1.id}`} className="opt-l1">
                          &nbsp;&nbsp;&nbsp;🔹 {l1.title}
                        </option>
                        {l1.subCategoryL2?.map(l2 => (
                          <option key={`l2-${l2.id}`} value={`l2-${l2.id}`} className="opt-l2">
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▪️ {l2.title}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div className="rl-tabs">
              <button className={`rl-tab ${filterBy === "all" ? "is-active" : ""}`} onClick={() => setFilterBy("all")}>รีวิวทั้งหมด 🌐</button>
              <button className={`rl-tab ${filterBy === "my" ? "is-active" : ""}`} onClick={() => setFilterBy("my")}>รีวิวของฉัน 👤</button>
              <button className={`rl-tab ${sortBy === "latest" ? "is-active" : ""}`} onClick={() => setSortBy("latest")}>ล่าสุด ✨</button>
              <button className={`rl-tab ${sortBy === "popular" ? "is-active" : ""}`} onClick={() => setSortBy("popular")}>ยอดนิยม 🔥</button>
            </div>
          </div>
        </div>

        {loading && <div className="rl-status">กำลังโหลดรีวิว...</div>}
        {error && <div className="rl-status rl-error">{error}</div>}

        <div className="rl-list">
          {!loading && filteredAndSortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onReport={() => { setSelectedReviewIdForReport(review.id); setIsReportModalOpen(true); }}
              canDelete={review.memberId === MY_MEMBER_ID}
              onDelete={() => { setSelectedReviewIdForDelete(review.id); setIsDeleteModalOpen(true); }}
              onVote={(type) => handleVote(review.id, type)}
            />
          ))}
          {!loading && filteredAndSortedReviews.length === 0 && (
            <div className="rl-empty">ไม่พบรีวิวที่คุณค้นหา</div>
          )}
        </div>

        <button className="rl-fab" onClick={() => navigate("/User/Review/createreview")}>
          <span className="rl-fabPlus">+</span>เขียนรีวิว
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
        onSubmit={() => { alert("ส่งรายงานแล้ว"); setIsReportModalOpen(false); }}
      />

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="ลบรีวิวนี้ใช่ไหม?"
        description="รีวิวนี้จะถูกลบออกจากระบบถาวร"
      />
    </div>
  );
};

// --- Sub Components ---
const DeleteConfirmModal: React.FC<{open: boolean, title: string, description: string, onClose: () => void, onConfirm: () => void}> = ({ open, title, description, onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="rl-modalOverlay" onClick={onClose}>
      <div className="rl-modal" onClick={e => e.stopPropagation()}>
        <div className="rl-modalIcon">🗑️</div>
        <h3 className="rl-modalTitle">{title}</h3>
        <p className="rl-modalDesc">{description}</p>
        <div className="rl-modalActions">
          <button className="rl-btn rl-btnDanger" onClick={onConfirm}>ลบรีวิว</button>
          <button className="rl-btn rl-btnGhost" onClick={onClose}>ยกเลิก</button>
        </div>
      </div>
    </div>
  );
};

export default ReviewListPage;