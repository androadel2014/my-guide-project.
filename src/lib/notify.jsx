// src/lib/notify.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

export const notify = {
  success: (m, o) => toast.success(m, o),
  error: (m, o) => toast.error(m, o),
  loading: (m, o) => toast.loading(m, o),
  dismiss: (id) => toast.dismiss(id),
};

const cn = (...a) => a.filter(Boolean).join(" ");

function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

function ConfirmPortal({
  t,
  id,
  resolve,
  title,
  message,
  confirmText,
  cancelText,
  variant,
  closeOnBackdrop,
}) {
  useLockBodyScroll(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        toast.dismiss(id);
        resolve(false);
      }
      if (e.key === "Enter") {
        toast.dismiss(id);
        resolve(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, resolve]);

  const isDanger = variant === "danger";
  const confirmBtn = isDanger
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-200"
    : "bg-black hover:bg-black/90 focus:ring-black/20";

  const node = (
    <div className="fixed inset-0 z-[2147483647]">
      {/* ✅ backdrop covers WHOLE screen */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-[2px]",
          t.visible ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150"
        )}
        onClick={() => {
          if (!closeOnBackdrop) return;
          toast.dismiss(id);
          resolve(false);
        }}
      />

      {/* ✅ centered dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-[460px] max-w-[92vw] rounded-2xl border border-white/30 bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden",
            t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
            "transition-all duration-150"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="px-5 pt-5">
            <div className="text-[15px] font-extrabold text-gray-900">
              {title}
            </div>
            <div className="mt-1 text-sm text-gray-600 leading-6 break-words">
              {message}
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-4">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(id);
                resolve(false);
              }}
              className={cn(
                "rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-800",
                "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
              )}
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => {
                toast.dismiss(id);
                resolve(true);
              }}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold text-white",
                confirmBtn,
                "focus:outline-none focus:ring-2"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Portal to body => no parent stacking context problems
  return createPortal(node, document.body);
}

/**
 * toastConfirm()
 * - variant: "default" | "danger"
 * - closeOnBackdrop: true/false
 */
export function toastConfirm({
  title = "تأكيد",
  message = "متأكد؟",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "default",
  closeOnBackdrop = true,
} = {}) {
  return new Promise((resolve) => {
    const id = toast.custom(
      (t) => (
        <ConfirmPortal
          t={t}
          id={id}
          resolve={resolve}
          title={title}
          message={message}
          confirmText={confirmText}
          cancelText={cancelText}
          variant={variant}
          closeOnBackdrop={closeOnBackdrop}
        />
      ),
      { duration: Infinity }
    );
  });
}
