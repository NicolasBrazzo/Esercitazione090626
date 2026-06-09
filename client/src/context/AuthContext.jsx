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
        setUser({ id: u.sub, name: u.name, email: u.email, isAdmin: u.isAdmin });
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

  const register = async (data) => {
    try {
      const res = await api.post("/auth/register", data);
      if (res.data.ok && res.data.token) {
        localStorage.setItem("token", res.data.token);
        await checkAuth();
        return { ok: true, message: "Registration successful" };
      }
      return { ok: false, message: res.data?.error || "Registration failed" };
    } catch (err) {
      const serverError = err.response?.data?.error;
      const message = Array.isArray(serverError)
        ? serverError.join(". ")
        : serverError || err.message;
      return { ok: false, message };
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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
