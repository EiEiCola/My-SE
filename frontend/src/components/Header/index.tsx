import React from "react";

interface HeaderProps {
  role: "admin" | "user";
  username?: string;
}

const Header: React.FC<HeaderProps> = ({ role, username = "eiei" }) => {
  const title = role === "admin" ? "Admin Dashboard" : "Dashboard";
  const subtitle =
    role === "admin"
      ? `Welcome back, ${username} (Admin)`
      : `Welcome back, ${username}`;

  return (
    <div
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl 
      border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center space-x-4">
          <button
            className="p-2 rounded-lg text-slate-600 dark:text-slate-200
            hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {/* ตรงนี้ค่อยใส่ icon ทีหลังได้ */}
            <div className="w-5 h-5" />
          </button>

          <div className="hidden md:block">
            <h1 className="text-xl font-black text-slate-800 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {subtitle}
            </p>
          </div>
        </div>

        {/* CENTER – Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            {/* icon search */}
            <div
              className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2
              text-slate-400"
            />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              rounded-full text-slate-800 dark:text-white
              placeholder-slate-500 dark:placeholder-slate-400
              focus:outline-none focus:ring-2
              focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <div className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-3">
          <button
            className="hidden lg:flex items-center space-x-2 py-2 px-4
            bg-gradient-to-r from-blue-500 to-purple-600 text-white 
            rounded-xl hover:shadow-lg transition-all text-sm font-medium"
          >
            <div className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
