import axios from "axios";
import { getAccessToken, setAccessToken } from "./tokenService";
import { Loading } from "notiflix";

// -----------------------------
// Main Axios instance (no loading)
// -----------------------------
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  headers: {
    "x-api-key": import.meta.env.VITE_API_KEY,
  },
  
});

const refreshApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

const attachToken = (config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

api.interceptors.request.use(attachToken);

const handle401 = async (err, original, instance) => {
  if (err.response?.status === 401 && !original._retry) {
    original._retry = true;
    try {
      const res = await refreshApi.post("/auth/refresh", {}, { withCredentials: true });
      const newToken = res.data.accessToken;
      setAccessToken(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return instance(original);
    } catch {
      setAccessToken(null);
      return Promise.reject(err);
    }
  }
  return Promise.reject(err);
};

api.interceptors.response.use(
  (res) => res,
  (err) => handle401(err, err.config, api)
);

// -----------------------------
// Axios instance WITH Hourglass loading
// -----------------------------
const apiWithLoading = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
    headers: {
    "x-api-key": import.meta.env.VITE_API_KEY,
  },
  
});

// Customize hourglass loader
Loading.init({
  svgColor: "#32c682",
  messageColor: "#fff",
  svgSize: "40px", // optional: adjust size
  clickToClose: false,
});

// Show **hourglass** loader + attach token
apiWithLoading.interceptors.request.use((config) => {
  attachToken(config);
  Loading.hourglass("Loading..."); // <-- hourglass loader
  return config;
});

// Hide loader + handle response
apiWithLoading.interceptors.response.use(
  (res) => {
    Loading.remove();
    return res;
  },
  (err) => {
    Loading.remove();
    return handle401(err, err.config, apiWithLoading);
  }
);

export { api, apiWithLoading };
