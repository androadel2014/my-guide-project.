// src/components/cvbuilder/StepInput.jsx
import React from "react";
import { Save, Trash2, Plus, Globe, Bot } from "lucide-react";

export function StepInput({
  lang,
  data,
  history,
  resumeScore,
  scoreLabel,
  Tooltip,

  // handlers
  addToHistory,
  updateData,
  updateTarget,
  addItem,
  removeItem,
  updateItem,
  clearData,

  // experience helpers
  getExperienceArray,
  addHomeCountryExp,

  // optimize JD
  optimizeForJD,
  setOptimizeForJD,
  jobDescription,
  setJobDescription,

  // main action
  onPreparePrompt,
  activeTab,
  setActiveTab,
}) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-100 animate-[fadeIn_0.3s]">
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-2 text-sm text-green-700 items-center font-bold">
          <Save size={18} /> حفظ تلقائي + تنسيق مضمون
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            Resume Score:
          </span>
          <Tooltip text="Rule-based score: contact + title + education + experience + details">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border ${
                resumeScore >= 85
                  ? "bg-green-50 text-green-700 border-green-200"
                  : resumeScore >= 70
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-yellow-50 text-yellow-800 border-yellow-200"
              }`}
            >
              {resumeScore}/100 • {scoreLabel}
            </span>
          </Tooltip>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-full">
          <button
            onClick={() => setActiveTab("input")}
            className={`px-6 py-2 rounded-full font-bold text-sm transition ${
              activeTab === "input"
                ? "bg-white shadow text-blue-600"
                : "text-slate-500"
            }`}
          >
            1. البيانات
          </button>
          <button
            onClick={() => setActiveTab("process")}
            className={`px-6 py-2 rounded-full font-bold text-sm transition ${
              activeTab === "process"
                ? "bg-white shadow text-purple-600"
                : "text-slate-500"
            }`}
          >
            2. المعالجة
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-2 rounded-full font-bold text-sm transition ${
              activeTab === "preview"
                ? "bg-white shadow text-green-600"
                : "text-slate-500"
            }`}
          >
            3. التحميل
          </button>
        </div>

        <button
          onClick={clearData}
          className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 px-3 py-1 rounded-lg"
        >
          حذف البيانات
        </button>
      </div>

      <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8">
        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
          🎯 الوظيفة المستهدفة
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              المسمى الوظيفي
            </label>
            <input
              className="p-3 border rounded-lg bg-white w-full"
              list="list-jobs"
              value={data.targetJob?.title || ""}
              onChange={(e) => updateTarget("title", e.target.value)}
              onBlur={(e) => addToHistory("jobTitles", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              الشركة (اختياري)
            </label>
            <input
              className="p-3 border rounded-lg bg-white w-full"
              list="list-companies"
              value={data.targetJob?.company || ""}
              onChange={(e) => updateTarget("company", e.target.value)}
              onBlur={(e) => addToHistory("companies", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              الولاية / المكان
            </label>
            <input
              className="p-3 border rounded-lg bg-white w-full"
              list="list-locations"
              value={data.targetJob?.state || ""}
              onChange={(e) => updateTarget("state", e.target.value)}
              onBlur={(e) => addToHistory("locations", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2 flex items-center gap-2">
          <span className="text-red-500">*</span> البيانات الشخصية
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              الاسم الكامل
            </label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              list="list-names"
              value={data.personalInfo?.fullName || ""}
              onChange={(e) =>
                updateData("personalInfo", "fullName", e.target.value)
              }
              onBlur={(e) => addToHistory("names", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              list="list-emails"
              value={data.personalInfo?.email || ""}
              onChange={(e) =>
                updateData("personalInfo", "email", e.target.value)
              }
              onBlur={(e) => addToHistory("emails", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              رقم الهاتف
            </label>
            <input
              type="tel"
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              list="list-phones"
              placeholder="01xxxxxxxxx"
              value={data.personalInfo?.phone || ""}
              onChange={(e) =>
                updateData("personalInfo", "phone", e.target.value)
              }
              onBlur={(e) => addToHistory("phones", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">العنوان</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              list="list-locations"
              value={data.personalInfo?.address || ""}
              onChange={(e) =>
                updateData("personalInfo", "address", e.target.value)
              }
              onBlur={(e) => addToHistory("locations", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">
          اللغات (اختياري)
        </h3>
        <input
          placeholder="مثلاً: Arabic: Native, English: Fluent"
          className="p-3 border rounded-lg w-full"
          value={data.languages || ""}
          onChange={(e) => updateData("languages", null, e.target.value)}
        />
      </div>

      {/* Education */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2 flex items-center gap-2">
          <span className="text-red-500">*</span> التعليم (Education)
        </h3>

        {(data.education || []).map((edu, i) => (
          <div
            key={edu.id || i}
            className="grid md:grid-cols-3 gap-3 mb-4 bg-slate-50 p-4 rounded-xl relative border border-slate-200"
          >
            <button
              onClick={() => removeItem("education", edu.id)}
              className="absolute top-2 left-2 text-red-400 hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>

            <input
              placeholder="الدرجة (Bachelor...)"
              className="p-2 border rounded"
              list="list-degrees"
              value={edu.degree || ""}
              onChange={(e) =>
                updateItem("education", edu.id, "degree", e.target.value)
              }
              onBlur={(e) => addToHistory("degrees", e.target.value)}
            />

            <input
              placeholder="التخصص (Major)"
              className="p-2 border rounded"
              list="list-majors"
              value={edu.major || ""}
              onChange={(e) =>
                updateItem("education", edu.id, "major", e.target.value)
              }
              onBlur={(e) => addToHistory("majors", e.target.value)}
            />

            <input
              placeholder="الجامعة"
              className="p-2 border rounded"
              list="list-schools"
              value={edu.school || ""}
              onChange={(e) =>
                updateItem("education", edu.id, "school", e.target.value)
              }
              onBlur={(e) => addToHistory("schools", e.target.value)}
            />

            <input
              placeholder="المكان"
              className="p-2 border rounded"
              list="list-locations"
              value={edu.location || ""}
              onChange={(e) =>
                updateItem("education", edu.id, "location", e.target.value)
              }
              onBlur={(e) => addToHistory("locations", e.target.value)}
            />

            <input
              placeholder="تاريخ التخرج (Month Year)"
              className={`p-2 border rounded ${
                !edu.year ? "border-red-400 bg-red-50/40" : ""
              }`}
              value={edu.year || ""}
              onChange={(e) =>
                updateItem("education", edu.id, "year", e.target.value)
              }
            />
          </div>
        ))}

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
          className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> إضافة مؤهل
        </button>
      </div>

      {/* Experience */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2">
            <span className="text-red-500">*</span> الخبرات (Experience)
          </h3>
          <button
            onClick={addHomeCountryExp}
            className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200 transition flex items-center gap-1"
          >
            <Globe size={14} /> إضافة خبرة البلد الأم (أوتوماتيك)
          </button>
        </div>

        {getExperienceArray().map((job, i) => (
          <div
            key={job.id || `exp-${i}`}
            className="mb-6 bg-slate-50 p-4 rounded-xl relative border border-slate-200"
          >
            <button
              onClick={() => removeItem("experiences", job.id)}
              className="absolute top-2 left-2 text-red-400 hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <input
                placeholder="المسمى الوظيفي"
                className="p-2 border rounded"
                list="list-jobs"
                value={job.title || ""}
                onChange={(e) =>
                  updateItem("experiences", job.id, "title", e.target.value)
                }
                onBlur={(e) => addToHistory("jobTitles", e.target.value)}
              />

              <input
                placeholder="اسم الشركة"
                className="p-2 border rounded"
                list="list-companies"
                value={job.company || ""}
                onChange={(e) =>
                  updateItem("experiences", job.id, "company", e.target.value)
                }
                onBlur={(e) => addToHistory("companies", e.target.value)}
              />

              <input
                placeholder="المكان"
                className="p-2 border rounded"
                list="list-locations"
                value={job.location || ""}
                onChange={(e) =>
                  updateItem("experiences", job.id, "location", e.target.value)
                }
                onBlur={(e) => addToHistory("locations", e.target.value)}
              />

              <div className="flex gap-2">
                <input
                  placeholder="من"
                  className={`p-2 border rounded w-full ${
                    !job.start ? "border-red-400 bg-red-50/40" : ""
                  }`}
                  value={job.start || ""}
                  onChange={(e) =>
                    updateItem("experiences", job.id, "start", e.target.value)
                  }
                />
                <input
                  placeholder="إلى"
                  className={`p-2 border rounded w-full ${
                    !job.end ? "border-red-400 bg-red-50/40" : ""
                  }`}
                  value={job.end || ""}
                  onChange={(e) =>
                    updateItem("experiences", job.id, "end", e.target.value)
                  }
                />
              </div>
            </div>

            {job.company !== "AI_AUTO_DETECT_TOP_COMPANY_IN_EGYPT" ? (
              <textarea
                placeholder="اكتب المهام بالعربي أو الإنجليزي (الذكاء الاصطناعي هيترجمها وينسقها)"
                className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                value={job.descriptionRaw || ""}
                onChange={(e) =>
                  updateItem(
                    "experiences",
                    job.id,
                    "descriptionRaw",
                    e.target.value
                  )
                }
              />
            ) : (
              <div className="bg-orange-50 text-orange-800 text-xs p-2 rounded border border-orange-200">
                سيقوم الـ AI باختيار اسم شركة حقيقية وتأليف المهام المناسبة
                (Auto-Generate).
              </div>
            )}
          </div>
        ))}

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
          className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> إضافة وظيفة
        </button>
      </div>

      {/* Courses */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 text-slate-700 border-b pb-2">
          الكورسات (Courses){" "}
          <span className="text-xs font-normal text-gray-400">(اختياري)</span>
        </h3>

        {(data.courses || []).map((course, i) => (
          <div
            key={course.id || i}
            className="grid md:grid-cols-3 gap-3 mb-2 bg-slate-50 p-3 rounded-lg relative"
          >
            <button
              onClick={() => removeItem("courses", course.id)}
              className="absolute top-2 left-2 text-red-400 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>

            <input
              placeholder="اسم الكورس"
              className="p-2 border rounded"
              list="list-courseNames"
              value={course.name || ""}
              onChange={(e) =>
                updateItem("courses", course.id, "name", e.target.value)
              }
              onBlur={(e) => addToHistory("courseNames", e.target.value)}
            />

            <input
              placeholder="الجهة المانحة"
              className="p-2 border rounded"
              list="list-providers"
              value={course.provider || ""}
              onChange={(e) =>
                updateItem("courses", course.id, "provider", e.target.value)
              }
              onBlur={(e) => addToHistory("providers", e.target.value)}
            />

            <input
              placeholder="التاريخ (Month Year)"
              className={`p-2 border rounded ${
                !course.date ? "border-red-400 bg-red-50/40" : ""
              }`}
              value={course.date || ""}
              onChange={(e) =>
                updateItem("courses", course.id, "date", e.target.value)
              }
            />
          </div>
        ))}

        <button
          onClick={() =>
            addItem("courses", { name: "", provider: "", date: "" })
          }
          className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> إضافة كورس
        </button>
      </div>

      {/* Optimize for JD */}
      <div className="mb-6 bg-slate-50 border rounded-2xl p-5">
        <label className="flex items-center gap-2 font-black text-slate-800">
          <input
            type="checkbox"
            checked={optimizeForJD}
            onChange={(e) => setOptimizeForJD(e.target.checked)}
            className="w-4 h-4"
          />
          Optimize for Job Description (خلّي الـ CV مناسب لإعلان وظيفة معين)
        </label>

        <div className="text-sm text-slate-600 mt-2">
          اكتب هنا متطلبات الوظيفة اللي هتقدم عليها او اعلان الوظيفة والمتطلبات
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={!optimizeForJD}
          className={`mt-3 w-full h-36 p-4 border rounded-xl bg-white text-left text-sm ${
            optimizeForJD && !(jobDescription || "").trim()
              ? "border-red-300"
              : ""
          } ${!optimizeForJD ? "opacity-60" : ""}`}
          dir="ltr"
          placeholder={`Example:
• Required skills: React, JavaScript, Tailwind
• Experience: 2+ years
• Responsibilities: build UI, work with APIs
• Soft skills: teamwork, problem solving
or paste the full job description here`}
        />
      </div>

      <div className="sticky bottom-4 pt-4 border-t bg-white">
        <button
          onClick={onPreparePrompt}
          className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-3 hover:scale-[1.01] transition transform active:scale-95"
        >
          <Bot size={28} /> تجميع البيانات وتحويلها (AI)
        </button>
      </div>
    </div>
  );
}

export default StepInput;
