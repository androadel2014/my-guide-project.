import {
  Compass,
  Mail,
  MessageSquare,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";
const getDir = (lang) => (lang === "ar" ? "rtl" : "ltr");

export const Footer = ({ lang, setPage }) => {
  // ... باقي الكود كما هو

  // --- Footer ---
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 mt-auto border-t border-slate-800">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 text-white mb-4">
              <Compass size={24} className="text-blue-500" />
              <span className="text-xl font-bold">Newcomer</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              {lang === "ar"
                ? "منصتك الأولى للنجاح في أمريكا. معلومات موثوقة، أدوات عملية، ومجتمع داعم."
                : "Your #1 platform for success in the USA. Trusted info, practical tools, and a supportive community."}
            </p>
            <div className="flex gap-4">
              <Twitter
                size={20}
                className="hover:text-blue-400 cursor-pointer transition-colors"
              />
              <Facebook
                size={20}
                className="hover:text-blue-600 cursor-pointer transition-colors"
              />
              <Instagram
                size={20}
                className="hover:text-pink-500 cursor-pointer transition-colors"
              />
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">
              {lang === "ar" ? "الأقسام" : "Sections"}
            </h4>
            <ul className="space-y-3 text-sm">
              <li
                onClick={() => setPage("start")}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {lang === "ar" ? "خارطة الطريق" : "Roadmap"}
              </li>
              <li
                onClick={() => setPage("jobs")}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {lang === "ar" ? "العمل والوظائف" : "Jobs"}
              </li>
              <li
                onClick={() => setPage("housing")}
                className="hover:text-white cursor-pointer transition-colors"
              >
                {lang === "ar" ? "السكن" : "Housing"}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">
              {lang === "ar" ? "مساعدة" : "Support"}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">
                {lang === "ar" ? "الأسئلة الشائعة" : "FAQ"}
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                {lang === "ar" ? "اتصل بنا" : "Contact Us"}
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">
              {lang === "ar" ? "انضم للنشرة" : "Newsletter"}
            </h4>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email Address"
                className="bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button className="bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-bold hover:bg-blue-700 transition-colors">
                {lang === "ar" ? "اشترك" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-xs font-medium">
          <p>© 2024 Newcomer Guide. Built for the community.</p>
        </div>
      </div>
    </footer>
  );
};
