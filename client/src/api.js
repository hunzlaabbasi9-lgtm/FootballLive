import axios from "axios";

// In local dev this stays "/api" (proxied to localhost:5000 by Vite).
// In production set VITE_API_BASE to the Railway backend, e.g.
//   https://your-app.up.railway.app/api
//
// This is forgiving: a bare domain like "your-app.up.railway.app" is
// auto-normalized to "https://your-app.up.railway.app/api".
function normalizeBase(value) {
  if (!value) return "/api";
  let s = value.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s; // ensure scheme
  if (!/\/api$/i.test(s)) s = s + "/api"; // ensure /api suffix
  return s;
}

export const API_BASE = normalizeBase(import.meta.env.VITE_API_BASE);

const api = axios.create({ baseURL: API_BASE });

// Attach the JWT on every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// When the server reports another device took over, force a clean logout.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.data?.code === "SESSION_REPLACED") {
      localStorage.removeItem("wc_token");
      sessionStorage.setItem("wc_kicked", "1");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
