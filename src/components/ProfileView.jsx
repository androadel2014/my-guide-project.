import React, { useEffect, useState } from "react";
import {
  User,
  Edit2,
  Trash2,
  Download,
  FileText,
  Plus,
  Briefcase,
  MapPin,
  Info,
  Eye,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";

// ✅ Download helpers
import html2pdf from "html2pdf.js";
import * as docx from "docx";
import { saveAs } from "file-saver";

export const ProfileView = ({ lang }) => {
  const [user, setUser] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cvId: null });

  // ✅ Preview modal (same design)
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    cvId: null,
    finalCV: null,
    title: "",
  });

  // ✅ download state (to show loading)
  const [downloading, setDownloading] = useState({
    cvId: null,
    format: null, // "pdf" | "word"
  });

  const [editData, setEditData] = useState({
    username: "",
    phone: "",
    address: "",
    bio: "",
  });

  // =========================
  // ✅ 1) FIX التاريخ (SQLite UTC)
  // =========================
  const parseSqliteUTC = (sqliteDateString) => {
    if (!sqliteDateString) return null;
    const iso = sqliteDateString.replace(" ", "T") + "Z";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  // =========================
  // ✅ 2) Normalize CV data from DB
  // =========================
  const normalizeCvData = (dbPayload) => {
    const raw = dbPayload?.cv_data ? dbPayload.cv_data : dbPayload;

    const personalInfo =
      raw?.personalInfo ||
      (raw?.personal
        ? {
            fullName: raw.personal.name || "",
            phone: raw.personal.phone || "",
            email: raw.personal.email || "",
            address: raw.personal.address || "",
          }
        : { fullName: "", phone: "", email: "", address: "" });

    const education = Array.isArray(raw?.education) ? raw.education : [];
    const courses = Array.isArray(raw?.courses) ? raw.courses : [];
    const experiences = Array.isArray(raw?.experiences)
      ? raw.experiences
      : Array.isArray(raw?.experience)
      ? raw.experience
      : [];

    const finalCV = {
      name: raw?.name || personalInfo.fullName || "RESUME",
      contact:
        raw?.contact ||
        `${personalInfo.address || ""} | ${personalInfo.phone || ""} | ${
          personalInfo.email || ""
        }`,
      summary: raw?.summary || "",
      languages: raw?.languages || "",
      education: education.map((e) => ({
        school: e.school || "",
        location: e.location || "",
        date: e.date || e.year || "",
        degree:
          e.degree && e.major ? `${e.degree} in ${e.major}` : e.degree || "",
      })),
      courses: courses.map((c) => ({
        name: c.name || "",
        provider: c.provider || "",
        date: c.date || "",
      })),
      experience: experiences.map((ex) => ({
        company: ex.company || "",
        location: ex.location || "",
        dates:
          ex.dates || `${ex.start || ""}${ex.end ? " - " + ex.end : ""}`.trim(),
        title: ex.title || "",
        bullets: Array.isArray(ex.bullets)
          ? ex.bullets
          : Array.isArray(ex.description)
          ? ex.description
          : ex.descriptionRaw
          ? String(ex.descriptionRaw)
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      })),
      skills: Array.isArray(raw?.skills) ? raw.skills : [],
    };

    return finalCV;
  };

  // =========================
  // ✅ BUILDER-EXACT HELPERS
  // =========================

  // ✅ sanitizeContact (same as builder idea)
  const sanitizeContact = (raw) => {
    if (!raw) return "";

    let s = String(raw);

    // [email](mailto:email) -> email
    s = s.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/gi, "$1");
    s = s.replace(/\(mailto:[^)]+\)/gi, "");
    s = s.replace(/mailto:/gi, "");

    // trim pipes
    s = s
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean)
      .join(" | ");

    // collapse spaces
    s = s.replace(/\s{2,}/g, " ").trim();
    return s;
  };

  // ✅ PDF-only styles (same approach as builder)
  const buildPdfCloneWithStyles = (element) => {
    const clone = element.cloneNode(true);
    clone.classList.add("pdf-export");

    const style = document.createElement("style");
    style.innerHTML = `
      .pdf-export {
        width: 816px; /* letter @ 96dpi */
        background: #ffffff;
        padding: 0;
        margin: 0;
        font-family: "Times New Roman", Times, serif;
        color: #0f172a;
      }
      #cv-document .contact-info{
          margin:0px ;
          margin-top:30px;
      }
      .pdf-export .cv-header {
        padding: 26px 32px 10px 32px;
        text-align: center;
      }
      .pdf-export .header-name {
        font-size: 46px;
        font-weight: 700;
        line-height: 1.05;
        margin: 0 0 12px 0;
      }

      .pdf-export .contact-info {
        display: block;
        text-align: center;
        font-size: 16px;
        padding: 10px 14px;
        margin: 0 32px 18px 32px;
        background: #e2e8f0;
        border-radius: 0;
        line-height: 1.25;
        word-break: break-word;
      }

      .pdf-export .cv-body {
        padding: 0 32px 28px 32px;
        font-size: 14px;
        line-height: 1.45;
      }

      .pdf-export .section-title {
        margin-bottom: 10px;
        padding: 8px 12px;
        background: #f1f5f9;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .02em;
        border-bottom: 2px solid #cbd5e1;
      }

      .pdf-export .row-header,
      .pdf-export .course-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-weight: 700;
      }

      .pdf-export .row-subheader {
        font-style: italic;
        margin-top: 4px;
        margin-bottom: 6px;
      }

      .pdf-export .standard-list {
        margin: 6px 0 0 18px;
        padding: 0;
      }

      .pdf-export .standard-list li {
        margin: 0 0 6px 0;
      }

      .pdf-export .skills-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 18px;
      }
      .pdf-export .skill-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pdf-export .skill-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #0f172a;
        display: inline-block;
      }
    `;

    clone.prepend(style);
    return clone;
  };

  // ✅ build SAME builder markup (بدون عرض)
  const buildCvDocumentNode = (finalCV) => {
    const container = document.createElement("div");
    container.id = "cv-document";

    const header = document.createElement("div");
    header.className = "cv-header";

    const nameDiv = document.createElement("div");
    nameDiv.className = "header-name";
    nameDiv.textContent = finalCV?.name || "RESUME";

    const contactDiv = document.createElement("div");
    contactDiv.className = "contact-info";
    contactDiv.textContent = sanitizeContact(finalCV?.contact || "");

    header.appendChild(nameDiv);
    header.appendChild(contactDiv);

    const body = document.createElement("div");
    body.className = "cv-body";

    // Summary
    if (finalCV?.summary) {
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = "Professional Summary";

      const p = document.createElement("div");
      p.textContent = finalCV.summary;

      body.appendChild(title);
      body.appendChild(p);
    }

    // Education
    if (Array.isArray(finalCV?.education) && finalCV.education.length > 0) {
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = "Education";
      body.appendChild(title);

      finalCV.education.forEach((edu) => {
        const block = document.createElement("div");
        block.style.marginBottom = "10px";

        const row = document.createElement("div");
        row.className = "row-header";

        const left = document.createElement("div");
        left.textContent = `${edu.school || ""}${
          edu.location ? ", " + edu.location : ""
        }`;

        const right = document.createElement("div");
        right.textContent = edu.date || "";

        row.appendChild(left);
        row.appendChild(right);

        const deg = document.createElement("div");
        deg.textContent = edu.degree || "";

        block.appendChild(row);
        block.appendChild(deg);

        body.appendChild(block);
      });
    }

    // Courses
    if (Array.isArray(finalCV?.courses) && finalCV.courses.length > 0) {
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = "Relevant Courses";
      body.appendChild(title);

      finalCV.courses.forEach((course) => {
        const row = document.createElement("div");
        row.className = "course-row";
        row.style.marginBottom = "6px";

        const left = document.createElement("div");
        left.innerHTML = `<b>${String(course.name || "")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</b>${
          course.provider
            ? " – " +
              String(course.provider || "")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
            : ""
        }`;

        const right = document.createElement("div");
        right.textContent = course.date || "";

        row.appendChild(left);
        row.appendChild(right);

        body.appendChild(row);
      });
    }

    // Experience
    if (Array.isArray(finalCV?.experience) && finalCV.experience.length > 0) {
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = "Work Experience";
      body.appendChild(title);

      finalCV.experience.forEach((exp) => {
        const block = document.createElement("div");
        block.style.marginBottom = "14px";

        const row = document.createElement("div");
        row.className = "row-header";

        const left = document.createElement("div");
        left.textContent = `${exp.company || ""}${
          exp.location ? ", " + exp.location : ""
        }`;

        const right = document.createElement("div");
        right.textContent = exp.dates || "";

        row.appendChild(left);
        row.appendChild(right);

        const sub = document.createElement("div");
        sub.className = "row-subheader";
        sub.textContent = exp.title || "";

        block.appendChild(row);
        block.appendChild(sub);

        const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
        if (bullets.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "standard-list";
          bullets.forEach((b) => {
            const li = document.createElement("li");
            li.textContent = String(b || "");
            ul.appendChild(li);
          });
          block.appendChild(ul);
        }

        body.appendChild(block);
      });
    }

    // Skills
    if (
      (Array.isArray(finalCV?.skills) && finalCV.skills.length > 0) ||
      finalCV?.languages
    ) {
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = "Skills";
      body.appendChild(title);

      if (finalCV.languages) {
        const p = document.createElement("div");
        p.style.marginBottom = "8px";
        p.innerHTML = `<b>Languages:</b> ${String(finalCV.languages || "")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}`;
        body.appendChild(p);
      }

      if (Array.isArray(finalCV.skills) && finalCV.skills.length > 0) {
        const grid = document.createElement("div");
        grid.className = "skills-grid";

        finalCV.skills.forEach((skill) => {
          const item = document.createElement("div");
          item.className = "skill-item";

          const dot = document.createElement("span");
          dot.className = "skill-dot";

          const text = document.createElement("span");
          text.textContent = skill;

          item.appendChild(dot);
          item.appendChild(text);

          grid.appendChild(item);
        });

        body.appendChild(grid);
      }
    }

    container.appendChild(header);
    container.appendChild(body);
    return container;
  };

  // =========================
  // ✅ PDF download (BUILDER-EXACT)
  // =========================
  const downloadPDFSamePage = async (finalCV) => {
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    document.body.appendChild(tempContainer);

    const cvNode = buildCvDocumentNode(finalCV);
    const clone = buildPdfCloneWithStyles(cvNode);
    tempContainer.appendChild(clone);

    const safeName =
      (finalCV?.name || "Resume").replace(/\s+/g, "_") || "Resume";

    const opt = {
      margin: 0,
      filename: `${safeName}_Resume.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: 0,
        y: 0,
      },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(clone).save();
    } finally {
      try {
        document.body.removeChild(tempContainer);
      } catch {}
    }
  };

  // =========================
  // ✅ WORD download (same logic + sanitizeContact)
  // =========================
  const downloadWordSamePage = async (finalCV) => {
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Tab,
      TabStopType,
      ShadingType,
      AlignmentType,
    } = docx;

    const font = "Times New Roman";
    const RIGHT_TAB_POS = 10800;
    const MID_TAB_POS = 5200;

    const createHeader = (text) =>
      new Paragraph({
        children: [
          new TextRun({
            text: (text || "").toUpperCase(),
            bold: true,
            font,
            size: 24,
          }),
        ],
        spacing: { before: 300, after: 240, line: 420 },
        border: {
          bottom: { color: "auto", space: 1, value: "single", size: 6 },
        },
        shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
      });

    const sections = [];

    // HEADER
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: finalCV.name || "RESUME",
            bold: true,
            size: 56,
            font,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: sanitizeContact(finalCV.contact || ""),
            size: 35,
            font,
          }),
        ],
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.CLEAR, fill: "E2E8F0" },
        spacing: { after: 300 },
      })
    );

    // SUMMARY
    if (finalCV.summary) {
      sections.push(createHeader("Professional Summary"));
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: finalCV.summary, font, size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }

    // EDUCATION
    if (finalCV.education?.length) {
      sections.push(createHeader("Education"));
      finalCV.education.forEach((edu) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${edu.school || ""}${
                  edu.location ? ", " + edu.location : ""
                }`,
                bold: true,
                font,
                size: 24,
              }),
              new TextRun({
                children: [new Tab(), edu.date || ""],
                bold: true,
                font,
                size: 24,
              }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_POS }],
          })
        );
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: edu.degree || "", font, size: 24 })],
            spacing: { after: 120 },
          })
        );
      });
    }

    // COURSES
    if (finalCV.courses?.length) {
      sections.push(createHeader("Relevant Courses"));
      finalCV.courses.forEach((course) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${course.name || ""}${
                  course.provider ? " – " + course.provider : ""
                }`,
                bold: true,
                font,
                size: 24,
              }),
              new TextRun({
                children: [new Tab(), course.date || ""],
                bold: true,
                font,
                size: 24,
              }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_POS }],
            spacing: { after: 60 },
          })
        );
      });
    }

    // EXPERIENCE
    if (finalCV.experience?.length) {
      sections.push(createHeader("Work Experience"));
      finalCV.experience.forEach((job) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${job.company || ""}${
                  job.location ? ", " + job.location : ""
                }`,
                bold: true,
                font,
                size: 24,
              }),
              new TextRun({
                children: [new Tab(), job.dates || ""],
                bold: true,
                font,
                size: 24,
              }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_POS }],
          })
        );

        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.title || "",
                italics: true,
                font,
                size: 24,
              }),
            ],
            spacing: { after: 60 },
          })
        );

        (job.bullets || []).forEach((b) =>
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${String(b || "")
                    .replace(/^-|\*/, "")
                    .trim()}`,
                  font,
                  size: 24,
                }),
              ],
              spacing: { after: 40 },
            })
          )
        );

        sections.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      });
    }

    // SKILLS
    if (finalCV.skills?.length || finalCV.languages) {
      sections.push(createHeader("Skills"));

      if (finalCV.languages) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Languages: ", bold: true, font, size: 24 }),
              new TextRun({ text: finalCV.languages, font, size: 24 }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      const skills = Array.isArray(finalCV.skills) ? finalCV.skills : [];
      for (let i = 0; i < skills.length; i += 2) {
        const left = skills[i] ? `• ${skills[i]}` : "";
        const right = skills[i + 1] ? `• ${skills[i + 1]}` : "";

        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: left, font, size: 24 }),
              new TextRun({ children: [new Tab(), right], font, size: 24 }),
            ],
            tabStops: [{ type: TabStopType.LEFT, position: MID_TAB_POS }],
            spacing: { after: 40 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
          },
          children: sections,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const safeName =
      (finalCV.name || "Resume").replace(/\s+/g, "_") || "Resume";
    saveAs(blob, `${safeName}.docx`);
  };

  // =========================
  // ✅ Fetch CV then download (same page)
  // =========================
  const handleDownloadSamePage = async (cvId, format) => {
    try {
      setDownloading({ cvId, format });

      const res = await fetch(`http://localhost:5000/api/get-cv/${cvId}`);
      if (!res.ok) throw new Error("Failed to load CV");

      const payload = await res.json();
      const finalCV = normalizeCvData(payload);

      if (format === "pdf") {
        await downloadPDFSamePage(finalCV);
      } else {
        await downloadWordSamePage(finalCV);
      }

      toast.success(
        lang === "ar" ? "تم التحميل ✅" : "Downloaded successfully ✅"
      );
    } catch (e) {
      console.error(e);
      toast.error(lang === "ar" ? "فشل التحميل" : "Download failed");
    } finally {
      setDownloading({ cvId: null, format: null });
    }
  };

  // =========================
  // ✅ Preview CV (modal) نفس الديزاين
  // =========================
  const handlePreviewCV = async (cvId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/get-cv/${cvId}`);
      if (!res.ok) throw new Error("Failed to load CV");

      const payload = await res.json();
      const finalCV = normalizeCvData(payload);

      setPreviewModal({
        isOpen: true,
        cvId,
        finalCV,
        title: finalCV?.name || "RESUME",
      });
    } catch (e) {
      console.error(e);
      toast.error(lang === "ar" ? "فشل فتح المعاينة" : "Preview failed");
    }
  };

  const closePreview = () =>
    setPreviewModal({ isOpen: false, cvId: null, finalCV: null, title: "" });

  // =========================
  // ✅ Duplicate CV (UI only)
  // =========================
  const handleDuplicateUI = (cv) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " "); // sqlite-like
    const copy = {
      ...cv,
      id: `tmp_${Date.now()}`, // UI only unique key
      cv_name: `${cv.cv_name || "Resume"} (Copy)`,
      last_updated: now,
    };

    setCvList((prev) => [copy, ...(prev || [])]);
    toast.success(lang === "ar" ? "تم عمل نسخة ✅" : "Duplicated ✅");
  };

  // =========================
  // ✅ Load user + list
  // =========================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setEditData({
          username: userData.username || "",
          phone: userData.phone || "",
          address: userData.address || "",
          bio: userData.bio || "",
        });
        fetchUserCVs(userData.id);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  const fetchUserCVs = async (userId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/get-all-cvs/${userId}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setCvList(data);
    } catch (err) {
      console.error("Error fetching CVs:", err);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, id: user.id }),
      });

      if (response.ok) {
        toast.success(lang === "ar" ? "تم تحديث البيانات" : "Profile Updated");
        const updatedUser = { ...user, ...editData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/delete-cv/${deleteModal.cvId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success(
          lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully"
        );
        setCvList((prev) => prev.filter((cv) => cv.id !== deleteModal.cvId));
        setDeleteModal({ isOpen: false, cvId: null });
      }
    } catch (error) {
      toast.error("Error deleting CV");
    }
  };

  if (!user)
    return (
      <div className="p-20 text-center font-bold text-slate-400">
        Please login
      </div>
    );

  // ✅ Sorting: آخر تعديل فوق
  const sortedCvList = [...(cvList || [])].sort((a, b) => {
    const da = parseSqliteUTC(a.last_updated)?.getTime() || 0;
    const db = parseSqliteUTC(b.last_updated)?.getTime() || 0;
    return db - da;
  });

  return (
    <div
      className={`max-w-4xl mx-auto p-6 relative ${
        lang === "ar" ? "rtl" : "ltr"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* ✅ Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 truncate">
                  {lang === "ar" ? "معاينة السيرة الذاتية" : "Preview CV"} —{" "}
                  {previewModal.title}
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  {lang === "ar"
                    ? "نفس التصميم بالظبط"
                    : "Exact same design (builder-safe)"}
                </p>
              </div>

              <button
                onClick={closePreview}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all"
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>

            <div className="p-6 bg-slate-50">
              <div className="overflow-auto">
                <div className="mx-auto w-fit bg-white shadow-lg">
                  {/* ✅ نفس ستايل البلدر */}
                  <style>{`
                    #cv-document {
                      width: 816px;
                      background: #ffffff;
                      font-family: "Times New Roman", Times, serif;
                      color: #0f172a;
                    }
                    #cv-document .cv-header { padding: 26px 32px 10px 32px; text-align:center; }
                    #cv-document .header-name { font-size: 46px; font-weight: 700; line-height: 1.05; margin: 0 0 12px 0; }
                    #cv-document .contact-info { display:block; text-align:center; font-size:16px; padding:10px 14px; margin:0 32px 18px 32px; background:#e2e8f0; line-height:1.25; word-break:break-word; }
                    #cv-document .cv-body { padding: 0 32px 28px 32px; font-size: 14px; line-height: 1.45; }
                    #cv-document .section-title { margin-bottom: 10px; padding: 8px 12px; background:#f1f5f9; font-weight:700; text-transform:uppercase; letter-spacing:.02em; border-bottom:2px solid #cbd5e1; }
                    #cv-document .row-header, #cv-document .course-row { display:flex; justify-content:space-between; gap:16px; font-weight:700; }
                    #cv-document .row-subheader { font-style: italic; margin-top:4px; margin-bottom:6px; }
                    #cv-document .standard-list { margin: 6px 0 0 18px; padding:0; }
                    #cv-document .standard-list li { margin: 0 0 6px 0; }
                    #cv-document .skills-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 18px; }
                    #cv-document .skill-item { display:flex; align-items:center; gap:8px; }
                    #cv-document .skill-dot { width:6px; height:6px; border-radius:999px; background:#0f172a; display:inline-block; }
                  `}</style>

                  <div
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const node = buildCvDocumentNode(previewModal.finalCV);
                        return node.outerHTML;
                      })(),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال الحذف الاحترافي */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-800 mb-2">
              {lang === "ar" ? "متأكد من الحذف؟" : "Confirm Delete"}
            </h3>
            <p className="text-slate-500 text-center mb-6">
              {lang === "ar"
                ? "سيتم مسح هذا السي في نهائياً."
                : "This will be permanently removed."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, cvId: null })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-200"
              >
                {lang === "ar" ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <User size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black">{user.username}</h2>
              <p className="opacity-80 font-medium">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
          >
            {isEditing
              ? lang === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : lang === "ar"
              ? "تعديل البروفايل"
              : "Edit Profile"}
          </button>
        </div>

        <div className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} />{" "}
                {lang === "ar" ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                disabled={!isEditing}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-60"
                value={editData.username}
                onChange={(e) =>
                  setEditData({ ...editData, username: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Edit2 size={14} />{" "}
                {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
              </label>
              <input
                disabled={!isEditing}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-60"
                value={editData.phone}
                onChange={(e) =>
                  setEditData({ ...editData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> {lang === "ar" ? "العنوان" : "Address"}
              </label>
              <input
                disabled={!isEditing}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-60"
                value={editData.address}
                onChange={(e) =>
                  setEditData({ ...editData, address: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> {lang === "ar" ? "نبذة شخصية" : "Bio"}
              </label>
              <textarea
                disabled={!isEditing}
                rows="3"
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-60 resize-none"
                value={editData.bio}
                onChange={(e) =>
                  setEditData({ ...editData, bio: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-12 pt-10 border-t-2 border-slate-50">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Briefcase className="text-blue-600" />
                {lang === "ar" ? "إدارة السير الذاتية" : "Resume Management"}
              </h3>

              <button
                onClick={() => (window.location.href = "/cv_builder")}
                className="flex items-center gap-2 text-blue-600 font-black hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
              >
                <Plus size={20} /> {lang === "ar" ? "إنشاء جديد" : "Create New"}
              </button>
            </div>

            <div className="grid gap-4">
              {sortedCvList.length > 0 ? (
                sortedCvList.map((cv) => {
                  const d = parseSqliteUTC(cv.last_updated);
                  const safeDate = d
                    ? d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : cv.last_updated || "";

                  const isPdfLoading =
                    downloading.cvId === cv.id && downloading.format === "pdf";
                  const isWordLoading =
                    downloading.cvId === cv.id && downloading.format === "word";

                  return (
                    <div
                      key={cv.id}
                      className="group flex flex-col sm:flex-row items-center justify-between bg-white border-2 border-slate-100 p-6 rounded-[2rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all gap-4"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg uppercase leading-tight">
                            {cv.cv_name || "Resume #" + cv.id}
                          </h4>
                          <p className="text-xs text-slate-400 font-bold tracking-widest mt-1">
                            {safeDate}
                          </p>

                          {/* ✅ Badges */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-black tracking-wide">
                              ATS Safe
                            </span>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-black tracking-wide">
                              1 Page
                            </span>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-black tracking-wide">
                              US Format
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* ✅ PREVIEW */}
                        <button
                          onClick={() => handlePreviewCV(cv.id)}
                          className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-700 hover:text-white transition-all"
                          title={lang === "ar" ? "معاينة" : "Preview"}
                        >
                          <Eye size={20} />
                        </button>

                        {/* ✅ DUPLICATE (UI only) */}
                        <button
                          onClick={() => handleDuplicateUI(cv)}
                          className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                          title={lang === "ar" ? "عمل نسخة" : "Duplicate"}
                        >
                          <Copy size={20} />
                        </button>

                        {/* ✅ EDIT */}
                        <button
                          onClick={() =>
                            (window.location.href = `/cv_edit?cvId=${cv.id}`)
                          }
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          title={lang === "ar" ? "تعديل" : "Edit"}
                        >
                          <Edit2 size={20} />
                        </button>

                        {/* ✅ PDF download - BUILDER-EXACT */}
                        <button
                          disabled={isPdfLoading || isWordLoading}
                          onClick={() => handleDownloadSamePage(cv.id, "pdf")}
                          className={`p-3 rounded-xl transition-all ${
                            isPdfLoading
                              ? "bg-red-100 text-red-400 cursor-not-allowed"
                              : "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                          }`}
                          title={lang === "ar" ? "تحميل PDF" : "Download PDF"}
                        >
                          <Download size={20} />
                        </button>

                        {/* ✅ WORD download - BUILDER-EXACT */}
                        <button
                          disabled={isPdfLoading || isWordLoading}
                          onClick={() => handleDownloadSamePage(cv.id, "word")}
                          className={`p-3 rounded-xl transition-all ${
                            isWordLoading
                              ? "bg-emerald-100 text-emerald-400 cursor-not-allowed"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                          }`}
                          title={lang === "ar" ? "تحميل Word" : "Download Word"}
                        >
                          <FileText size={20} />
                        </button>

                        {/* ✅ DELETE */}
                        <button
                          onClick={() =>
                            setDeleteModal({ isOpen: true, cvId: cv.id })
                          }
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                          title={lang === "ar" ? "حذف" : "Delete"}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[3rem]">
                  <FileText className="mx-auto text-slate-200 mb-4" size={64} />
                  <p className="text-slate-400 font-bold text-lg mb-6">
                    {lang === "ar"
                      ? "لا تمتلك أي سيرة ذاتية بعد"
                      : "No resumes yet"}
                  </p>
                  <button
                    onClick={() => (window.location.href = "/cv_builder")}
                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-105 transition-all"
                  >
                    {lang === "ar" ? "ابدأ الآن" : "Start Now"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
