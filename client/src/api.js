import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach the JWT on every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
