import {
  FileText,
  Briefcase,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StartView = ({ lang }) => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "essentials",
      title: lang === "ar" ? "الأساسيات في أمريكا" : "U.S. Essentials",
      desc:
        lang === "ar"
          ? "معلومات عامة تساعدك تفهم الحياة اليومية في أمريكا"
          : "General information about daily life in the U.S.",
      icon: FileText,
      to: "/essentials",
    },
    {
      id: "papers",
      title: lang === "ar" ? "الأوراق والـ IDs" : "Documents & IDs",
      desc:
        lang === "ar"
          ? "SSN، State ID، رخصة القيادة وكل ما يخص الأوراق"
          : "SSN, State ID, driver license and official documents",
      icon: FileText,
      to: "/papers",
    },
    {
      id: "work",
      title: lang === "ar" ? "الشغل والدخل" : "Work & Income",
      desc:
        lang === "ar"
          ? "أنواع الشغل والفرق بين W2 و 1099"
          : "Job types and W2 vs 1099 explained",
      icon: Briefcase,
      to: "/work",
    },
    {
      id: "money",
      title: lang === "ar" ? "الفلوس والضرايب" : "Money Basics",
      desc:
        lang === "ar"
          ? "حسابات بنكية، كريدت، وضرايب"
          : "Banking, credit and taxes",
      icon: DollarSign,
      to: "/money",
    },
    {
      id: "mistakes",
      title: lang === "ar" ? "أخطاء شائعة" : "Common Mistakes",
      desc:
        lang === "ar"
          ? "غلطات بتقابل أغلب المهاجرين"
          : "Common mistakes immigrants make",
      icon: AlertTriangle,
      to: "/mistakes",
    },
  ];

  return (
    <div className="px-6 lg:px-12 py-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
          {lang === "ar"
            ? "دليل المهاجر في أمريكا"
            : "Immigrant Guide to the U.S."}
        </h1>
        <p className="text-slate-500 max-w-2xl">
          {lang === "ar"
            ? "معلومات منظمة مش خطوات إجبارية، اختار اللي يهمك"
            : "Organized information, not mandatory steps. Choose what you need."}
        </p>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.to)}
            className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <item.icon size={26} />
              </div>
              <ArrowRight
                size={18}
                className={`text-slate-400 group-hover:text-blue-600 ${
                  lang === "ar" ? "rotate-180" : ""
                }`}
              />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {item.title}
            </h3>
            <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
