import { useEffect, useState } from "react";
import { getPublishedAnnouncements, getUnreadAnnouncements, type Announcement } from "../../../../services/http/announcementMember";
import AnnouncementSection from "./components/AnnouncementSection";
import HomeSidebar from "./components/HomeSidebar";
import UnreadPopup from "./components/UnreadPopup";

import AnnouncementWidget from "./components/AnnouncementWidget";

function HomeUser() {
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchData();
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
            {/* Feed Placeholder for future development */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[500px]">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Community Feed</h3>
              <p className="text-gray-500">
                พื้นที่สำหรับ Feed และ Post สาธารณะ
              </p>
              {/* Visual placeholder for feed items */}
              <div className="space-y-4 mt-6">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-2 bg-gray-200 rounded col-span-2"></div>
                          <div className="h-2 bg-gray-200 rounded col-span-1"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) -> 1 col */}
          <div className="lg:col-span-1 space-y-6">
            {/* Announcements Widget (Moved here) */}
            <div className="h-auto">
              <AnnouncementWidget />
            </div>

            <HomeSidebar />
          </div>
        </div>
      </div>
    </main>
  );
}

export default HomeUser;
