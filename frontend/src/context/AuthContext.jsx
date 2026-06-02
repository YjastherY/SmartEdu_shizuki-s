import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/me")
      .then((data) => {
        setUser(data.user);
        document.documentElement.classList.toggle("dark", Boolean(data.user.darkMode));
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    setUser(data.user);
    document.documentElement.classList.toggle("dark", Boolean(data.user.darkMode));
    return data.user;
  }

  async function register(name, email, password) {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    setToken(data.token);
    setUser(data.user);
    document.documentElement.classList.toggle("dark", Boolean(data.user.darkMode));
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    document.documentElement.classList.remove("dark");
  }

  async function updateSettings(settings) {
    const data = await api("/users/settings", {
      method: "PATCH",
      body: JSON.stringify(settings)
    });
    setUser(data.user);
    document.documentElement.classList.toggle("dark", Boolean(data.user.darkMode));
    return data.user;
  }

  async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);
    const data = await api("/users/avatar", {
      method: "POST",
      body: formData
    });
    setUser(data.user);
    return data.user;
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateSettings, uploadAvatar }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
