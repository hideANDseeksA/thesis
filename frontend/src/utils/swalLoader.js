import Swal from "sweetalert2";

export const showLoading = () => {
  Swal.fire({
    title: "Processing...",
    html: "Please wait",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
    width: "60vh",        // 👈 responsive width
    padding: "3vh",
    customClass: {
      popup: "vh-swal-popup",
      title: "vh-swal-title",
      htmlContainer: "vh-swal-text",
    },
  });
};

export const closeLoading = () => {
  if (Swal.isVisible()) {
    Swal.close();
  }
};
