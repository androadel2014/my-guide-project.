// src/App.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Toaster } from "react-hot-toast";
import ProfilePage from "./components/ProfilePage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import CommunityView from "./components/community/CommunityView";
import PlaceDetailsView from "./components/PlaceDetailsView";

import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeView } from "./components/HomeView";
import { HomeFeedView } from "./components/feed/HomeFeedView";

import CVBuilderView from "./components/cvbuilder/CVBuilderView";
import { CVEditView } from "./components/CVEditView";
import { AuthView } from "./components/AuthView";
import { ProfileView } from "./components/ProfileView";
import { DetailPage } from "./components/DetailPage";
import { Footer } from "./components/Footer";
import { MobileNav, MobileMenuOverlay } from "./components/MobileNav";
import { StartView } from "./components/StartView";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function DetailPageWrapper({ lang }) {
  const { pageId } = useParams();

  // ✅ صفحات معروفة مش "تفاصيل"
  const knownPages = [
    "home",
    "cv_builder",
    "cv_edit",
    "auth",
    "profile",
    "start",
    "feed",
    "community",
  ];

  if (knownPages.includes(pageId)) return null;

  return <DetailPage page={pageId} lang={lang} />;
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function AppContent() {
  const [lang, setLang] = useState("ar");
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();

  // ✅ currentPage ذكي عشان الـ Sidebar/MobileNav مايتلغبطوش
  const currentPage = useMemo(() => {
    const p = location.pathname || "/";
    if (p === "/" || p === "/home") return "home";
    if (p.startsWith("/u/")) return "u";

    // ✅ FIX: أي حاجة تحت /community (including details) تفضل Community
    if (p === "/community" || p.startsWith("/community/")) return "community";

    return p.startsWith("/") ? p.substring(1) : p;
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen bg-[#f8fafc]"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <ScrollToTop />

      {/* ✅ Global Toaster (Professional) */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          style: {
            borderRadius: "16px",
            background: "#111827",
            color: "#fff",
            fontFamily: "inherit",
          },
        }}
        toastOptions={{
          duration: 2600,
          style: {
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            boxShadow:
              "0 10px 25px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.06)",
            fontFamily: "inherit",
            padding: "12px 14px",
            maxWidth: "420px",
          },
          success: {
            duration: 2200,
            style: {
              border: "1px solid rgba(16,185,129,0.25)",
            },
          },
          error: {
            duration: 3200,
            style: {
              border: "1px solid rgba(239,68,68,0.25)",
            },
          },
        }}
      />

      <Sidebar lang={lang} page={currentPage} />

      <div className="flex-1 lg:mr-72 flex flex-col min-h-screen">
        <Header lang={lang} setLang={setLang} />

        <main className="flex-1">
          <Routes>
            {/* ✅ Home */}
            <Route path="/" element={<HomeView lang={lang} />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* ✅ Public */}
            <Route path="/auth" element={<AuthView lang={lang} />} />
            <Route path="/start" element={<StartView lang={lang} />} />

            {/* ✅ Feed */}
            <Route path="/feed" element={<HomeFeedView />} />

            {/* ✅ Public Social Profile */}
            <Route path="/u/:userId" element={<ProfilePage lang={lang} />} />

            {/* ✅ Community */}
            <Route path="/community" element={<CommunityView />} />

            {/* ✅ Place details */}
            <Route
              path="/community/place/:placeId"
              element={<PlaceDetailsView lang={lang} />}
            />

            {/* ✅ Protected */}
            <Route
              path="/cv_builder"
              element={
                <ProtectedRoute>
                  <CVBuilderView lang={lang} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cv_edit"
              element={
                <ProtectedRoute>
                  <CVEditView lang={lang} />
                </ProtectedRoute>
              }
            />

            {/* ✅ Protected profile page */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileView lang={lang} />
                </ProtectedRoute>
              }
            />

            {/* ✅ Detail pages (dynamic content) */}
            <Route
              path="/:pageId"
              element={<DetailPageWrapper lang={lang} />}
            />

            {/* ✅ fallback (لازم يكون آخر حاجة) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer lang={lang} />
      </div>

      <MobileNav
        lang={lang}
        page={currentPage}
        toggleMenu={() => setMenuOpen(true)}
      />

      <MobileMenuOverlay
        lang={lang}
        isOpen={menuOpen}
        close={() => setMenuOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
