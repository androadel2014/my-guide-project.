// src/components/cvbuilder/PromptModal.jsx
import React from "react";
import { X, Copy, Bot } from "lucide-react";

export function PromptModal({
  show,
  copyStatus,
  generatedPrompt,
  onClose,
  onCopyManual,
  onOpenChatGPT,
}) {
  if (!show) return null;

  const ok = (copyStatus || "").includes("تلقائياً");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-slate-800">جاهز للإرسال!</h3>
          <button
            onClick={onClose}
            className="bg-gray-100 p-2 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-500 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={`mb-6 p-4 rounded-xl text-center font-bold border ${
            ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-yellow-50 border-yellow-200 text-yellow-700"
          }`}
        >
          {copyStatus}
        </div>

        <p className="mb-3 text-slate-600 font-medium">
          تم تجهيز الأوامر. اتبع الخطوات:
        </p>

        <ol className="list-decimal list-inside mb-6 space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border">
          <li>تم نسخ النص تلقائياً (أو اضغط نسخ يدوياً).</li>
          <li>اضغط زر "فتح ChatGPT" بالأسفل.</li>
          <li>
            اعمل <b>Paste (لصق)</b> في الشات هناك.
          </li>
          <li>انسخ الكود اللي الـ AI هيطلعه وارجع هنا.</li>
        </ol>

        {/* (اختياري) Preview prompt */}
        <details className="mb-6">
          <summary className="cursor-pointer text-sm font-bold text-slate-600">
            عرض النص (اختياري)
          </summary>
          <pre className="mt-3 p-3 bg-slate-50 border rounded-xl text-xs overflow-auto whitespace-pre-wrap text-left">
            {generatedPrompt}
          </pre>
        </details>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCopyManual}
            className="py-3 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300 flex items-center justify-center gap-2"
          >
            <Copy size={18} /> نسخ يدوياً
          </button>

          <button
            onClick={onOpenChatGPT}
            className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
          >
            <Bot size={20} /> فتح ChatGPT
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ عشان مايتكسرش لو حد بيستورد default
export default PromptModal;
