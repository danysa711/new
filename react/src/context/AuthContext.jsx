// react/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { API_URL } from "../services/axios";
import axios from "axios";
import { message } from "antd";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("token") || sessionStorage.getItem("token") || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || null
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
    const savedRefreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password, remember) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/login`, { username, password });
      const { token, refreshToken, user } = res.data;

      setToken(token);
      setRefreshToken(refreshToken);
      setUser(user);

      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("remember", "true");
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("refreshToken", refreshToken);
        sessionStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("remember", "false");
      }
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Login gagal:", error);
      message.error(error.response?.data?.error || "Login gagal, coba lagi nanti");
      return { success: false, error: error.response?.data?.error || "Login gagal" };
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/register`, { 
        username, 
        email, 
        password 
      });
      setLoading(false);
      message.success("Pendaftaran berhasil, silakan login");
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Pendaftaran gagal:", error);
      message.error(error.response?.data?.error || "Pendaftaran gagal, coba lagi nanti");
      return { success: false, error: error.response?.data?.error || "Pendaftaran gagal" };
    }
  };

  // react/src/context/AuthContext.jsx (lanjutan)
  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("remember");
    sessionStorage.removeItem("remember");
  };

  const updateUserData = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Update in storage
    if (localStorage.getItem("user")) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    if (sessionStorage.getItem("user")) {
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const checkUrlAccess = async () => {
    if (!token || !user) return false;
    
    try {
      const res = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update user data in case it changed server-side
      updateUserData(res.data);
      
      return res.data.url_active;
    } catch (error) {
      console.error("Error checking URL access:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        refreshToken, 
        token, 
        user, 
        loading,
        login, 
        logout,
        register,
        updateUserData,
        checkUrlAccess,
        isAdmin: user?.role === "admin"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};