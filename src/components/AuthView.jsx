import React, { useState } from "react";
import { UserPlus, Mail, Lock, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const AuthView = ({ lang = "en" }) => {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:5000";

  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    identifier: "",
    password: "",
  });

  const switchMode = () => {
    setIsLogin((p) => !p);
    setFormData({ username: "", identifier: "", password: "" });
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const isEmail = (v) => /.+@.+\..+/.test(String(v || "").trim());

  const normalizeErr = (res, data) => {
    if (res.status === 401) {
      return (
        data?.message ||
        (lang === "ar"
          ? "الإيميل/اليوزر أو كلمة السر غلط"
          : "Wrong credentials")
      );
    }
    if (res.status === 400) {
      return (
        data?.message ||
        (lang === "ar"
          ? "البيانات ناقصة أو الطلب غلط"
          : "Bad request — missing/invalid fields")
      );
    }
    return (
      data?.message || (lang === "ar" ? "حدث خطأ" : "Something went wrong")
    );
  };

  // ✅ request helper
  const postAuth = async (endpoint, payload) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    return { res, data };
  };

  const saveAuth = (data) => {
    const token = data?.token || data?.accessToken || data?.jwt;
    const user = data?.user || data?.data?.user || data?.me;

    if (!token) {
      toast.error(
        lang === "ar"
          ? "السيرفر لم يُرجع Token"
          : "Server did not return a token"
      );
      return false;
    }

    localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));

    window.dispatchEvent(new Event("auth_changed"));
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    const identifier = String(formData.identifier || "").trim();
    const username = String(formData.username || "").trim();
    const password = String(formData.password || "");

    // ✅ Validation
    if (isLogin) {
      if (!identifier || !password) {
        toast.error(lang === "ar" ? "املأ البيانات الأول" : "Fill the fields");
        return;
      }
    } else {
      if (!username || !identifier || !password) {
        toast.error(lang === "ar" ? "املأ البيانات الأول" : "Fill the fields");
        return;
      }
      if (!isEmail(identifier)) {
        toast.error(
          lang === "ar"
            ? "التسجيل لازم يكون بإيميل صحيح"
            : "Registration requires a valid email"
        );
        return;
      }
    }

    setLoading(true);

    try {
      // =========================
      // ✅ REGISTER
      // =========================
      if (!isLogin) {
        const payload = { username, email: identifier, password };
        const { res, data } = await postAuth(endpoint, payload);

        if (!res.ok) {
          toast.error(normalizeErr(res, data));
          return;
        }

        if (!saveAuth(data)) return;

        toast.success(lang === "ar" ? "تم إنشاء الحساب ✅" : "Registered ✅");
        navigate("/", { replace: true });
        return;
      }

      // =========================
      // ✅ LOGIN (Email OR Username) with auto-retry
      // =========================
      // 1) try as email payload first (works with your backend غالبًا)
      const tryEmailPayload = { email: identifier, password };
      let { res, data } = await postAuth(endpoint, tryEmailPayload);

      // 2) if failed AND identifier is NOT email → retry as username payload
      if (!res.ok && !isEmail(identifier)) {
        const tryUsernamePayload = { username: identifier, password };
        const retry = await postAuth(endpoint, tryUsernamePayload);
        res = retry.res;
        data = retry.data;
      }

      if (!res.ok) {
        toast.error(normalizeErr(res, data));
        return;
      }

      if (!saveAuth(data)) return;

      toast.success(lang === "ar" ? "تم تسجيل الدخول ✅" : "Logged in ✅");
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(
        lang === "ar"
          ? "تعذر الاتصال بالسيرفر (شغل الباك أولاً)"
          : "Server connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 transition-colors text-sm font-bold cursor-pointer"
          >
            <ArrowLeft size={16} />
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
                ? "أهلاً بك مجدداً"
                : "Welcome back"
              : lang === "ar"
              ? "ابدأ حسابك الآن"
              : "Create your account"}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold mb-2 pr-1">
                  {lang === "ar" ? "الاسم" : "Name"}
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
                {isLogin
                  ? lang === "ar"
                    ? "الإيميل أو اليوزر"
                    : "Email or Username"
                  : lang === "ar"
                  ? "الإيميل"
                  : "Email"}
              </label>
              <div className="relative">
                <input
                  type={isLogin ? "text" : "email"}
                  name="identifier"
                  value={formData.identifier}
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
              disabled={loading}
              className={`w-full p-4 rounded-2xl font-bold text-lg shadow-lg transition-all mt-4 ${
                loading
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 cursor-pointer"
              }`}
            >
              {loading
                ? lang === "ar"
                  ? "جارٍ التنفيذ..."
                  : "Processing..."
                : isLogin
                ? lang === "ar"
                  ? "دخول"
                  : "Login"
                : lang === "ar"
                ? "سجل الآن"
                : "Register"}
            </button>
          </form>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            {isLogin
              ? lang === "ar"
                ? "ليس لديك حساب؟ سجل الآن"
                : "Don't have an account? Sign up"
              : lang === "ar"
              ? "لديك حساب؟ سجل دخولك"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
