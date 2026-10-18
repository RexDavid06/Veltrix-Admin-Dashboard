import axios from "axios";
import { clearSession, getAccessToken, getRefreshToken, saveSession } from "./auth";

// VITE_API_BASE_URL is empty in dev so requests go through the Vite proxy
// (same-origin /api -> local backend). In production it is the deployed
// backend origin, e.g. https://veltrix-backend.onrender.com
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, ""),
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const { data } = await axios.post(`${api.defaults.baseURL}/api/auth/token/refresh/`, { refresh });
  // ROTATE_REFRESH_TOKENS is enabled server-side: persist both new tokens.
  saveSession({ access: data.access, refresh: data.refresh || refresh });
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRetry = original?._retry;
    const isLoginRequest = original?.url?.endsWith("/api/auth/token/");

    if (error.response?.status === 401 && !isAuthRetry && !isLoginRequest) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch (refreshError) {
        refreshPromise = null;
        clearSession();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        return Promise.reject(refreshError);
      }
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorDetail(error) {
  const data = error?.response?.data;
  if (!data) return "Network error — is the backend reachable?";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.entries(data)[0];
  if (first) {
    const [, value] = first;
    return Array.isArray(value) ? value.join(" ") : String(value);
  }
  return "Request failed.";
}

export default api;
