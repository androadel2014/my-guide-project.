import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export const CVEditView = ({ lang }) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const cvId = params.get("cvId");

  const [loading, setLoading] = useState(true);

  // ✅ نخزن data بالشكل اللي CVBuilder بيشتغل بيه (cleanedData)
  const [data, setData] = useState(null);

  const arr = (v) => (Array.isArray(v) ? v : []);

  // ✅ Normalize any db data to cleanedData
  const normalizeToCleanedData = (dbData) => {
    // لو already cleanedData (خففنا الشرط)
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

    // لو dbData هو finalCV (name/contact/experience bullets)
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

    // fallback
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
      toast.error(lang === "ar" ? "cvId غير موجود" : "Missing cvId");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/get-cv/${cvId}`);
        if (!res.ok) throw new Error("Failed");
        const payload = await res.json();

        // ✅ handle wrappers + json string
        let raw = payload?.cv_data ?? payload;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch {}
        }

        setData(normalizeToCleanedData(raw));
      } catch (e) {
        toast.error(lang === "ar" ? "فشل تحميل البيانات" : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [cvId, lang]);

  // --------- helpers to edit cleanedData ---------
  const updatePersonal = (key, value) =>
    setData((p) => ({
      ...p,
      personalInfo: { ...(p.personalInfo || {}), [key]: value },
    }));

  const updateField = (key, value) => setData((p) => ({ ...p, [key]: value }));

  const updateItem = (section, id, key, value) => {
    setData((p) => {
      const list = arr(p[section]);
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
        ...arr(p[section]),
        { id: Date.now() + Math.random(), ...template },
      ],
    }));
  };

  const removeItem = (section, id) => {
    setData((p) => ({
      ...p,
      [section]: arr(p[section]).filter((i) => i.id !== id),
    }));
  };

  // ✅ Save as cleanedData (to keep CVBuilder downloads working)
  const saveEditedCV = async () => {
    try {
      const payload = {
        cv_data: data,
        cv_name: data?.targetJob?.title || "Professional Resume",
      };

      const res = await fetch(`http://localhost:5000/api/update-cv/${cvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");

      toast.success(lang === "ar" ? "تم حفظ التعديلات ✅" : "Saved ✅");
      window.location.href = "/profile";
    } catch (e) {
      toast.error(lang === "ar" ? "فشل الحفظ" : "Save failed");
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center font-bold text-slate-400">
        Loading...
      </div>
    );

  if (!data)
    return (
      <div className="p-20 text-center font-bold text-red-500">
        {lang === "ar" ? "لا توجد بيانات" : "No data"}
      </div>
    );

  const skillsText = arr(data.skills).join(", ");

  return (
    <div className="max-w-5xl mx-auto p-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-2xl shadow border border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-black text-slate-800">
            {lang === "ar" ? "تعديل السيرة الذاتية" : "Edit Resume"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => (window.location.href = "/profile")}
              className="px-4 py-2 rounded-xl border font-bold"
            >
              {lang === "ar" ? "رجوع" : "Back"}
            </button>
            <button
              onClick={saveEditedCV}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-black"
            >
              {lang === "ar" ? "حفظ" : "Save"}
            </button>
          </div>
        </div>

        {/* TARGET JOB */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-500">
              {lang === "ar" ? "الوظيفة المستهدفة" : "Target Job Title"}
            </label>
            <input
              className="w-full p-3 border rounded-xl"
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
              {lang === "ar" ? "الشركة" : "Company"}
            </label>
            <input
              className="w-full p-3 border rounded-xl"
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
              {lang === "ar" ? "الولاية/المكان" : "State/Location"}
            </label>
            <input
              className="w-full p-3 border rounded-xl"
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
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500">
              {lang === "ar" ? "الاسم" : "Full Name"}
            </label>
            <input
              className="w-full p-3 border rounded-xl"
              value={data.personalInfo?.fullName || ""}
              onChange={(e) => updatePersonal("fullName", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Email</label>
            <input
              className="w-full p-3 border rounded-xl"
              value={data.personalInfo?.email || ""}
              onChange={(e) => updatePersonal("email", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">
              {lang === "ar" ? "الهاتف" : "Phone"}
            </label>
            <input
              className="w-full p-3 border rounded-xl"
              value={data.personalInfo?.phone || ""}
              onChange={(e) => updatePersonal("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">
              {lang === "ar" ? "العنوان" : "Address"}
            </label>
            <input
              className="w-full p-3 border rounded-xl"
              value={data.personalInfo?.address || ""}
              onChange={(e) => updatePersonal("address", e.target.value)}
            />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-5">
          <label className="text-xs font-bold text-slate-500">Summary</label>
          <textarea
            className="w-full p-3 border rounded-xl h-28"
            value={data.summary || ""}
            onChange={(e) => updateField("summary", e.target.value)}
          />
        </div>

        {/* LANGUAGES + SKILLS */}
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="text-xs font-bold text-slate-500">
              Languages
            </label>
            <input
              className="w-full p-3 border rounded-xl"
              value={data.languages || ""}
              onChange={(e) => updateField("languages", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              Skills (comma separated)
            </label>
            <input
              className="w-full p-3 border rounded-xl"
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
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800">Education</h3>
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
            >
              + Add
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {arr(data.education).map((e) => (
              <div key={e.id} className="p-4 border rounded-2xl bg-slate-50">
                <div className="grid md:grid-cols-5 gap-2">
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Degree"
                    value={e.degree || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "degree", ev.target.value)
                    }
                  />
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Major"
                    value={e.major || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "major", ev.target.value)
                    }
                  />
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="School"
                    value={e.school || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "school", ev.target.value)
                    }
                  />
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Location"
                    value={e.location || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "location", ev.target.value)
                    }
                  />
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Graduation (Month Year)"
                    value={e.year || ""}
                    onChange={(ev) =>
                      updateItem("education", e.id, "year", ev.target.value)
                    }
                  />
                </div>

                <button
                  onClick={() => removeItem("education", e.id)}
                  className="mt-3 text-xs font-bold text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COURSES */}
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800">Courses</h3>
            <button
              onClick={() =>
                addItem("courses", { name: "", provider: "", date: "" })
              }
              className="text-sm font-black text-blue-600"
            >
              + Add
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {arr(data.courses).map((c) => (
              <div key={c.id} className="p-4 border rounded-2xl bg-slate-50">
                <div className="grid md:grid-cols-3 gap-2">
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Course"
                    value={c.name || ""}
                    onChange={(ev) =>
                      updateItem("courses", c.id, "name", ev.target.value)
                    }
                  />
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Provider"
                    value={c.provider || ""}
                    onChange={(ev) =>
                      updateItem("courses", c.id, "provider", ev.target.value)
                    }
                  />
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Date"
                    value={c.date || ""}
                    onChange={(ev) =>
                      updateItem("courses", c.id, "date", ev.target.value)
                    }
                  />
                </div>

                <button
                  onClick={() => removeItem("courses", c.id)}
                  className="mt-3 text-xs font-bold text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800">Experience</h3>
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
            >
              + Add
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {arr(data.experiences).map((j) => (
              <div key={j.id} className="p-4 border rounded-2xl bg-slate-50">
                <div className="grid md:grid-cols-4 gap-2">
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Title"
                    value={j.title || ""}
                    onChange={(ev) =>
                      updateItem("experiences", j.id, "title", ev.target.value)
                    }
                  />
                  <input
                    className="p-2 border rounded-xl"
                    placeholder="Company"
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
                    className="p-2 border rounded-xl"
                    placeholder="Location"
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
                      className="p-2 border rounded-xl w-full"
                      placeholder="Start"
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
                      className="p-2 border rounded-xl w-full"
                      placeholder="End"
                      value={j.end || ""}
                      onChange={(ev) =>
                        updateItem("experiences", j.id, "end", ev.target.value)
                      }
                    />
                  </div>
                </div>

                <label className="text-xs font-bold text-slate-500 mt-3 block">
                  Description (Arabic/English)
                </label>
                <textarea
                  className="w-full p-3 border rounded-xl h-28"
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
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveEditedCV}
            className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black shadow"
          >
            {lang === "ar" ? "حفظ التعديلات" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
