import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReviewCard from "./components/ReviewCard";
import ReportReviewModal from "./ReportReviewModal";
import "./ReviewListPage.css";

interface ReviewItem {
  id: number;
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

const reviewsSeed: ReviewItem[] = [
  {
    id: 1,
    username: "chaaim8dec",
    title: "โรงอาหารสะอาด อาหารอร่อย",
    content:
      "โรงอาหารสะอาดมากเลย อาหารสะอาด แม่ค้าพูดจาดีมากครับ แนะนำร้านข้าวมันไก่ น้ำซุปคือทีเด็ด ชดแล้วคล่องคอสุดๆ",
    date: "2025-08-01",
    category: "โรงอาหารกลาง",
    rating: 5,
    images: ["", "", ""],
    helpfulCount: 12,
    notHelpfulCount: 1,
  },
  {
    id: 2,
    username: "sutstudent01",
    title: "ก๋วยเตี๋ยวอร่อย แต่คนแน่นตอนเที่ยง",
    content:
      "ร้านก๋วยเตี๋ยวรสชาติดีมาก เส้นลวกกำลังดี แต่ช่วงเที่ยงคนเยอะ ต้องรอคิวนานหน่อย แนะนำไปก่อนเที่ยงจะดีกว่า",
    date: "2025-08-02",
    category: "โรงอาหารกลาง",
    rating: 4,
    images: ["", ""],
    helpfulCount: 5,
    notHelpfulCount: 0,
  },
  {
    id: 3,
    username: "comeng66",
    title: "วิชาโปรแกรมมิ่งสอนสนุก งานเยอะหน่อย",
    content:
      "อาจารย์อธิบายเข้าใจง่าย มีตัวอย่างให้ลองเยอะ แต่การบ้านก็เยอะตาม ต้องแบ่งเวลาอ่านก่อนสอบนิดนึง",
    date: "2025-08-03",
    category: "รายวิชาวิศวกรรมคอมพิวเตอร์",
    rating: 5,
    images: [""],
    helpfulCount: 8,
    notHelpfulCount: 2,
  },
  {
    id: 4,
    username: "chaaim8dec",
    title: "หอพักสะอาดดีมากครับ",
    content: "หอพักใหม่ สะอาด สิ่งอำนวยความสะดวกครบถ้วน เดินทางสะดวก ปลอดภัย",
    date: "2025-08-04",
    category: "หอพัก",
    rating: 5,
    images: [],
    helpfulCount: 20,
    notHelpfulCount: 0,
  },
];

const MY_USERNAME = "chaaim8dec";

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
  const [reviews, setReviews] = useState<ReviewItem[]>(reviewsSeed);

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

  const handleDeleteConfirm = () => {
    if (selectedReviewIdForDelete == null) return;
    setReviews((prev) => prev.filter((r) => r.id !== selectedReviewIdForDelete));
    setIsDeleteModalOpen(false);
    setSelectedReviewIdForDelete(null);
  };

  const filteredAndSortedReviews = useMemo(() => {
    let list = reviews.filter((r) => {
      const matchesSearch = (r.title + " " + r.category + " " + r.username)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "ทั้งหมด" || r.category === selectedCategory;
      const matchesFilter = filterBy === "all" || r.username === MY_USERNAME;

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
            </div>
          </div>
        </div>

        <div className="rl-list">
          {filteredAndSortedReviews.length > 0 ? (
            filteredAndSortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReport={() => handleReport(review.id)}
                canDelete={review.username === MY_USERNAME}
                onDelete={() => handleDeleteClick(review.id)}
              />
            ))
          ) : (
            <div className="rl-empty">
              <div className="rl-emptyEmoji">🧐</div>
              <div className="rl-emptyText">
                ไม่พบรีวิว{filterBy === "my" ? "ที่คุณเขียน" : ""}{searchTerm || selectedCategory !== "ทั้งหมด" ? "ตามที่ค้นหา" : ""}
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
          )}
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
