import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReviewCard.css";

interface ReviewCardProps {
  review: {
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

    // ✅ NEW
    isAnonymous?: boolean;
    avatarUrl?: string;
  };
  currentMemberId?: number; //กด profile
  isMine?: boolean;   //กดโปรไฟล์ตัวเอง
  onReport: () => void;

  canDelete?: boolean;
  onDelete?: () => void;

  canReport?: boolean;

  onVote?: (type: "helpful" | "not_helpful") => void;
}

/**
 * ✅ ใส่รูป anon ตามโปรเจกต์ของเธอ
 * วิธีที่แนะนำ:
 * 1) วางรูปไว้ที่ src/assets/anon.png แล้ว:
 *    import ANON_AVATAR from "../../../../assets/anon.png";
 *
 * หรือ 2) วางใน public แล้วใช้ "/anon.png"
 */
const ANON_AVATAR = "/avatars/anon.png";

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onReport,
  currentMemberId,
  isMine = false,
  canDelete = false,
  onDelete,
  canReport = true,
  onVote,
}) => {
  const navigate = useNavigate();

  // ===== Gallery modal (รูปใหญ่) =====
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ===== Handle username click (navigate to profile) =====
  const handleUsernameClick = () => {
    if (review.isAnonymous) return;

    // ✅ ถ้าเป็นของตัวเอง ให้ไป /User/Profile เสมอ
    if (isMine) {
      navigate("/User/Profile");
      return;
    }

    // ✅ ของคนอื่น -> /User/Profile/:memberId
    const authorId = Number(review.memberId);
    if (authorId) navigate(`/User/Profile/${authorId}`);
  };


  const openGalleryModal = (index: number) => {
    if (!review.images || review.images.length === 0) return;
    setCurrentImageIndex(index);
    setIsGalleryModalOpen(true);
  };

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % review.images.length);

  const prevImage = () =>
    setCurrentImageIndex(
      (prev) => (prev - 1 + review.images.length) % review.images.length
    );

  // ===== Strip (โชว์ 3 รูป / step=1) =====
  const VISIBLE = 3;
  const totalImgs = review.images?.length ?? 0;

  const [imgStart, setImgStart] = useState(0);

  useEffect(() => {
    // ✅ เปลี่ยนการ์ด/รีวิวใหม่ กลับไปเริ่มต้น
    setImgStart(0);
  }, [review.id]);

  const canPrev = imgStart > 0;
  const canNext = imgStart + VISIBLE < totalImgs;

  const visibleImgs = useMemo(() => {
    const imgs = review.images || [];
    return imgs.slice(imgStart, imgStart + VISIBLE);
  }, [review.images, imgStart]);

  const GalleryModal: React.FC = () => {
    if (!isGalleryModalOpen || !review.images || review.images.length === 0)
      return null;

    const isFirstImage = currentImageIndex === 0;
    const isLastImage = currentImageIndex === review.images.length - 1;

    const currentUrl = review.images[currentImageIndex];

    return (
      <div
        className="rcm-overlay"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setIsGalleryModalOpen(false);
        }}
      >
        <div className="rcm-wrap" onMouseDown={(e) => e.stopPropagation()}>
          <div className="rcm-view">
            {currentUrl ? (
              <img
                className="rcm-img"
                src={currentUrl}
                alt={`img-${currentImageIndex}`}
              />
            ) : (
              <div className="rcm-placeholder">
                <div className="rcm-phIcon">🖼️</div>
                <div className="rcm-phTitle">
                  รูปภาพ {currentImageIndex + 1}
                </div>
                <div className="rcm-phSub">
                  (Placeholder: ถ้ามี URL รูปจริงจะแสดงที่นี่)
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="rcm-close"
            onClick={() => setIsGalleryModalOpen(false)}
            aria-label="close"
          >
            ✕
          </button>

          <button
            type="button"
            className={`rcm-nav rcm-left ${isFirstImage ? "is-disabled" : ""
              }`}
            onClick={prevImage}
            disabled={isFirstImage}
            aria-label="prev"
          >
            ‹
          </button>

          <button
            type="button"
            className={`rcm-nav rcm-right ${isLastImage ? "is-disabled" : ""
              }`}
            onClick={nextImage}
            disabled={isLastImage}
            aria-label="next"
          >
            ›
          </button>

          <div className="rcm-count">
            {currentImageIndex + 1} / {review.images.length}
          </div>
        </div>
      </div>
    );
  };

  const avatarLetter = useMemo(() => {
    const name = String(review.username || "").trim();
    return name ? name.charAt(0).toUpperCase() : "U";
  }, [review.username]);

  return (
    <>
      <article className="rc-card">
        {/* Header */}
        <div className="rc-head">
          <div className="rc-left">
            <div className="rc-avatar">
              <div className="rc-ring">
                {review.isAnonymous ||
                  review.username === "ไม่เปิดเผยชื่อ" ||
                  review.username === "ไม่ระบุตัวตน" ? (
                  <img className="rc-avatarImg" src={ANON_AVATAR} alt="anonymous" />
                ) : review.avatarUrl ? (
                  <img className="rc-avatarImg" src={review.avatarUrl} alt="avatar" />
                ) : (
                  <div className="rc-letter">
                    {(review.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="rc-user">
              {!review.isAnonymous && review.memberId ? (
                <div
                  className="rc-name clickable"
                  onClick={handleUsernameClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleUsernameClick();
                    }
                  }}
                >
                  {review.username}
                </div>
              ) : (
                <div className="rc-name">{review.username}</div>
              )}
              <div className="rc-date">โพสต์เมื่อ {review.date}</div>
            </div>
          </div>

          {/* Top-right (Category & Actions) moved here */}
          <div className="rc-topRight">
            <span className="rc-chip">{review.category}</span>

            {canDelete && (
              <button
                type="button"
                className="rc-del"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                title="ลบรีวิว"
                aria-label="delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="rc-delIcon"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V5.25h4.5a.75.75 0 0 1 0 1.5h-.69l-1.02 13.2A2.25 2.25 0 0 1 15.55 22.5H8.45a2.25 2.25 0 0 1-2.24-2.55L5.19 6.75H4.5a.75.75 0 0 1 0-1.5H9V3.75Zm1.5 1.5h3V3.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v1.5ZM7.7 6.75l.99 12.9a.75.75 0 0 0 .75.7h5.12a.75.75 0 0 0 .75-.7l.99-12.9H7.7Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="rc-ratingRow">
          <div className="rc-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`rc-star ${i < review.rating ? "is-on" : "is-off"}`}
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
            ))}
          </div>

          <span className="rc-score">{review.rating}.0</span>
        </div>

        {/* Content */}
        <h2 className="rc-title">{review.title}</h2>
        <p className="rc-content">{review.content}</p>

        {/* Images (โชว์ 3 รูป + ลูกศร step=1) */}
        {totalImgs > 0 && (
          <div className="rc-imgWrap">
            {totalImgs > VISIBLE && (
              <button
                type="button"
                className={`rc-imgArrow rc-left ${!canPrev ? "is-disabled" : ""
                  }`}
                onClick={() => canPrev && setImgStart((s) => s - 1)}
                disabled={!canPrev}
                aria-label="prev-images"
              >
                ‹
              </button>
            )}

            <div className="rc-images3">
              {visibleImgs.map((url, i) => {
                const realIndex = imgStart + i;
                return (
                  <button
                    type="button"
                    key={realIndex}
                    className="rc-imgTile"
                    onClick={() => openGalleryModal(realIndex)}
                    aria-label={`open-image-${realIndex + 1}`}
                  >
                    {url ? (
                      <img
                        className="rc-thumb"
                        src={url}
                        alt={`thumb-${realIndex}`}
                      />
                    ) : (
                      <div className="rc-imgPlaceholder">
                        <div className="rc-imgIcon">🖼️</div>
                        <div className="rc-imgText">รูป {realIndex + 1}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {totalImgs > VISIBLE && (
              <button
                type="button"
                className={`rc-imgArrow rc-right ${!canNext ? "is-disabled" : ""
                  }`}
                onClick={() => canNext && setImgStart((s) => s + 1)}
                disabled={!canNext}
                aria-label="next-images"
              >
                ›
              </button>
            )}

            {totalImgs > VISIBLE && (
              <div className="rc-imgCount">
                {Math.min(imgStart + 1, totalImgs)}-
                {Math.min(imgStart + VISIBLE, totalImgs)} / {totalImgs}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="rc-foot">
          <div className="rc-actions">
            <button
              type="button"
              className={`rc-action ${review.myVoteType === "helpful" ? "is-active" : ""
                }`}
              onClick={() => onVote?.("helpful")}
            >
              <span className="rc-actionIcon">👍</span>
              <span className="rc-actionNum">{review.helpfulCount}</span>
            </button>

            <button
              type="button"
              className={`rc-action rc-bad ${review.myVoteType === "not_helpful" ? "is-active" : ""
                }`}
              onClick={() => onVote?.("not_helpful")}
            >
              <span className="rc-actionIcon">👎</span>
              <span className="rc-actionNum">{review.notHelpfulCount}</span>
            </button>
          </div>

          {canReport && (
            <button type="button" onClick={onReport} className="rc-report">
              แจ้งปัญหา
            </button>
          )}
        </div>
      </article>

      <GalleryModal />
    </>
  );
};

export default ReviewCard;
