import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit2,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export const ProfileView = ({ lang }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasCV, setHasCV] = useState(false);

  // بيانات التعديل
  const [editData, setEditData] = useState({
    username: "",
    phone: "",
    address: "",
    bio: "",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setEditData({
        username: userData.username || "",
        phone: userData.phone || "",
        address: userData.address || "",
        bio: userData.bio || "",
      });

      // التحقق من وجود CV للمستخدم في السيرفر
      fetch(`http://localhost:5000/api/get-cv/${userData.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.message) setHasCV(true);
        })
        .catch(() => setHasCV(false));
    }
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, id: user.id }),
      });

      if (response.ok) {
        toast.success(
          lang === "ar"
            ? "تم تحديث البيانات بنجاح"
            : "Profile Updated Successfully"
        );
        const updatedUser = { ...user, ...editData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        // تحديث بسيط لضمان مزامنة البيانات في كل الموقع
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      toast.error(
        lang === "ar" ? "خطأ في الاتصال بالسيرفر" : "Server connection error"
      );
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-96 font-black text-slate-400">
        {lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please login first"}
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        {/* الهيدر الملون */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner">
              <User size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                {user.username}
              </h2>
              <p className="text-blue-100 font-medium">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
              isEditing
                ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            {isEditing ? (
              <>
                <Save size={20} />{" "}
                {lang === "ar" ? "حفظ التغييرات" : "Save Changes"}
              </>
            ) : (
              <>
                <Edit2 size={20} />{" "}
                {lang === "ar" ? "تعديل الملف" : "Edit Profile"}
              </>
            )}
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* حقل الاسم */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {lang === "ar" ? "الاسم المستعار" : "Username"}
              </label>
              {isEditing ? (
                <input
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                  value={editData.username}
                  onChange={(e) =>
                    setEditData({ ...editData, username: e.target.value })
                  }
                />
              ) : (
                <div className="p-5 bg-slate-50 rounded-3xl font-black text-slate-700 border border-transparent">
                  {user.username}
                </div>
              )}
            </div>

            {/* حقل الهاتف */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {lang === "ar" ? "رقم الجوال" : "Phone Number"}
              </label>
              {isEditing ? (
                <input
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                  value={editData.phone}
                  placeholder="01xxxxxxxxx"
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                />
              ) : (
                <div className="p-5 bg-slate-50 rounded-3xl font-black text-slate-700 border border-transparent">
                  {user.phone ||
                    (lang === "ar" ? "لم يتم الإضافة" : "No phone added")}
                </div>
              )}
            </div>

            {/* حقل العنوان */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {lang === "ar" ? "العنوان بالتفصيل" : "Current Address"}
              </label>
              {isEditing ? (
                <input
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                  value={editData.address}
                  placeholder={
                    lang === "ar" ? "المدينة، الحي..." : "City, District..."
                  }
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                />
              ) : (
                <div className="p-5 bg-slate-50 rounded-3xl font-black text-slate-700 border border-transparent">
                  {user.address ||
                    (lang === "ar" ? "لم يتم الإضافة" : "No address added")}
                </div>
              )}
            </div>
          </div>

          {/* قسم السيرة الذاتية (CV) */}
          <div className="mt-12 pt-10 border-t-2 border-slate-50">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Briefcase size={24} className="text-blue-600" />
              {lang === "ar" ? "إدارة السيرة الذاتية" : "Resume Management"}
            </h3>

            {hasCV ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="font-black text-blue-900 text-lg">
                    {lang === "ar"
                      ? "سيرتك الذاتية محفوظة آمنة"
                      : "Your Resume is safely stored"}
                  </p>
                  <p className="text-sm text-blue-600 font-bold opacity-70">
                    {lang === "ar"
                      ? "آخر تحديث كان منذ لحظات"
                      : "Updated moments ago"}
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/cv_builder")}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  {lang === "ar" ? "فتح المحرر" : "Open Editor"}
                </button>
              </div>
            ) : (
              <div className="p-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-center bg-slate-50/30">
                <p className="text-slate-400 font-bold mb-6 text-lg">
                  {lang === "ar"
                    ? "يبدو أنك لم تنشئ سيرة ذاتية بعد!"
                    : "You haven't created a resume yet!"}
                </p>
                <button
                  onClick={() => (window.location.href = "/cv_builder")}
                  className="px-10 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-[2rem] font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  {lang === "ar" ? "إنشاء سيرة ذاتية الآن" : "Create Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
