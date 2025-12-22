import React, { useState } from "react";
import { LogIn, UserPlus, Mail, Lock, ArrowLeft } from "lucide-react";
// 1. استيراد مكتبة الإشعارات الاحترافية
import toast from "react-hot-toast";

export const AuthView = ({ lang, setPage }) => {
  const [isLogin, setIsLogin] = useState(true);

  // الحالة الخاصة ببيانات الفورم
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // تحديث البيانات عند الكتابة
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // دالة الإرسال للسيرفر
  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isLogin ? "/api/login" : "/api/register";

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. استخدام التوست بدلاً من الـ alert
        toast.success(
          data.message || (lang === "ar" ? "تم بنجاح" : "Success!")
        );

        // حفظ بيانات المستخدم للثبات
        localStorage.setItem("user", JSON.stringify(data.user));

        if (!isLogin) {
          // بعد التسجيل، انقله لشاشة الدخول تلقائياً
          setIsLogin(true);
        } else {
          // بعد الدخول، انتظر ثانية واحدة ليشاهد الإشعار ثم انقله للرئيسية
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        }
      } else {
        // رسالة خطأ احترافية في حالة فشل الطلب
        toast.error(
          data.message || (lang === "ar" ? "حدث خطأ ما" : "An error occurred")
        );
      }
    } catch (err) {
      console.error("خطأ اتصال:", err);
      toast.error(
        lang === "ar"
          ? "تعذر الاتصال بالسيرفر، تأكد من تشغيل الباك إيند"
          : "Server connection failed"
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <button
            onClick={() => setPage("home")}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 transition-colors text-sm font-bold cursor-pointer"
          >
            <ArrowLeft size={16} />{" "}
            {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </button>

          <h2 className="text-3xl font-black text-slate-900 mb-2">
            {isLogin
              ? lang === "ar"
                ? "تسجيل الدخول"
                : "Sign In"
              : lang === "ar"
              ? "إنشاء حساب جديد"
              : "Create Account"}
          </h2>

          <p className="text-slate-500 mb-8 font-medium">
            {isLogin
              ? lang === "ar"
                ? "أهلاً بك مجدداً في دليلك الأول"
                : "Welcome back"
              : lang === "ar"
              ? "انضم لآلاف القادمين الجدد لأمريكا"
              : "Join thousands of newcomers"}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold mb-2 pr-1">
                  {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none pl-12"
                  />
                  <UserPlus
                    className="absolute left-4 top-4 text-slate-400"
                    size={20}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2 pr-1">
                {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none pl-12"
                />
                <Mail
                  className="absolute left-4 top-4 text-slate-400"
                  size={20}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 pr-1">
                {lang === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none pl-12"
                />
                <Lock
                  className="absolute left-4 top-4 text-slate-400"
                  size={20}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 cursor-pointer text-white p-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all mt-4"
            >
              {isLogin
                ? lang === "ar"
                  ? "دخول"
                  : "Login"
                : lang === "ar"
                ? "ابدأ الآن"
                : "Get Started"}
            </button>
          </form>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            {isLogin
              ? lang === "ar"
                ? "ليس لديك حساب؟ سجل الآن"
                : "Don't have an account? Sign up"
              : lang === "ar"
              ? "لديك حساب بالفعل؟ سجل دخولك"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
