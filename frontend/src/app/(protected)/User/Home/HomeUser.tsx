import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedAnnouncements, getUnreadAnnouncements, type Announcement } from "../../../../services/http/announcementMember";
import postService, { type Post } from "../../../../services/http/post_service";
import AnnouncementSection from "./components/AnnouncementSection";
import HomeSidebar from "./components/HomeSidebar";
import UnreadPopup from "./components/UnreadPopup";
import AnnouncementWidget from "./components/AnnouncementWidget";

function HomeUser() {
  const navigate = useNavigate();
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    fetchData();
    fetchPosts();
  }, []);

  const fetchData = async () => {
    try {
      const pubs = await getPublishedAnnouncements();
      if (pubs && pubs.data) {
        setPublishedAnnouncements(pubs.data || []);
      } else if (Array.isArray(pubs)) {
        setPublishedAnnouncements(pubs);
      }

      const unread = await getUnreadAnnouncements();
      if (unread && unread.length > 0) {
        setUnreadAnnouncements(unread);
        setShowPopup(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await postService.getAll();
      const data = res?.data?.data || res?.data || [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setLoadingPosts(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "เมื่อกี้";
    if (diffMins < 60) return `${diffMins} นาที`;
    if (diffHours < 24) return `${diffHours} ชม.`;
    if (diffDays < 7) return `${diffDays} วัน`;
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  };

  // Helper function to format image URLs
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const formatImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${API_BASE}${url}`;
    return `${API_BASE}/${url}`;
  };

  const getAuthorDisplay = (post: Post) => {
    if (post.is_anonymous) {
      return {
        name: "ไม่ระบุตัวตน",
        avatar: `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128`
      };
    }
    if (post.author) {
      return {
        name: post.author.username || `${post.author.first_name} ${post.author.last_name}`,
        avatar: post.author.member_picture || `https://api.dicebear.com/7.x/thumbs/svg?seed=${post.author_id}`,
      };
    }
    return { name: "ผู้ใช้", avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=user` };
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/30 p-4 md:p-8">
      {showPopup && unreadAnnouncements.length > 0 && (
        <UnreadPopup
          unreadAnnouncements={unreadAnnouncements}
          onClose={() => setShowPopup(false)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Official Announcement Slider */}
        <AnnouncementSection publishedAnnouncements={publishedAnnouncements} />

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left/Center Column (News Feed area) -> Now 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            {/* Community Feed - Pantip Realtime Style (White Background) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-h-[500px]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <span className="text-orange-500 font-bold text-lg">🔥 Community Feed</span>
                <span className="text-gray-400 text-sm">Post Realtime</span>
              </div>

              {loadingPosts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">ยังไม่มีโพสต์</p>
                  <p className="text-sm mt-2">เป็นคนแรกที่แชร์เรื่องราวของคุณ!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {posts.slice(0, 10).map((post) => {
                    const author = getAuthorDisplay(post);
                    const firstImage = post.images && post.images.length > 0
                      ? formatImageUrl(post.images[0].url)
                      : null;
                    return (
                      <div
                        key={post.ID}
                        onClick={() => navigate(`/User/Post/detail/${post.ID}`)}
                        className="flex gap-3 p-3 bg-gray-50 hover:bg-orange-50 rounded-lg cursor-pointer transition-all group border border-gray-100 hover:border-orange-200"
                      >
                        {/* Thumbnail */}
                        {firstImage && (
                          <img
                            src={firstImage}
                            alt="thumbnail"
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Category Tag */}
                          {post.MainCategory && (
                            <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded mb-1 font-medium">
                              {post.MainCategory.title}
                            </span>
                          )}

                          {/* Title */}
                          <h4 className="text-gray-800 font-medium text-sm line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                            {post.title}
                          </h4>

                          {/* Author & Stats */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                            <span className="truncate max-w-[80px]">{author.name}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(post.created_at)}</span>
                            <span className="ml-auto flex items-center gap-3">
                              <span className="flex items-center gap-1 text-orange-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                {post.like_count || 0}
                              </span>
                              <span className="flex items-center gap-1 text-orange-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {post.comment_count || 0}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View More Button */}
              {posts.length > 0 && (
                <div className="text-center mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/User/Post')}
                    className="text-gray-500 hover:text-orange-500 text-sm transition-colors font-medium"
                  >
                    ▼ ดูเพิ่มเติม ▼
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Sidebar) -> 1 col */}
          <div className="lg:col-span-1 space-y-6">
            {/* Announcements Widget (Moved here) */}
            <div className="h-auto">
              <AnnouncementWidget />
            </div>

            <HomeSidebar posts={posts} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default HomeUser;
