import React, { useState, useEffect } from "react";
import { DATA } from "./Data";
import { Compass, ChevronLeft, LogOut, User } from "lucide-react";
import { getDir } from "./utils";
import { Link } from "react-router-dom";

export const Sidebar = ({ lang, page }) => {
  const [user, setUser] = useState(null);

  // مراقبة حالة المستخدم المسجل
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // دالة تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen fixed top-0 right-0 bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-sm z-50">
      <div className="h-24 flex items-center px-8 border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <Compass size={28} />
          </div>
          <div>
            <Link
              to="/"
              className="text-xl font-black text-slate-800 tracking-tight block"
            >
              Newcomer
            </Link>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
              Guide
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
        <div className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {lang === "ar" ? "القائمة الرئيسية" : "Main Menu"}
        </div>

        {DATA.nav.map((item) => {
          const isActive = page === item.id;
          const path = item.id === "home" ? "/" : `/${item.id}`;

          return (
            <Link
              key={item.id}
              to={path}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 transform scale-[1.02]"
                  : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
              }`}
            >
              <item.icon
                size={20}
                className={
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-blue-500"
                }
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-sm font-bold">{item.label[lang]}</span>
              {isActive && (
                <ChevronLeft
                  size={16}
                  className={`mr-auto opacity-50 ${
                    getDir(lang) === "ltr" ? "rotate-180" : ""
                  }`}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* --- الجزء الأسفل من السايد بار: يتغير بناءً على حالة تسجيل الدخول --- */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        {user ? (
          <div className="space-y-2">
            {/* عرض اسم المستخدم كخيار غير قابل للضغط أو رابط للملف الشخصي */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <User size={16} />
              </div>
              <span className="text-sm font-black text-slate-700 truncate">
                {user.username}
              </span>
            </div>

            {/* زر تسجيل الخروج الاحترافي */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all cursor-pointer"
            >
              <LogOut size={16} />
              {lang === "ar" ? "تسجيل الخروج" : "Sign Out"}
            </button>
          </div>
        ) : (
          /* زر تسجيل الدخول يظهر فقط في حالة عدم وجود مستخدم */
          <Link
            to="/auth"
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg block text-center"
          >
            {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
          </Link>
        )}
      </div>
    </aside>
  );
};
