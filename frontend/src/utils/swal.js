// utils/swal.js
import Swal from "sweetalert2";

// Main alert function
export function showAlert(options) {
  const {
    title,
    text = "",
    icon = "info",
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
  } = options;

  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: showCancel,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,

    /* ✅ Responsive sizing */
    width: "90vw",
    padding: "2vh",

    /* ✅ Custom responsive classes */
    customClass: {
      popup: "responsive-swal",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-btn swal-confirm",
      cancelButton: "swal-btn swal-cancel",
    },

    buttonsStyling: false,
  });
}

// Success alert helper
export function showSuccessAlert(message = "Action completed successfully") {
  return Swal.fire({
    title: "Success!",
    text: message,
    icon: "success",
    confirmButtonText: "OK",
    width: "90vw",
    padding: "2vh",
    customClass: {
      popup: "responsive-swal",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-btn swal-confirm",
    },
    buttonsStyling: false,
  });
}

// Error alert helper
export function showErrorAlert(message = "Something went wrong") {
  return Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonText: "OK",
    width: "90vw",
    padding: "2vh",
    customClass: {
      popup: "responsive-swal",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-btn swal-confirm",
    },
    buttonsStyling: false,
  });
}

// Warning alert helper
export function showWarningAlert(options) {
  const {
    title = "Are you sure?",
    text = "",
    confirmText = "Yes, proceed",
    cancelText = "Cancel",
  } = options;

  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    width: "90vw",
    padding: "2vh",
    customClass: {
      popup: "responsive-swal",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-btn swal-confirm",
      cancelButton: "swal-btn swal-cancel",
    },
    buttonsStyling: false,
  });
}

// Delete confirmation helper (like your image)
export function showDeleteConfirmation(options) {
  const {
    title = "Delete chat?",
    text = "This will permanently delete this chat conversation.",
    confirmText = "Delete",
    cancelText = "Cancel",
  } = options;

  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    width: "90vw",
    padding: "2vh",
    customClass: {
      popup: "responsive-swal",
      title: "swal-title",
      htmlContainer: "swal-text",
      confirmButton: "swal-btn swal-confirm",
      cancelButton: "swal-btn swal-cancel",
    },
    buttonsStyling: false,
  });
}