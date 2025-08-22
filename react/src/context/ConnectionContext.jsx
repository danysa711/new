// File: react/src/context/ConnectionContext.jsx

import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axiosInstance from "../services/axios";

export const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem("backendUrl") || import.meta.env.VITE_BACKEND_URL);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  
  // Simpan URL di localStorage saat berubah
  useEffect(() => {
    if (backendUrl) {
      localStorage.setItem("backendUrl", backendUrl);
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
        const response = await axiosInstance.get(`${backendUrl}/api/test`);
        
        // Cek apakah user berlangganan aktif
        if (user && !user.hasActiveSubscription) {
          setIsConnected(false);
          setConnectionStatus("subscription_expired");
          return;
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
        setIsConnected(false);
        setConnectionStatus("error");
      }
    };

    checkConnection();
    
    // Set interval untuk cek koneksi secara berkala (setiap 1 menit)
    const intervalId = setInterval(checkConnection, 60000);
    
    return () => clearInterval(intervalId);
  }, [backendUrl, token, user]);
  
  // Fungsi untuk mengubah URL backend
  const updateBackendUrl = (newUrl) => {
    if (newUrl && newUrl.trim() !== "") {
      setBackendUrl(newUrl);
      // Update axios baseURL
      axiosInstance.defaults.baseURL = newUrl;
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