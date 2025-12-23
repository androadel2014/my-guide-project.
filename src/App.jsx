import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeView } from "./components/HomeView";
import { CVBuilderView } from "./components/CVBuilderView";
import { CVEditView } from "./components/CVEditView"; // ✅ اضفنا دي
import { AuthView } from "./components/AuthView";
import { ProfileView } from "./components/ProfileView";
import { DetailPage } from "./components/DetailPage";
import { Footer } from "./components/Footer";
import { MobileNav, MobileMenuOverlay } from "./components/MobileNav";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function DetailPageWrapper({ lang }) {
  const { pageId } = useParams();
  // ✅ ضيفنا cv_edit عشان ما يتعاملش كـ DetailPage
  const knownPages = ["home", "cv_builder", "cv_edit", "auth", "profile"];

  if (knownPages.includes(pageId)) return null;
  return <DetailPage page={pageId} lang={lang} />;
}

function AppContent() {
  const [lang, setLang] = useState("ar");
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const currentPage =
    location.pathname === "/" ? "home" : location.pathname.substring(1);

  return (
    <div
      className="flex min-h-screen bg-[#f8fafc]"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <ScrollToTop />

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: "16px",
            background: "#333",
            color: "#fff",
            fontFamily: "inherit",
          },
        }}
      />

      <Sidebar lang={lang} page={currentPage} />

      <div className="flex-1 lg:mr-72 flex flex-col min-h-screen">
        <Header lang={lang} setLang={setLang} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomeView lang={lang} />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            <Route path="/cv_builder" element={<CVBuilderView lang={lang} />} />

            {/* ✅ Route صفحة التعديل لازم يكون قبل /:pageId */}
            <Route path="/cv_edit" element={<CVEditView lang={lang} />} />

            <Route path="/auth" element={<AuthView lang={lang} />} />
            <Route path="/profile" element={<ProfileView lang={lang} />} />

            <Route
              path="/:pageId"
              element={<DetailPageWrapper lang={lang} />}
            />
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
