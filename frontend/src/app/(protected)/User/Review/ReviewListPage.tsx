import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReviewCard from "./components/ReviewCard";
import ReportReviewModal from "./ReportReviewModal";
import "./ReviewListPage.css";

//ดึง ลบ
import { fetchReviews } from "../../../../services/http/reviewApi";
import { deleteReview } from "../../../../services/http/reviewApi";

interface ReviewItem {
  id: number;
  memberId?: number; // ✅ ใช้เช็ค "รีวิวของฉัน" + สิทธิ์ลบ
  username: string;
  title: string;
  content: string;
  date: string;
  category: string;
  rating: number;
  images: string[];
  helpfulCount: number;
  notHelpfulCount: number;
}

// ตอนนี้ backend mock member_id = 1
const MY_MEMBER_ID = 1;

// ✅ ใช้ base เดียวกับฝั่ง api (กันเคส /uploads/... และ http...)
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

type DeleteConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  title,
  description,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div
      className="rl-modalOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rl-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rl-modalIcon">🗑️</div>

        <h3 className="rl-modalTitle">{title}</h3>
        <p className="rl-modalDesc">{description}</p>

        <div className="rl-modalActions">
          <button className="rl-btn rl-btnDanger" type="button" onClick={onConfirm}>
            ลบรีวิว
          </button>
          <button className="rl-btn rl-btnGhost" type="button" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();

  // ✅ เปลี่ยนจาก seed -> โหลดจาก API จริง
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [filterBy, setFilterBy] = useState<"all" | "my">("all");

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReviewIdForReport, setSelectedReviewIdForReport] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReviewIdForDelete, setSelectedReviewIdForDelete] = useState<number | null>(null);

  // ✅ โหลดรีวิวจาก DB จริง
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const apiData = await fetchReviews();

        const mapped: ReviewItem[] = (apiData || []).map((r: any) => {
          const memberId = r.member_id ?? r.MemberID;

          // ✅ กัน images เป็น null และทำให้ “ไม่ random”
          const rawImgs = r.ReviewImages ?? r.review_images ?? r.images ?? [];
          const imgArr = Array.isArray(rawImgs) ? rawImgs : [];


  const images = imgArr
    .slice()
    .sort(
      (a: any, b: any) =>
        (a.sort_order ?? a.SortOrder ?? 0) - (b.sort_order ?? b.SortOrder ?? 0)
    )
    .map((img: any) => toFullUrl(img.url ?? img.URL ?? img.image_url))
    .filter((u: string) => !!u);

  return {
    id: r.ID ?? r.id,
    memberId,
    username: r.Member?.username || r.username || (memberId ? `member#${memberId}` : "anonymous"),
    title: r.title || "",
    content: r.content || "",
    rating: r.rating ?? 0,
    date: formatDate(r.created_at || r.CreatedAt || r.updated_at || r.UpdatedAt || new Date().toISOString()),
    category: r.MainCategory?.name || r.category || (r.main_category_id ? `หมวด #${r.main_category_id}` : "ไม่ระบุหมวด"),
    helpfulCount: r.helpful_count ?? r.HelpfulCount ?? 0,
    notHelpfulCount: r.not_helpful_count ?? r.NotHelpfulCount ?? 0,
    images, // ✅ ใช้อันนี้
  };
});


        setReviews(mapped);
      } catch (e: any) {
        setError(e.message || "โหลดรีวิวไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleReport = (reviewId: number) => {
    setSelectedReviewIdForReport(reviewId);
    setSelectedReportReason("");
    setOtherReason("");
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = () => {
    let finalReason = selectedReportReason;

    if (selectedReportReason === "เหตุผลอื่นๆ (ระบุเพิ่มเติม)") {
      if (!otherReason.trim()) {
        alert("กรุณาระบุเหตุผลเพิ่มเติม");
        return;
      }
      finalReason = `เหตุผลอื่นๆ: ${otherReason.trim()}`;
    }

    if (finalReason) {
      alert(`กำลังรายงานรีวิว ID: ${selectedReviewIdForReport} ด้วยเหตุผล: "${finalReason}"`);
      setIsReportModalOpen(false);
      setSelectedReviewIdForReport(null);
      setSelectedReportReason("");
      setOtherReason("");
    } else {
      alert("กรุณาเลือกเหตุผลในการรายงาน");
    }
  };

  const handleDeleteClick = (reviewId: number) => {
    setSelectedReviewIdForDelete(reviewId);
    setIsDeleteModalOpen(true);
  };

  // ตอนนี้ยังเป็น “ลบออกจากหน้าจอ” ก่อน (ข้อ 3 เราจะต่อ DELETE API จริง)
  const handleDeleteConfirm = async () => {
    if (selectedReviewIdForDelete == null) return;
    try {
      await deleteReview(selectedReviewIdForDelete);
      setReviews((prev) => prev.filter((r) => r.id !== selectedReviewIdForDelete));
      setIsDeleteModalOpen(false);
      setSelectedReviewIdForDelete(null);
    } catch (e: any) {
      alert(e.message || "ลบไม่สำเร็จ");
    }
  };

  const filteredAndSortedReviews = useMemo(() => {
    let list = reviews.filter((r) => {
      const matchesSearch = (r.title + " " + r.category + " " + r.username)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "ทั้งหมด" || r.category === selectedCategory;

      // ✅ เปลี่ยนจาก username -> memberId (ชัวร์กว่า)
      const matchesFilter = filterBy === "all" || r.memberId === MY_MEMBER_ID;

      return matchesSearch && matchesCategory && matchesFilter;
    });

    if (sortBy === "latest") {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      list.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    return list;
  }, [reviews, searchTerm, selectedCategory, sortBy, filterBy]);

  const deletingReview =
    selectedReviewIdForDelete != null ? reviews.find((r) => r.id === selectedReviewIdForDelete) : null;

  return (
    <div className="rl-page">
      <div className="rl-wrap">
        <div className="rl-stickyHead">
          <div className="rl-headTop">
            <div>
              <div className="rl-eyebrow">COMMUNITY REVIEW</div>
              <div className="rl-title">
                รีวิวจากเพื่อนถึงเพื่อน <span className="rl-bubble">💬</span>
              </div>
            </div>
            <div className="rl-live">
              <span className="rl-liveDot" />
              Live
            </div>
          </div>

          <div className="rl-search">
            <span className="rl-searchIcon">🔎</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารีวิว..."
            />
          </div>

          <div className="rl-filters">
            <div className="rl-selectWrap">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="ทั้งหมด">📂 หมวดหมู่ทั้งหมด</option>
                <option value="โรงอาหารกลาง">🍚 โรงอาหารกลาง</option>
                <option value="รายวิชาวิศวกรรมคอมพิวเตอร์">💻 วิชาคอมพิวเตอร์</option>
                <option value="สถานที่ออกกำลังกาย">🏋️ สถานที่ออกกำลังกาย</option>
                <option value="หอพัก">🏢 หอพัก</option>
              </select>
            </div>

            <div className="rl-tabs">
              <button
                className={`rl-tab ${filterBy === "all" ? "is-active" : ""}`}
                onClick={() => setFilterBy("all")}
              >
                รีวิวทั้งหมด 🌐
              </button>
              <button
                className={`rl-tab ${filterBy === "my" ? "is-active" : ""}`}
                onClick={() => setFilterBy("my")}
              >
                รีวิวของฉัน 👤
              </button>
              <button
                className={`rl-tab ${sortBy === "latest" ? "is-active" : ""}`}
                onClick={() => setSortBy("latest")}
              >
                ล่าสุด ✨
              </button>
              <button
                className={`rl-tab ${sortBy === "popular" ? "is-active" : ""}`}
                onClick={() => setSortBy("popular")}
              >
                ยอดนิยม 🔥
              </button>
            </div>
          </div>
        </div>

        {/* ✅ loading / error */}
        {loading && <div style={{ padding: 12, fontWeight: 800 }}>กำลังโหลดรีวิว...</div>}
        {error && <div style={{ padding: 12, fontWeight: 800, color: "red" }}>{error}</div>}

        <div className="rl-list">
          {!loading && filteredAndSortedReviews.length > 0 ? (
            filteredAndSortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReport={() => handleReport(review.id)}
                // ✅ เช็คจาก memberId (ตอนนี้ mock member_id = 1)
                canDelete={review.memberId === MY_MEMBER_ID}
                onDelete={() => handleDeleteClick(review.id)}
              />
            ))
          ) : !loading ? (
            <div className="rl-empty">
              <div className="rl-emptyEmoji">🧐</div>
              <div className="rl-emptyText">
                ไม่พบรีวิว{filterBy === "my" ? "ที่คุณเขียน" : ""}
                {searchTerm || selectedCategory !== "ทั้งหมด" ? "ตามที่ค้นหา" : ""}
              </div>
              <button
                className="rl-clear"
                onClick={() => {
                  setSelectedCategory("ทั้งหมด");
                  setSearchTerm("");
                  setFilterBy("all");
                }}
              >
                ล้างการค้นหา
              </button>
            </div>
          ) : null}
        </div>

        {/* ✅ ปุ่มลอย */}
        <button
          className="rl-fab"
          onClick={() => navigate("/User/Review/createreview")}
          type="button"
        >
          <span className="rl-fabPlus">+</span>
          เขียนรีวิว
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
        onSubmit={handleReportSubmit}
      />

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedReviewIdForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="ลบรีวิวนี้ใช่ไหม?"
        description={
          deletingReview ? `รีวิว “${deletingReview.title}” จะถูกลบออกจากรายการ` : "รีวิวนี้จะถูกลบออกจากรายการ"
        }
      />
    </div>
  );
};

export default ReviewListPage;
