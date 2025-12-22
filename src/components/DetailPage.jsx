import { DATA } from "./Data";
import { CheckCircle, Clock, Star } from "lucide-react"; // --- Detail Page ---
export const DetailPage = ({ page, lang }) => {
  const info = DATA.nav.find((i) => i.id === page) || DATA.nav[0];
  const content = DATA.sections_content[page] || {
    title: info.label,
    desc: { ar: "قريبا", en: "Soon" },
    steps: [],
    tips: [],
  };

  return (
    <div className="px-6 lg:px-12 pb-32 lg:pb-12 max-w-5xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      <div className="py-10 lg:py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-bold mb-6 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${info.color}`}></span>
          {info.label[lang]}
        </div>
        <h1 className="text-3xl lg:text-5xl font-black text-slate-900 mb-6 leading-tight">
          {content.title[lang]}
        </h1>
        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl leading-relaxed">
          {content.desc[lang]}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {content.steps && content.steps.length > 0 ? (
            content.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {step.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle
                          size={20}
                          className="text-emerald-500 shrink-0 mt-0.5"
                        />
                        <span className="text-slate-600 font-medium">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Clock size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                جاري إضافة المحتوى
              </h3>
              <p className="text-slate-500">
                نعمل على تجهيز هذا القسم بأفضل المعلومات.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6 text-yellow-400">
                <Star size={20} fill="currentColor" />
                <span className="font-bold uppercase tracking-widest text-xs">
                  {lang === "ar" ? "نصائح ذهبية" : "Pro Tips"}
                </span>
              </div>
              <ul className="space-y-4">
                {content.tips &&
                  content.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm lg:text-base text-slate-300 leading-relaxed border-b border-white/10 pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-blue-400 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
