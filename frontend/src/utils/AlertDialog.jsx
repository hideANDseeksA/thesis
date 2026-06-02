// components/AlertDialog.jsx
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, Trash2, Check, X } from "lucide-react";

const iconConfig = {
  success: {
    Icon: CheckCircle,
    bg: "bg-green-100 dark:bg-green-900/30",
    color: "text-green-600 dark:text-green-400",
    border: "",
    actionClass: "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white",
    ActionIcon: Check,
  },
  error: {
    Icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
    border: "border-2 border-red-300 dark:border-red-700",
    actionClass: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white",
    ActionIcon: X,
  },
  warning: {
    Icon: AlertTriangle,
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    color: "text-yellow-600 dark:text-yellow-400",
    border: "border-2 border-yellow-300 dark:border-yellow-700",
    actionClass: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white",
    ActionIcon: Check,
  },
  info: {
    Icon: Info,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    color: "text-blue-600 dark:text-blue-400",
    border: "",
    actionClass: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white",
    ActionIcon: Check,
  },
  delete: {
    Icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
    border: "border-2 border-red-300 dark:border-red-700",
    actionClass: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white",
    ActionIcon: Trash2,
  },
  cancel: {
    Icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
    border: "border-2 border-red-300 dark:border-red-700",
    actionClass: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white",
    ActionIcon: Check,
  },
  confirm: {
    Icon: CheckCircle,
    bg: "bg-green-100 dark:bg-green-900/30",
    color: "text-green-600 dark:text-green-400",
    border: "",
    actionClass: "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white",
    ActionIcon: Check,
  },
};

export function AlertDialog({ title, text, type = "info", buttons = [], onClose }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = (value) => {
    setOpen(false);
    setTimeout(() => {
      if (typeof onClose === "function") {
        onClose(value);
      }
    }, 220);
  };

  const config = iconConfig[type] || iconConfig.info;
  const { Icon, bg, color, border, actionClass, ActionIcon } = config;

  const cancelBtn = buttons.find((b) => b.variant === "outline") || null;
  const actionBtn = buttons.find((b) => b.variant !== "outline") || null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && dismiss(false)}
      className={[
        "fixed inset-0 z-50 flex items-center justify-center px-6",
        "bg-black/40 dark:bg-black/60 backdrop-blur-sm",
        "transition-opacity duration-200",
        open ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        className={[
          "relative w-full max-w-sm rounded-2xl shadow-lg p-6",
          "bg-white dark:bg-black",
          "transition-all duration-[220ms]",
          border,
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-3",
        ].join(" ")}
      >
        {/* X close button */}
        <button
          type="button"
          onClick={() => dismiss(false)}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mb-5`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>

        {/* Body */}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          {text}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {cancelBtn && (
            <button
              type="button"
              onClick={() => dismiss(cancelBtn.value)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.97]"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              {cancelBtn.label}
            </button>
          )}

          {actionBtn && (
            <button
              type="button"
              onClick={() => dismiss(actionBtn.value)}
              className={[
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                "transition-all active:scale-[0.97]",
                actionClass,
              ].join(" ")}
            >
              <ActionIcon className="w-4 h-4" />
              {actionBtn.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}