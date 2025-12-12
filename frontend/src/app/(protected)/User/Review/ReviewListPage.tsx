import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReviewCard from "./components/ReviewCard";

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

const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด"); // State สำหรับ Dropdown
  const [sortBy, setSortBy] = useState("latest"); // State สำหรับปุ่มเรียงลำดับ (ล่าสุด/ยอดนิยม)

  // ข้อมูลจำลอง (Mock Data)
 const reviews: ReviewItem[] = [
  {
    id: 1,
    username: "chaaim8dec",
    title: "โรงอาหารสะอาด อาหารอร่อย",          // หัวข้อสั้น ๆ
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
    images: ["", "", ""],
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
    images: ["", "", ""],
    helpfulCount: 8,
    notHelpfulCount: 2,
  },
];


  // Logic การกรองข้อมูล
  const filteredReviews = reviews.filter((r) => {
    // 1. กรองตาม Search Bar
    const matchesSearch = (r.title + " " + r.category + " " + r.username).toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. กรองตาม Dropdown หมวดหมู่
    const matchesCategory = selectedCategory === "ทั้งหมด" || r.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#fdfbf7] via-[#fffefc] to-[#fef3c7]/30 flex justify-center selection:bg-[#f9a825] selection:text-white">
      <div className="w-full max-w-2xl px-5 py-8 md:py-12 pb-32">
        
        {/* Header Section */}
        <div className="sticky top-0 z-30 pt-4 pb-4 -mx-5 px-5 bg-[#fdfbf7]/85 backdrop-blur-md border-b border-gray-100/50 transition-all">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-sm font-semibold text-[#f9a825] tracking-wider uppercase">Community Review</h2>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
              รีวิวจากเพื่อนถึงเพื่อน 💬
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative group mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 group-focus-within:text-[#f9a825] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
            </div>
            <input
              type="text"
              placeholder="        ค้นหารีวิว..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-100 text-gray-700 shadow-sm focus:shadow-md focus:border-[#f9a825]/50 focus:outline-none transition-all duration-300 placeholder:text-gray-300"
            />
          </div>

          {/* Filters Row: Dropdown + Sort Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            
            {/* === Dropdown หมวดหมู่ (New) === */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-[200px] appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium shadow-sm hover:border-[#f9a825] focus:outline-none focus:ring-2 focus:ring-[#f9a825]/20 focus:border-[#f9a825] transition-all cursor-pointer"
              >
                <option value="ทั้งหมด">📂 หมวดหมู่ทั้งหมด</option>
                <option value="โรงอาหารกลาง">🍚 โรงอาหารกลาง</option>
                <option value="วิชาคอมพิวเตอร์">💻 วิชาคอมพิวเตอร์</option>
                <option value="สถานที่ออกกำลังกาย">🏋️ สถานที่ออกกำลังกาย</option>
                <option value="หอพัก">🏢 หอพัก</option>
              </select>
              
              {/* Custom Arrow Icon for Dropdown */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>

            {/* Sort Buttons (Latest / Popular) */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
               <button
                onClick={() => setSortBy("latest")}
                className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  sortBy === "latest"
                    ? "bg-[#f9a825] text-white shadow-md shadow-orange-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                ล่าสุด ✨
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  sortBy === "popular"
                    ? "bg-[#f9a825] text-white shadow-md shadow-orange-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                ยอดนิยม 🔥
              </button>
            </div>

          </div>
        </div>

        {/* Review List */}
        <div className="flex flex-col gap-6 mt-2">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="text-5xl mb-4 opacity-50">🧐</div>
              <p>ไม่พบรีวิวในหมวดหมู่นี้</p>
              <button 
                onClick={() => {setSelectedCategory("ทั้งหมด"); setSearchTerm("");}}
                className="mt-4 text-[#f9a825] underline text-sm hover:text-[#c65b1a]"
              >
                ล้างการค้นหา
              </button>
            </div>
          )}
        </div>

        {/* Floating Button */}
        <button
          onClick={() => navigate("/User/Review/New")}
          className="fixed bottom-8 right-6 md:right-12 group flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-[#f9a825] text-white shadow-[0_8px_30px_rgb(249,168,37,0.4)] hover:bg-[#eb9b1e] hover:scale-105 hover:shadow-[0_15px_35px_rgb(249,168,37,0.5)] transition-all duration-300 z-40"
        >
          <span className="text-2xl font-light leading-none mb-1">+</span>
          <span className="font-semibold tracking-wide">เขียนรีวิว</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewListPage;