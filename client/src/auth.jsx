import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on first load.
  useEffect(() => {
    const token = localStorage.getItem("wc_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("wc_token"))
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((token, u) => {
    if (token) localStorage.setItem("wc_token", token);
    setUser(u);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const signup = useCallback(async (email, password, name) => {
    const { data } = await api.post("/auth/signup", { email, password, name });
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem("wc_token");
    setUser(null);
  }, []);

  // Used after a successful payment to refresh paid status (+ optional new token).
  const setPaid = useCallback((u, token) => persist(token, u), [persist]);

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, setPaid }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
