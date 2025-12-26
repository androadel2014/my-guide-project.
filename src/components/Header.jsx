import React, { useEffect, useState } from "react";
import { Compass, Search, Globe, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Header = ({ lang, setLang }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const syncUser = () => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // ✅ دايمًا خلي الهيدر يعرف أي تغيير في auth
  useEffect(() => {
    syncUser();

    // ✅ لو التغيير حصل في تبويب تاني
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") syncUser();
    };

    // ✅ لو التغيير حصل في نفس التبويب (Login/Logout)
    const onAuthChanged = () => syncUser();

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth_changed", onAuthChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth_changed", onAuthChanged);
    };
  }, []);

  // ✅ تسجيل خروج حقيقي + تحديث الهيدر فورًا
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // ✅ حدث للـ Header (نفس التبويب)
    window.dispatchEvent(new Event("auth_changed"));

    navigate("/auth", { replace: true });
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

      {/* --- شريط البحث --- */}
      <div className="hidden lg:flex items-center bg-white border border-slate-200 px-5 py-3.5 rounded-2xl w-96 shadow-sm">
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
        {/* --- تغيير اللغة --- */}
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 font-bold text-slate-700"
        >
          <Globe size={18} className="text-blue-600" />
          <span className="text-sm">
            {lang === "en" ? "العربية" : "English"}
          </span>
        </button>

        {/* --- المستخدم --- */}
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 pr-4 rounded-2xl"
            >
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {lang === "ar" ? "حسابي" : "My Account"}
                </span>
                <span className="text-sm font-black text-slate-800">
                  {user.username}
                </span>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <User size={20} />
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
              title={lang === "ar" ? "خروج" : "Logout"}
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold"
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
