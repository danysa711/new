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
    
    // Set remember preference
    localStorage.setItem('remember', remember ? 'true' : 'false');
    console.log(`Setting remember preference: ${remember ? 'true' : 'false'}`);
    
    // Get backend URL
    const backendUrl = localStorage.getItem('backendUrl') || 'https://db.kinterstore.my.id';
    console.log(`Login using backend URL: ${backendUrl}`);
    
    // Perform login request
    const response = await fetch(`${backendUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Login failed with status:', response.status, data);
      return { 
        success: false, 
        error: data.error || `Login failed with status ${response.status}`
      };
    }
    
    if (!data.token) {
      console.error('Login response missing token:', data);
      return {
        success: false,
        error: 'Server response missing authentication token'
      };
    }
    
    // Save tokens and user data
    console.log('Login successful, saving tokens and user data');
    
    if (remember) {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      sessionStorage.setItem('token', data.token);
      if (data.refreshToken) {
        sessionStorage.setItem('refreshToken', data.refreshToken);
      }
      sessionStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Update context
    setToken(data.token);
    setUser(data.user);
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Error during login request'
    };
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
      return { success: false, error: error.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk logout
  const logout = () => {
    // Gunakan clearAuthData dari utils
    clearAuthData();
    apiLogout();
    setToken(null);
    setUser(null);
    
    // Tambah delay sebelum redirect ke login
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  // Fungsi untuk update data user
  const updateUserData = (userData) => {
    saveUserData(userData);
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
      return { success: false, error: error.message || "Failed to update backend URL" };
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