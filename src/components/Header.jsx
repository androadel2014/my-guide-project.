import React, { useState, useEffect } from "react";
import { Compass, Search, Globe, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = ({ lang, setLang }) => {
  const [user, setUser] = useState(null);

  // تحديث حالة المستخدم عند تحميل المكون
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
    <header className="h-24 flex items-center justify-between px-6 lg:px-12 pt-4">
      {/* --- اللوجو للموبايل --- */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
          <Compass size={20} />
        </div>
        <span className="font-black text-xl text-slate-800 tracking-tight">
          Newcomer
        </span>
      </div>

      {/* --- شريط البحث للديسك توب --- */}
      <div className="hidden lg:flex items-center bg-white border border-slate-200 px-5 py-3.5 rounded-2xl w-96 shadow-sm focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-300 transition-all">
        <Search size={20} className="text-slate-400" />
        <input
          type="text"
          placeholder={
            lang === "ar" ? "ابحث عن أي شيء..." : "Search anything..."
          }
          className="bg-transparent border-none outline-none w-full mx-3 text-slate-700 placeholder-slate-400 font-medium"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* --- زر تغيير اللغة --- */}
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Globe size={18} className="text-blue-600" />
          <span className="text-sm pt-0.5">
            {lang === "en" ? "العربية" : "English"}
          </span>
        </button>

        {/* --- حالة المستخدم (مسجل أم لا) --- */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* رابط الملف الشخصي */}
            <Link
              to="/profile"
              className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 pr-4 rounded-2xl shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "ar" ? "حسابي" : "My Account"}
                </span>
                <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                  {user.username}
                </span>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <User size={20} />
              </div>
            </Link>

            {/* زر تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
              title={lang === "ar" ? "خروج" : "Logout"}
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          /* زر تسجيل الدخول في حال عدم وجود مستخدم */
          <Link
            to="/auth"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 cursor-pointer"
          >
            <User size={18} />
            <span className="text-sm">
              {lang === "ar" ? "دخول" : "Sign In"}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};
