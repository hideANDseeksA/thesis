import axios from "axios";
import Swal from "sweetalert2";
import { showLoading, closeLoading } from "@/utils/swalLoader";

let requestCount = 0;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

/* ============================
   REQUEST INTERCEPTOR
============================ */
api.interceptors.request.use(
  (config) => {
    requestCount++;

    // 👇 show loader only once
    if (requestCount === 1 && !config.skipLoader) {
      showLoading();
    }

    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // 👇 ONLY force JSON header when not uploading files
    if (
      !(config.data instanceof FormData) &&
      (!config.responseType || config.responseType === "json")
    ) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    requestCount = 0;
    closeLoading();
    return Promise.reject(error);
  }
);

/* ============================
   RESPONSE INTERCEPTOR
============================ */
api.interceptors.response.use(
  (response) => {
    requestCount--;
    if (requestCount === 0) closeLoading();
    return response;
  },
  async (error) => {
    requestCount--;
    if (requestCount === 0) closeLoading();

    const status = error.response?.status;

    /* 👇 Handle binary error responses */
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch {
        // ignore if not JSON
      }
    }

    if (status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }

    if (status === 403) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You are not allowed to do this",
        width: "60vh",
      });
    }

    if (status >= 500) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Please try again later",
        width: "60vh",
      });
    }

    return Promise.reject(error);
  }
);

export default api;
