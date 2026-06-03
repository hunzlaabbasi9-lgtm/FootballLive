import axios from "axios";

// In local dev this stays "/api" (proxied to localhost:5000 by Vite).
// In production set VITE_API_BASE to the Railway backend, e.g.
//   https://your-app.up.railway.app/api
export const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

const api = axios.create({ baseURL: API_BASE });

// Attach the JWT on every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
