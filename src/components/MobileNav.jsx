// src/components/MobileNav.jsx
import React, { useEffect, useMemo } from "react";
import {
  Home,
  Sparkles,
  Map as MapIcon,
  Briefcase,
  LayoutGrid,
  X,
} from "lucide-react";
import { DATA } from "./Data";
import { useLocation, useNavigate } from "react-router-dom";

const normLang = (v) => {
  const s = String(v || "en").toLowerCase();
  if (s.startsWith("ar")) return "ar";
  if (s.startsWith("es")) return "es";
  return "en";
};
const getDir = (lang) => (normLang(lang) === "ar" ? "rtl" : "ltr");

const DICT = {
  ar: { all: "جميع الأقسام" },
  en: { all: "All Sections" },
  es: { all: "Todas las secciones" },
};
const t = (lang, key) => (DICT[normLang(lang)] || DICT.en)[key] || key;

function routeFor(id) {
  if (id === "home") return "/";
  return `/${id}`;
}

// ✅ Robust active id from pathname (don’t rely on prop "page")
function activeIdFromPath(pathname) {
  const p = pathname || "/";

  if (p === "/" || p === "/home") return "home";
  if (p.startsWith("/cv_builder")) return "cv_builder";
  if (p.startsWith("/start")) return "start";
  if (p.startsWith("/jobs")) return "jobs";

  const clean = p.startsWith("/") ? p.slice(1) : p;
  const first = clean.split("/")[0] || "home";
  return first;
}

// --- Mobile Nav ---
export const MobileNav = ({ lang = "en", toggleMenu }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const active = useMemo(() => activeIdFromPath(pathname), [pathname]);

  const navItems = [
    { id: "home", icon: Home },
    { id: "cv_builder", icon: Sparkles },
    { id: "start", icon: MapIcon },
    { id: "jobs", icon: Briefcase },
    { id: "menu", icon: LayoutGrid, action: toggleMenu },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden">
      <div className="glass-nav rounded-3xl px-6 py-4 flex justify-between items-center shadow-2xl shadow-blue-900/10 mx-auto max-w-sm">
        {navItems.map((item) => {
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.action) return item.action();
                navigate(routeFor(item.id));
              }}
              className={[
                "relative p-2 transition-all duration-300 flex flex-col items-center gap-1",
                isActive
                  ? "text-blue-600 -translate-y-2"
                  : "text-slate-400 hover:text-slate-600",
              ].join(" ")}
              aria-label={item.id}
            >
              <div
                className={[
                  "p-2 rounded-full transition-all",
                  isActive ? "bg-blue-100" : "",
                ].join(" ")}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {isActive && (
                <span className="w-1 h-1 bg-blue-600 rounded-full absolute -bottom-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Mobile Menu Overlay ---
export const MobileMenuOverlay = ({ lang = "en", isOpen, close }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const active = useMemo(() => activeIdFromPath(pathname), [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") close?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const direction = getDir(lang);

  return (
    <div
      className="fixed inset-0 z-[60] lg:hidden"
      dir={direction}
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={close}
        aria-label="Close menu"
      />

      {/* panel */}
      <div className="absolute inset-0 bg-white flex flex-col animate-[fadeIn_0.2s_ease-out]">
        <div className="h-24 flex items-center justify-between px-6 border-b border-slate-50 bg-white/80 backdrop-blur-md">
          <span className="text-xl font-black text-slate-900">
            {t(lang, "all")}
          </span>

          <button
            onClick={close}
            className="p-3 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
            type="button"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 pb-32">
          {Array.isArray(DATA?.nav) &&
            DATA.nav.map((item) => {
              const L = normLang(lang);
              const label =
                (item.label &&
                  (item.label[L] ||
                    item.label.en ||
                    item.label.ar ||
                    item.label.es)) ||
                item.id;

              const isActive = active === item.id;

              const border =
                String(item.color || "bg-slate-500")
                  .replace("bg-", "border-")
                  .replace("500", "100") || "border-slate-200";

              const iconText =
                String(item.color || "bg-slate-500").replace("bg-", "text-") ||
                "text-slate-700";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(routeFor(item.id));
                    close?.();
                  }}
                  className={[
                    "flex flex-col items-center justify-center gap-4 p-6 rounded-3xl transition-all border bg-white shadow-sm",
                    "hover:shadow-md hover:scale-[1.02] active:scale-95",
                    border,
                    isActive ? "ring-2 ring-blue-200 border-blue-200" : "",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "w-14 h-14 bg-opacity-10 rounded-2xl flex items-center justify-center",
                      item.color || "bg-slate-500",
                      iconText,
                    ].join(" ")}
                  >
                    <item.icon size={28} />
                  </div>

                  <span className="font-bold text-slate-700 text-sm text-center">
                    {label}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
