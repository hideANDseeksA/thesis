// utils/dialog.js
import { createRoot } from "react-dom/client";
import { AlertDialog } from "./AlertDialog";

function mountDialog(props) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.zIndex = "99999";
  document.body.appendChild(container);
  const root = createRoot(container);
  return new Promise((resolve) => {
    root.render(
      <AlertDialog
        {...props}
        onClose={(result) => {
          root.unmount();
          container.remove();
          resolve(result);
        }}
      />
    );
  });
}

export const showSuccessAlert = (message = "Action completed successfully") =>
  mountDialog({
    title: "All done!",
    text: message,
    type: "confirm",
    buttons: [
      { label: "Cancel", variant: "outline", value: false },
      { label: "Confirm", variant: "default", value: true },
    ],
  });

export const showErrorAlert = (message = "Something went wrong") =>
  mountDialog({
    title: "Error!",
    text: message,
    type: "error",
    buttons: [
      { label: "Cancel", variant: "outline", value: false },
      { label: "OK", variant: "destructive", value: true },
    ],
  });

export const showWarningAlert = ({
  title = "Are you sure?",
  text = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
} = {}) => {
  return mountDialog({
    title,
    text,
    type: "confirm",
    buttons: [
      { label: cancelText, variant: "outline", value: false },
      { label: confirmText, variant: "primary", value: true },
    ],
  });
};

export const showDeleteConfirmation = ({
  title = "You are about to delete task",
  text = "Are you sure you want to delete this? This action cannot be undone.",
  confirmText = "Yes, Delete it!",
  cancelText = "No, Cancel",
} = {}) => {
  const isMobile = window.innerWidth < 640; // Tailwind sm breakpoint

  return mountDialog({
    title,
    text,
    type: "delete",
    buttons: [
      {
        label: isMobile ? "Cancel" : cancelText,
        variant: "outline",
        value: false,
      },
      {
        label: isMobile ? "Delete" : confirmText,
        variant: "destructive",
        value: true,
      },
    ],
  });
};

export const showAlert = ({
  title,
  text = "",
  icon = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}) =>
  mountDialog({
    title,
    text,
    type: icon,
    buttons: [
      ...(showCancel ? [{ label: cancelText, variant: "outline", value: false }] : []),
      { label: confirmText, variant: "default", value: true },
    ],
  });

  export const showCancelConfirmation = ({
  title = "You are about to cancel request",
  text = "Are you sure you want to cancel this? This action cannot be undone.",
  confirmText = "Yes, Cancel it!",
  cancelText = "No, Keep it",
} = {}) => {
  const isMobile = window.innerWidth < 640; // Tailwind sm breakpoint

  return mountDialog({
    title,
    text,
    type: "cancel",
    buttons: [
      {
        label: isMobile ? "Cancel" : cancelText,
        variant: "outline",
        value: false,
      },
      {
        label: isMobile ? "Cancel" : confirmText,
        variant: "destructive",
        value: true,
      },
    ],
  });
};