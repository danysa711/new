import React, { createContext, useState, useEffect } from "react";
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout,
  getUserProfile as apiGetUserProfile,
  updateBackendUrl as apiUpdateBackendUrl,
  testBackendConnection as apiTestConnection 
} from "../api/auth-service";
import { getToken, getUserData } from "../api/utils";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUserData());
  const [loading, setLoading] = useState(false);

  // Update token dan user saat berubah
  useEffect(() => {
    setToken(getToken());
    setUser(getUserData());
  }, []);

  // Cek profil user jika token ada tapi user tidak ada
  useEffect(() => {
    if (token && !user) {
      fetchUserProfile();
    }
  }, [token]);

  // Fungsi untuk mendapatkan profil user
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await apiGetUserProfile();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk login
  const login = async (username, password, remember) => {
    try {
      setLoading(true);
      const result = await apiLogin(username, password, remember);
      
      if (result.success) {
        setToken(getToken());
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk register
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const result = await apiRegister(username, email, password);
      
      if (result.success) {
        setToken(getToken());
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, error: "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk logout
  const logout = () => {
    apiLogout();
    setToken(null);
    setUser(null);
  };

  // Fungsi untuk update data user
  const updateUserData = (userData) => {
    setUser(userData);
  };

  // Fungsi untuk update backend URL
  const updateBackendUrl = async (url) => {
    try {
      setLoading(true);
      const result = await apiUpdateBackendUrl(url);
      
      if (result.success) {
        // Ambil data user terbaru
        await fetchUserProfile();
      }
      
      return result;
    } catch (error) {
      console.error("Error updating backend URL:", error);
      return { success: false, error: "Failed to update backend URL" };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk test koneksi ke backend
  const testBackendConnection = async (url) => {
    return apiTestConnection(url);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      login,
      register,
      logout,
      updateUserData,
      fetchUserProfile,
      updateBackendUrl,
      testBackendConnection
    }}>
      {children}
    </AuthContext.Provider>
  );
};