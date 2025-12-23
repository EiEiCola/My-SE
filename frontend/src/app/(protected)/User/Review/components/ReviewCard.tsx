import React, { useState } from "react";
import "./ReviewCard.css";

interface ReviewCardProps {
  review: {
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
    myVoteType?: "helpful" | "not_helpful" | null;
  };
  onReport: () => void;

  // ✅ Props สำหรับการลบ
  canDelete?: boolean;
  onDelete?: () => void;
  onVote?: (type: "helpful" | "not_helpful") => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onReport,
  canDelete = false,
  onDelete,
  onVote,
}) => {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const GalleryModal: React.FC = () => {
    if (!isGalleryModalOpen || !review.images || review.images.length === 0) return null;

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
              <img className="rcm-img" src={currentUrl} alt={`img-${currentImageIndex}`} />
            ) : (
              <div className="rcm-placeholder">
                <div className="rcm-phIcon">🖼️</div>
                <div className="rcm-phTitle">รูปภาพ {currentImageIndex + 1}</div>
                <div className="rcm-phSub">(Placeholder: ถ้ามี URL รูปจริงจะแสดงที่นี่)</div>
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
            className={`rcm-nav rcm-left ${isFirstImage ? "is-disabled" : ""}`}
            onClick={prevImage}
            disabled={isFirstImage}
            aria-label="prev"
          >
            ‹
          </button>

          <button
            type="button"
            className={`rcm-nav rcm-right ${isLastImage ? "is-disabled" : ""}`}
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

  return (
    <>
      <article className="rc-card">
        {/* Top-right */}
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="rc-delIcon">
                <path
                  fillRule="evenodd"
                  d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V5.25h4.5a.75.75 0 0 1 0 1.5h-.69l-1.02 13.2A2.25 2.25 0 0 1 15.55 22.5H8.45a2.25 2.25 0 0 1-2.24-2.55L5.19 6.75H4.5a.75.75 0 0 1 0-1.5H9V3.75Zm1.5 1.5h3V3.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v1.5ZM7.7 6.75l.99 12.9a.75.75 0 0 0 .75.7h5.12a.75.75 0 0 0 .75-.7l.99-12.9H7.7Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Header */}
        <div className="rc-head">
          <div className="rc-avatar">
            <div className="rc-ring">
              <div className="rc-letter">
                {review.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="rc-online" />
          </div>

          <div className="rc-user">
            <div className="rc-name">{review.username}</div>
            <div className="rc-date">โพสต์เมื่อ {review.date}</div>
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

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="rc-images">
            {review.images.map((url, idx) => (
              <button
                type="button"
                key={idx}
                className="rc-imgTile"
                onClick={() => openGalleryModal(idx)}
                aria-label={`open-image-${idx + 1}`}
              >
                {url ? (
                  <img className="rc-thumb" src={url} alt={`thumb-${idx}`} />
                ) : (
                  <div className="rc-imgPlaceholder">
                    <div className="rc-imgIcon">🖼️</div>
                    <div className="rc-imgText">รูป {idx + 1}</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="rc-foot">
          <div className="rc-actions">
            <button
              type="button"
              className={`rc-action ${review.myVoteType === "helpful" ? "is-active" : ""}`}
              onClick={() => onVote?.("helpful")}
            >
              <span className="rc-actionIcon">👍</span>
              <span className="rc-actionNum">{review.helpfulCount}</span>
            </button>

            <button
              type="button"
              className={`rc-action rc-bad ${review.myVoteType === "not_helpful" ? "is-active" : ""}`}
              onClick={() => onVote?.("not_helpful")}
            >
              <span className="rc-actionIcon">👎</span>
              <span className="rc-actionNum">{review.notHelpfulCount}</span>
            </button>

          </div>

          <button type="button" onClick={onReport} className="rc-report">
            แจ้งปัญหา
          </button>
        </div>
      </article>

      <GalleryModal />
    </>
  );
};

export default ReviewCard;
