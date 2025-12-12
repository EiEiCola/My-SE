import React from "react";

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
  };
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <article className="group relative w-full bg-white rounded-[1.5rem] p-6 md:p-7 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02),0_10px_20px_-2px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-orange-100/50">

      {/* Category Tag (Floating Top Right) */}
      <div className="absolute top-6 right-6">
        <span className="px-3 py-1 rounded-full bg-orange-50 text-[#c65b1a] text-[10px] md:text-xs font-bold uppercase tracking-wide">
          {review.category}
        </span>
      </div>

      {/* Header: User Info */}
      <div className="flex items-center gap-3.5 mb-4">
        {/* Avatar with Gradient Ring */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f9a825] to-[#ffe082] p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#c65b1a] font-bold text-lg">
              {review.username.charAt(0).toUpperCase()}
            </div>
          </div>
          {/* Online Status Dot (Optional) */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>

        <div className="flex flex-col">
          <h3 className="font-bold text-gray-800 text-sm md:text-base">
            {review.username}
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            โพสต์เมื่อ {review.date}
          </span>
        </div>
      </div>

      {/* Review Content */}
      {/* Review Content */}
      <div className="mb-4">

        {/* ดาว + คะแนน */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-4 h-4 ${i < review.rating ? "text-[#f9a825]" : "text-gray-200"
                }`}
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
          ))}
          <span className="ml-2 text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
            {review.rating}.0
          </span>
        </div>

        {/* ⭐⭐ หัวข้อรีวิวแบบเด่นพิเศษ ⭐⭐ */}
        <h2 className="text-lg md:text-s font-extrabold text-[#c65b1a] leading-snug mb-2 tracking-wide">
          {review.title}
        </h2>

        {/* เนื้อหา */}
        <p className="text-gray-700 text-[15px] leading-7 font-normal">
          {review.content}
        </p>
      </div>


      {/* Images - Gallery Layout */}
      {review.images.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-hidden rounded-xl">
          {review.images.map((img, idx) => (
            <div key={idx} className="flex-1 aspect-video md:aspect-[16/10] bg-gray-100 relative hover:opacity-90 transition-opacity cursor-pointer">
              {/* Placeholder for image */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="text-[10px]">รูป {idx + 1}</span>
              </div>
              {/* <img src={img} className="w-full h-full object-cover" /> */}
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 w-full 
                mt-4 pt-4 pb-3 min-h-[48px]">
        <div className="flex gap-7">
          <button className="flex items-center gap-2 text-gray-400 hover:text-[#f9a825] transition-colors group">
            <div className="p-2 rounded-full bg-gray-50 group-hover:bg-[#fff7e0] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.233 18.75h4.864v2.25H14.233zM7.5 18.75v2.25h1.5v-2.25h-1.5z" />
              </svg>
            </div>
            <span className="text-xs font-semibold">{review.helpfulCount}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group">
            <div className="p-2 rounded-full bg-gray-50 group-hover:bg-red-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.323-.411.74-.74 1.212-.924.999-1.272 1.602-2.88 1.602-4.634 0-1.605-.51-3.104-1.399-4.348z" />
              </svg>
            </div>
            <span className="text-xs font-semibold">{review.notHelpfulCount}</span>
          </button>
        </div>

        <button className="text-xs text-gray-400 hover:text-orange-500 px-2">
          แจ้งปัญหา
        </button>
      </div>

    </article>
  );
};

export default ReviewCard;