// src/components/cvbuilder/StepProcess.jsx
import React from "react";
import { Copy, CheckCircle } from "lucide-react";

export function StepProcess({
  pastedJson,
  setPastedJson,
  onImportJson,
  onBackToInput,
}) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-[fadeIn_0.3s] max-w-3xl mx-auto">
      <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Copy size={40} />
      </div>
      <h2 className="text-3xl font-black mb-2 text-slate-800">
        لصق كود الـ AI
      </h2>
      <p className="text-slate-500 mb-6">
        هات الكود (JSON Block) اللي ChatGPT طلعه وحطه هنا.
      </p>

      <textarea
        value={pastedJson}
        onChange={(e) => setPastedJson(e.target.value)}
        placeholder='Paste JSON here... { "name": "..." }'
        className="w-full h-64 p-5 border-2 border-dashed border-purple-300 rounded-2xl bg-purple-50/50 text-left font-mono text-sm mb-6 focus:border-purple-600 focus:bg-white outline-none transition"
        dir="ltr"
      />

      <button
        onClick={onImportJson}
        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-xl shadow-xl hover:bg-green-700 transition flex items-center justify-center gap-3"
      >
        <CheckCircle size={28} /> إنشاء السي في
      </button>

      <button
        onClick={onBackToInput}
        className="mt-6 text-slate-400 hover:text-slate-600 underline text-sm"
      >
        العودة لتعديل البيانات
      </button>
    </div>
  );
}

export default StepProcess;
