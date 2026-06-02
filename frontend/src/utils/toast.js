// utils/toast.js
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info, Trash2 } from "lucide-react";
import { createElement as h } from "react";

const icons = {
  success: { icon: CheckCircle, color: "#22c55e" },
  error:   { icon: XCircle,     color: "#ef4444" },
  warning: { icon: AlertTriangle, color: "#eab308" },
  info:    { icon: Info,         color: "#3b82f6" },
  delete:  { icon: Trash2,       color: "#ef4444" },
};

function showToast(type, title, description, options = {}) {
  const config = icons[type] || icons.info;

  return toast.custom(
    () =>
      h("div", {
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 16px",
          borderRadius: "12px",
          width: "360px",
          maxWidth: "90vw",
          boxSizing: "border-box",
          backgroundColor: "var(--background)",
          border: `1px solid color-mix(in srgb, ${config.color} 30%, var(--background))`,
          boxShadow: `0 4px 20px color-mix(in srgb, ${config.color} 15%, transparent)`,
        },
      },
        // ── Glowing circle icon ──
        h("div", {
          style: {
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: `color-mix(in srgb, ${config.color} 15%, var(--background))`,
            boxShadow: `0 0 10px 2px color-mix(in srgb, ${config.color} 30%, transparent)`,
          },
        },
          h(config.icon, {
            style: { width: "16px", height: "16px", color: config.color, flexShrink: 0 },
            strokeWidth: 2,
          })
        ),
        // ── Text ──
        h("div", {
          style: { display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 },
        },
          h("span", {
            style: {
              fontSize: "14px",
              fontWeight: 600,
              color: `color-mix(in srgb, ${config.color} 20%, currentColor)`,
            },
          }, title),
          description && h("span", {
            style: {
              fontSize: "12px",
              lineHeight: 1.5,
              color: `color-mix(in srgb, ${config.color} 10%, currentColor)`,
              opacity: 0.75,
            },
          }, description)
        )
      ),
    {
      duration: 4000,
      position: "top-center",
      ...options,
    }
  );
}

export const toastSuccess = (title, description, opts) =>
  showToast("success", title, description, opts);

export const toastError = (title, description, opts) =>
  showToast("error", title, description, opts);

export const toastWarning = (title, description, opts) =>
  showToast("warning", title, description, opts);

export const toastInfo = (title, description, opts) =>
  showToast("info", title, description, opts);

export const toastDelete = (title = "Deleted", description, opts) =>
  showToast("delete", title, description, opts);