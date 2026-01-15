import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const CVEditView = ({ lang = "en" }) => {
  const navigate = useNavigate();

  const normLang = (v) => {
    const s = String(v || "en").toLowerCase();
    if (s.startsWith("ar")) return "ar";
    if (s.startsWith("es")) return "es";
    return "en";
  };
  const LKEY = normLang(lang);
  const dir = LKEY === "ar" ? "rtl" : "ltr";
  const BackIcon = LKEY === "ar" ? ArrowRight : ArrowLeft;

  const T = useMemo(() => {
    const base = {
      ar: {
        missingCvId: "cvId غير موجود",
        loginAgain: "لازم تسجّل دخول تاني",
        failedLoad: "فشل تحميل البيانات",
        failedSave: "فشل الحفظ",
        saved: "تم حفظ التعديلات ✅",
        loading: "جارٍ التحميل...",
        noData: "لا توجد بيانات لهذه السيرة",
        title: "تعديل السيرة الذاتية",
        back: "رجوع",
        save: "حفظ",
        saveChanges: "حفظ التعديلات",
        targetTitle: "الوظيفة المستهدفة",
        company: "الشركة",
        state: "الولاية/المكان",
        fullName: "الاسم",
        email: "الإيميل",
        phone: "الهاتف",
        address: "العنوان",
        summary: "الملخص",
        languages: "اللغات",
        skills: "المهارات (افصل بينهم بفاصلة ,)",
        education: "التعليم",
        courses: "الكورسات",
        experience: "الخبرات",
        add: "+ إضافة",
        remove: "حذف",
        degree: "Degree",
        major: "Major",
        school: "School",
        location: "Location",
        graduation: "Graduation (Month Year)",
        course: "Course",
        provider: "Provider",
        date: "Date",
        jobTitle: "Title",
        jobCompany: "Company",
        jobLocation: "Location",
        start: "Start",
        end: "End",
        desc: "Description (Arabic/English)",
        saveErrStatus: (s) => `فشل الحفظ (${s})`,
      },
      en: {
        missingCvId: "Missing cvId",
        loginAgain: "Please login again",
        failedLoad: "Failed to load",
        failedSave: "Save failed",
        saved: "Saved ✅",
        loading: "Loading...",
        noData: "No CV data found",
        title: "Edit Resume",
        back: "Back",
        save: "Save",
        saveChanges: "Save Changes",
        targetTitle: "Target Job Title",
        company: "Company",
        state: "State/Location",
        fullName: "Full Name",
        email: "Email",
        phone: "Phone",
        address: "Address",
        summary: "Summary",
        languages: "Languages",
        skills: "Skills (comma separated)",
        education: "Education",
        courses: "Courses",
        experience: "Experience",
        add: "+ Add",
        remove: "Remove",
        degree: "Degree",
        major: "Major",
        school: "School",
        location: "Location",
        graduation: "Graduation (Month Year)",
        course: "Course",
        provider: "Provider",
        date: "Date",
        jobTitle: "Title",
        jobCompany: "Company",
        jobLocation: "Location",
        start: "Start",
        end: "End",
        desc: "Description (Arabic/English)",
        saveErrStatus: (s) => `Save failed (${s})`,
      },
      es: {
        missingCvId: "Falta cvId",
        loginAgain: "Inicia sesión de nuevo",
        failedLoad: "No se pudo cargar",
        failedSave: "Falló al guardar",
        saved: "Guardado ✅",
        loading: "Cargando...",
        noData: "No se encontraron datos del CV",
        title: "Editar CV",
        back: "Volver",
        save: "Guardar",
        saveChanges: "Guardar cambios",
        targetTitle: "Puesto objetivo",
        company: "Empresa",
        state: "Estado/Ubicación",
        fullName: "Nombre completo",
        email: "Correo",
        phone: "Teléfono",
        address: "Dirección",
        summary: "Resumen",
        languages: "Idiomas",
        skills: "Habilidades (separadas por comas)",
        education: "Educación",
        courses: "Cursos",
        experience: "Experiencia",
        add: "+ Agregar",
        remove: "Eliminar",
        degree: "Título",
        major: "Especialidad",
        school: "Universidad",
        location: "Ubicación",
        graduation: "Graduación (Month Year)",
        course: "Curso",
        provider: "Proveedor",
        date: "Fecha",
        jobTitle: "Puesto",
        jobCompany: "Empresa",
        jobLocation: "Ubicación",
        start: "Inicio",
        end: "Fin",
        desc: "Descripción (Árabe/Inglés)",
        saveErrStatus: (s) => `Falló al guardar (${s})`,
      },
    };
    return base[LKEY] || base.en;
  }, [LKEY]);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const cvId = params.get("cvId");

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const arr = (v) => (Array.isArray(v) ? v : []);

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    "";

  const authHeaders = () => {
    const token = getToken();
    return { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const normalizeToCleanedData = (dbData) => {
    if (dbData?.personalInfo) {
      return {
        personalInfo: {
          fullName:
            dbData.personalInfo?.fullName || dbData.personal?.name || "",
          email: dbData.personalInfo?.email || dbData.personal?.email || "",
          phone: dbData.personalInfo?.phone || dbData.personal?.phone || "",
          address:
            dbData.personalInfo?.address || dbData.personal?.address || "",
        },
        summary: dbData.summary || "",
        experiences: arr(dbData.experiences || dbData.experience).map((j) => ({
          id: j.id || Date.now() + Math.random(),
          title: j.title || "",
          company: j.company || "",
          location: j.location || "",
          start: j.start || "",
          end: j.end || "",
          descriptionRaw:
            j.descriptionRaw ||
            (arr(j.bullets).length ? arr(j.bullets).join("\n") : ""),
        })),
        education: arr(dbData.education).map((e) => ({
          id: e.id || Date.now() + Math.random(),
          degree: e.degree || "",
          major: e.major || "",
          school: e.school || "",
          location: e.location || "",
          year: e.year || e.date || "",
        })),
        courses: arr(dbData.courses).map((c) => ({
          id: c.id || Date.now() + Math.random(),
          name: c.name || "",
          provider: c.provider || "",
          date: c.date || "",
        })),
        skills: arr(dbData.skills),
        languages: dbData.languages || "",
        targetJob: dbData.targetJob || {
          title: "Resume",
          company: "",
          state: "",
        },
      };
    }

    if (dbData?.name && (dbData?.experience || dbData?.experiences)) {
      const personalInfo = {
        fullName: dbData.name || "",
        address: "",
        phone: "",
        email: "",
      };

      const experiences = arr(dbData.experience || dbData.experiences).map(
        (j) => ({
          id: Date.now() + Math.random(),
          title: j.title || "",
          company: j.company || "",
          location: j.location || "",
          start: "",
          end: "",
          descriptionRaw: arr(j.bullets).length
            ? arr(j.bullets).join("\n")
            : "",
        })
      );

      const education = arr(dbData.education).map((e) => ({
        id: Date.now() + Math.random(),
        degree: e.degree || "",
        major: "",
        school: e.school || "",
        location: e.location || "",
        year: e.date || "",
      }));

      const courses = arr(dbData.courses).map((c) => ({
        id: Date.now() + Math.random(),
        name: c.name || "",
        provider: c.provider || "",
        date: c.date || "",
      }));

      return {
        personalInfo,
        summary: dbData.summary || "",
        experiences,
        education,
        courses,
        skills: arr(dbData.skills),
        languages: dbData.languages || "",
        targetJob: { title: "Resume", company: "", state: "" },
      };
    }

    return {
      targetJob: { title: "Resume", company: "", state: "" },
      personalInfo: { fullName: "", phone: "", email: "", address: "" },
      education: [],
      courses: [],
      experiences: [],
      languages: "",
      summary: "",
      skills: [],
    };
  };

  useEffect(() => {
    if (!cvId) {
      setLoading(false);
      toast.error(T.missingCvId);
      navigate("/profile", { replace: true });
      return;
    }

    (async () => {
      try {
        setLoading(true);

        const token = getToken();
        if (!token) {
          toast.error(T.loginAgain);
          navigate("/auth", { replace: true });
          return;
        }

        const res = await fetch(`${API_BASE}/api/get-cv/${cvId}`, {
          method: "GET",
          headers: { ...authHeaders() },
        });

        if (res.status === 404) {
          setData(null);
          return;
        }

        if (!res.ok) {
          let msg = "";
          try {
            const err = await res.json();
            msg = err?.message || "";
          } catch {}
          throw new Error(msg || `Request failed (${res.status})`);
        }

        const payload = await res.json();

        let raw = payload?.cv_data ?? payload;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch {}
        }

        setData(normalizeToCleanedData(raw));
      } catch (e) {
        toast.error(T.failedLoad + (e?.message ? `: ${e.message}` : ""));
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvId, LKEY]);

  // helpers
  const updatePersonal = (key, value) =>
    setData((p) => ({
      ...p,
      personalInfo: { ...(p?.personalInfo || {}), [key]: value },
    }));

  const updateField = (key, value) => setData((p) => ({ ...p, [key]: value }));

  const updateItem = (section, id, key, value) => {
    setData((p) => {
      const list = arr(p?.[section]);
      return {
        ...p,
        [section]: list.map((item) =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      };
    });
  };

  const addItem = (section, template) => {
    setData((p) => ({
      ...p,
      [section]: [
        ...arr(p?.[section]),
        { id: Date.now() + Math.random(), ...template },
      ],
    }));
  };

  const removeItem = (section, id) => {
    setData((p) => ({
      ...p,
      [section]: arr(p?.[section]).filter((i) => i.id !== id),
    }));
  };

  const saveEditedCV = async () => {
    try {
      const token = getToken();
      if (!token) {
        toast.error(T.loginAgain);
        navigate("/auth", { replace: true });
        return;
      }

      const payload = {
        cv_data: data,
        cv_name: data?.targetJob?.title || "Professional Resume",
      };

      const res = await fetch(`${API_BASE}/api/update-cv/${cvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });

      let responseJson = {};
      try {
        responseJson = await res.json();
      } catch {}

      if (!res.ok) {
        toast.error(responseJson?.message || T.saveErrStatus(res.status));
        return;
      }

      toast.success(T.saved);
      navigate("/profile", { replace: true });
    } catch (e) {
      toast.error(T.failedSave + (e?.message ? `: ${e.message}` : ""));
    }
  };

  if (loading) {
    return (
      <div className="p-14 sm:p-20 text-center font-bold text-slate-400">
        {T.loading}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-14 sm:p-20 text-center font-bold text-slate-500">
        {T.noData}
      </div>
    );
  }

  const skillsText = arr(data.skills).join(", ");

  const inputPad = dir === "rtl" ? "pr-4" : "pl-4";

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6" dir={dir}>
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-2xl font-black text-slate-800">{T.title}</h2>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate("/profile", { replace: true })}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border font-bold inline-flex items-center justify-center gap-2"
              type="button"
            >
              <BackIcon size={16} /> {T.back}
            </button>

            <button
              onClick={saveEditedCV}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 text-white font-black"
              type="button"
            >
              {T.save}
            </button>
          </div>
        </div>

        {/* TARGET JOB */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.targetTitle}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.targetJob?.title || ""}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  targetJob: { ...(p.targetJob || {}), title: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.company}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.targetJob?.company || ""}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  targetJob: {
                    ...(p.targetJob || {}),
                    company: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.state}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.targetJob?.state || ""}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  targetJob: { ...(p.targetJob || {}), state: e.target.value },
                }))
              }
            />
          </div>
        </div>

        {/* PERSONAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.fullName}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.personalInfo?.fullName || ""}
              onChange={(e) => updatePersonal("fullName", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.email}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.personalInfo?.email || ""}
              onChange={(e) => updatePersonal("email", e.target.value)}
              inputMode="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.phone}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.personalInfo?.phone || ""}
              onChange={(e) => updatePersonal("phone", e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.address}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.personalInfo?.address || ""}
              onChange={(e) => updatePersonal("address", e.target.value)}
              autoComplete="street-address"
            />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-5">
          <label className="text-xs font-bold text-slate-500">
            {T.summary}
          </label>
          <textarea
            className={classNames(
              "w-full p-3 border rounded-xl h-28",
              inputPad
            )}
            value={data.summary || ""}
            onChange={(e) => updateField("summary", e.target.value)}
          />
        </div>

        {/* LANGUAGES + SKILLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-5">
          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.languages}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={data.languages || ""}
              onChange={(e) => updateField("languages", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              {T.skills}
            </label>
            <input
              className={classNames("w-full p-3 border rounded-xl", inputPad)}
              value={skillsText}
              onChange={(e) =>
                updateField(
                  "skills",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>

        {/* EDUCATION */}
        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-800">{T.education}</h3>
            <button
              onClick={() =>
                addItem("education", {
                  degree: "",
                  major: "",
                  school: "",
                  location: "",
                  year: "",
                })
              }
              className="text-sm font-black text-blue-600"
              type="button"
            >
              {T.add}
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {arr(data.education).map((e) => (
              <div key={e.id} className="p-4 border rounded-2xl bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.degree}
                    value={e.degree || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "degree", ev.target.value)
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.major}
                    value={e.major || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "major", ev.target.value)
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.school}
                    value={e.school || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "school", ev.target.value)
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.location}
                    value={e.location || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "location", ev.target.value)
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.graduation}
                    value={e.year || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "year", ev.target.value)
                    }
                  />
                </div>

                <button
                  onClick={() => removeItem("education", e.id)}
                  className="mt-3 text-xs font-bold text-red-600"
                  type="button"
                >
                  {T.remove}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COURSES */}
        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-800">{T.courses}</h3>
            <button
              onClick={() =>
                addItem("courses", { name: "", provider: "", date: "" })
              }
              className="text-sm font-black text-blue-600"
              type="button"
            >
              {T.add}
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {arr(data.courses).map((c) => (
              <div key={c.id} className="p-4 border rounded-2xl bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.course}
                    value={c.name || ""}
                    onChange={(ev) =>
                      updateItem("courses", c.id, "name", ev.target.value)
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.provider}
                    value={c.provider || ""}
                    onChange={(ev) =>
                      updateItem("courses", c.id, "provider", ev.target.value)
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.date}
                    value={c.date || ""}
                    onChange={(ev) =>
                      updateItem("courses", c.id, "date", ev.target.value)
                    }
                  />
                </div>

                <button
                  onClick={() => removeItem("courses", c.id)}
                  className="mt-3 text-xs font-bold text-red-600"
                  type="button"
                >
                  {T.remove}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-800">{T.experience}</h3>
            <button
              onClick={() =>
                addItem("experiences", {
                  title: "",
                  company: "",
                  location: "",
                  start: "",
                  end: "",
                  descriptionRaw: "",
                })
              }
              className="text-sm font-black text-blue-600"
              type="button"
            >
              {T.add}
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {arr(data.experiences).map((j) => (
              <div key={j.id} className="p-4 border rounded-2xl bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.jobTitle}
                    value={j.title || ""}
                    onChange={(ev) =>
                      updateItem("experiences", j.id, "title", ev.target.value)
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.jobCompany}
                    value={j.company || ""}
                    onChange={(ev) =>
                      updateItem(
                        "experiences",
                        j.id,
                        "company",
                        ev.target.value
                      )
                    }
                  />
                  <input
                    className={classNames("p-2 border rounded-xl", inputPad)}
                    placeholder={T.jobLocation}
                    value={j.location || ""}
                    onChange={(ev) =>
                      updateItem(
                        "experiences",
                        j.id,
                        "location",
                        ev.target.value
                      )
                    }
                  />

                  <div className="flex gap-2">
                    <input
                      className={classNames(
                        "p-2 border rounded-xl w-full",
                        inputPad
                      )}
                      placeholder={T.start}
                      value={j.start || ""}
                      onChange={(ev) =>
                        updateItem(
                          "experiences",
                          j.id,
                          "start",
                          ev.target.value
                        )
                      }
                    />
                    <input
                      className={classNames(
                        "p-2 border rounded-xl w-full",
                        inputPad
                      )}
                      placeholder={T.end}
                      value={j.end || ""}
                      onChange={(ev) =>
                        updateItem("experiences", j.id, "end", ev.target.value)
                      }
                    />
                  </div>
                </div>

                <label className="text-xs font-bold text-slate-500 mt-3 block">
                  {T.desc}
                </label>
                <textarea
                  className={classNames(
                    "w-full p-3 border rounded-xl h-28",
                    inputPad
                  )}
                  value={j.descriptionRaw || ""}
                  onChange={(ev) =>
                    updateItem(
                      "experiences",
                      j.id,
                      "descriptionRaw",
                      ev.target.value
                    )
                  }
                />

                <button
                  onClick={() => removeItem("experiences", j.id)}
                  className="mt-3 text-xs font-bold text-red-600"
                  type="button"
                >
                  {T.remove}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveEditedCV}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 text-white font-black shadow"
            type="button"
          >
            {T.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

const classNames = (...arr) => arr.filter(Boolean).join(" ");
