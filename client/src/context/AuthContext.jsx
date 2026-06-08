import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Controllo adeguato al backend
  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // DA RIVEDERE
    try {
      const res = await api.get("/auth/me");
      console.log(res);
      if (res.data.user) {
        const u = res.data.user;
        // Da modificare
        setUser({ id: u.sub, email: u.email, isAdmin: u.isAdmin });
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const res = await api.post("/auth/login", credentials);
      if (res.data.ok && res.data.token) {;
        localStorage.setItem("token", res.data.token);
        await checkAuth();
        return { ok: true, message: "Login success" };
      }
      return { ok: false, message: res.data?.error || "Login failed" };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout error: ", e);
    }
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
