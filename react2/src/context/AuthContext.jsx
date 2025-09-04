// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout,
  getUserProfile as apiGetUserProfile,
  updateBackendUrl as apiUpdateBackendUrl,
  testBackendConnection as apiTestConnection 
} from "../api/auth-service";
import { 
  getToken, 
  getUserData, 
  saveToken, 
  saveUserData, 
  clearAuthData 
} from "../api/utils";
import { STORAGE_KEYS } from "../api/config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUserData());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(getToken());
    setUser(getUserData());
  }, []);

  useEffect(() => {
    if (token && !user) {
      fetchUserProfile();
    }
  }, [token]);

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

  const login = async (username, password, remember) => {
    try {
      setLoading(true);
      localStorage.setItem('remember', remember ? 'true' : 'false');
      const backendUrl = localStorage.getItem('backendUrl') || 'https://db.kinterstore.my.id';

      const response = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        return { success: false, error: data.error || 'Login gagal' };
      }

      // ✅ simpan token dan user
      if (remember) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.token);
        if (data.refreshToken) sessionStorage.setItem('refreshToken', data.refreshToken);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      // ✅ update context
      setToken(data.token);
      setUser(data.user);
      saveUserData(data.user);

      console.log("Login berhasil, user:", data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Error login' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const result = await apiRegister(username, email, password);
      if (result.success) {
        setToken(getToken());
        setUser(result.user);
        saveUserData(result.user); // ✅ pastikan user tersimpan
      }
      return result;
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, error: error.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
    apiLogout();
    setToken(null);
    setUser(null);
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const updateUserData = (userData) => {
    saveUserData(userData);
    setUser(userData);
  };

  const updateBackendUrl = async (url) => {
    try {
      setLoading(true);
      const result = await apiUpdateBackendUrl(url);
      if (result.success) {
        await fetchUserProfile();
      }
      return result;
    } catch (error) {
      console.error("Error updating backend URL:", error);
      return { success: false, error: error.message || "Failed to update backend URL" };
    } finally {
      setLoading(false);
    }
  };

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
