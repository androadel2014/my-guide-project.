// src/lib/lang.js
import i18n from "../i18n/index";

const isBrowser = typeof window !== "undefined";

export function applyLang(lang) {
  if (!isBrowser) return;

  localStorage.setItem("lang", lang);
  i18n.changeLanguage(lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export function initLang() {
  if (!isBrowser) return "ar";
  const lang = localStorage.getItem("lang") || i18n.language || "ar";
  applyLang(lang);
  return lang;
}
