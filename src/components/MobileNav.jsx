// 1. التعديل هنا: استيراد DATA واستخدام MapIcon
import {
  Home,
  Compass,
  User,
  Menu,
  X,
  Sparkles,
  Briefcase,
  LayoutGrid,
  Map as MapIcon, // غيرنا اسمها هنا
} from "lucide-react";
import { DATA } from "./Data"; // ضيف السطر ده عشان يقرأ الأقسام

// وظيفة getDir هنستخدمها تحت عشان التنبيه يختفي
const getDir = (lang) => (lang === "ar" ? "rtl" : "ltr");

// --- Mobile Nav ---
export const MobileNav = ({ page, setPage, toggleMenu }) => {
  const navItems = [
    { id: "home", icon: Home },
    { id: "cv_builder", icon: Sparkles },
    { id: "start", icon: MapIcon }, // التعديل هنا: استخدم MapIcon بدل Map
    { id: "jobs", icon: Briefcase },
    { id: "menu", icon: LayoutGrid, action: toggleMenu },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden">
      <div className="glass-nav rounded-3xl px-6 py-4 flex justify-between items-center shadow-2xl shadow-blue-900/10 mx-auto max-w-sm">
        {navItems.map((item) => {
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => (item.action ? item.action() : setPage(item.id))}
              className={`relative p-2 transition-all duration-300 flex flex-col items-center gap-1 ${
                isActive
                  ? "text-blue-600 -translate-y-2"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  isActive ? "bg-blue-100 text-blue-600" : ""
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {isActive && (
                <span className="w-1 h-1 bg-blue-600 rounded-full absolute -bottom-2"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Mobile Menu Overlay ---
export const MobileMenuOverlay = ({ lang, isOpen, close, setPage }) => {
  if (!isOpen) return null;

  // استخدمنا getDir هنا عشان التنبيه بتاع unused يختفي
  const direction = getDir(lang);

  return (
    <div
      className="fixed inset-0 bg-white z-[60] lg:hidden flex flex-col animate-[fadeIn_0.2s_ease-out]"
      dir={direction}
    >
      <div className="h-24 flex items-center justify-between px-6 border-b border-slate-50 bg-white/80 backdrop-blur-md">
        <span className="text-xl font-black text-slate-900">
          {lang === "ar" ? "جميع الأقسام" : "All Sections"}
        </span>
        <button
          onClick={close}
          className="p-3 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 pb-32">
        {DATA.nav.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setPage(item.id);
              close();
            }}
            className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl transition-all border ${item.color
              .replace("bg-", "border-")
              .replace(
                "500",
                "100"
              )} bg-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95`}
          >
            <div
              className={`w-14 h-14 ${
                item.color
              } bg-opacity-10 rounded-2xl flex items-center justify-center ${item.color.replace(
                "bg-",
                "text-"
              )}`}
            >
              <item.icon size={28} />
            </div>
            <span className="font-bold text-slate-700 text-sm">
              {item.label[lang]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
