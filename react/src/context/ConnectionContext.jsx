// File: src/context/ConnectionContext.jsx

import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axiosInstance from "../services/axios";
import { message } from "antd";

export const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const { user, token, fetchUserProfile } = useContext(AuthContext);
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem("backendUrl") || import.meta.env.VITE_BACKEND_URL);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  
  // Simpan URL di localStorage saat berubah
  useEffect(() => {
    if (backendUrl) {
      localStorage.setItem("backendUrl", backendUrl);
      // Update axios baseURL
      axiosInstance.defaults.baseURL = backendUrl;
    }
  }, [backendUrl]);
  
  // Cek koneksi saat URL berubah atau user login/logout
  useEffect(() => {
    const checkConnection = async () => {
      if (!token) {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        return;
      }

      try {
        setConnectionStatus("checking");
        // Test connection dengan endpoint sederhana
        const response = await axiosInstance.get(`/api/test`);
        
        // Fetch ulang profil pengguna untuk mendapatkan status langganan terbaru
        if (fetchUserProfile) {
          const userData = await fetchUserProfile();
          
          // Periksa status langganan berdasarkan data yang diperbarui
          if (userData && !userData.hasActiveSubscription) {
            setIsConnected(false);
            setConnectionStatus("subscription_expired");
            return;
          }
        }
        
        if (response.data && response.data.message === "API is working") {
          setIsConnected(true);
          setConnectionStatus("connected");
        } else {
          setIsConnected(false);
          setConnectionStatus("error");
        }
      } catch (err) {
        console.error("Connection error:", err);
        if (err.response && err.response.data && err.response.data.subscriptionRequired) {
          setIsConnected(false);
          setConnectionStatus("subscription_expired");
        } else {
          setIsConnected(false);
          setConnectionStatus("error");
        }
      }
    };

    checkConnection();
    
    // Set interval untuk cek koneksi secara berkala (setiap 1 menit)
    const intervalId = setInterval(checkConnection, 60000);
    
    return () => clearInterval(intervalId);
  }, [backendUrl, token, user, fetchUserProfile]);
  
  // Fungsi untuk mengubah URL backend
  const updateBackendUrl = (newUrl) => {
    if (newUrl && newUrl.trim() !== "") {
      try {
        // Simpan URL baru
        setBackendUrl(newUrl);
        
        // Notifikasi berhasil
        message.success("URL backend berhasil diperbarui");
        
        // Refresh halaman setelah jeda singkat
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error("Error updating backend URL:", err);
        message.error("Gagal memperbarui URL backend");
      }
    }
  };
  
  return (
    <ConnectionContext.Provider 
      value={{ 
        backendUrl, 
        updateBackendUrl, 
        isConnected, 
        connectionStatus 
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};