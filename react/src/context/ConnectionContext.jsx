// File: react/src/context/ConnectionContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axiosInstance, { API_URL } from "../services/axios";

export const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const { user, token, fetchUserProfile } = useContext(AuthContext);
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem("backendUrl") || import.meta.env.VITE_BACKEND_URL);
  const [userBackendUrl, setUserBackendUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [menuConnectionStatus, setMenuConnectionStatus] = useState({
    software: "connected",
    version: "connected",
    license: "connected"
  });
  
  // Automatically retry connection if user subscription status changes
  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user?.hasActiveSubscription]);
  
  // Simpan URL di localStorage saat berubah
  useEffect(() => {
    if (backendUrl) {
      localStorage.setItem("backendUrl", backendUrl);
    }
  }, [backendUrl]);

  // Generate URL khusus user
  useEffect(() => {
    if (user && user.id) {
      const generatedUserUrl = `${backendUrl}/api/user/${user.id}`;
      setUserBackendUrl(generatedUserUrl);
    }
  }, [backendUrl, user]);
  
  // Cek koneksi saat URL berubah atau user login/logout
  useEffect(() => {
    const checkIntervalId = setInterval(checkConnection, 60000); // Check every minute
    
    // Initial check
    checkConnection();
    
    return () => clearInterval(checkIntervalId);
  }, [backendUrl, token]);

  const checkConnection = async () => {
  if (!token) {
    setIsConnected(false);
    setConnectionStatus("disconnected");
    return;
  }

  try {
    setConnectionStatus("checking");
    
    // Tambahkan timeout yang lebih pendek untuk mencegah hanging request
    const response = await axiosInstance.get(`${backendUrl}/api/test`, {
      timeout: 5000 // 5 detik timeout
    }).catch(error => {
      // Handle error dengan lebih baik
      console.error("Connection test error:", error.message);
      throw error; // Re-throw untuk ditangani di catch block berikutnya
    });
    
    // Kode lain sama seperti sebelumnya
    // ...
    
  } catch (err) {
    console.error("Connection error:", err);
    setIsConnected(false);
    
    // Periksa jenis error untuk memberikan status yang lebih spesifik
    if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
      setConnectionStatus("network_error");
    } else if (err.response && err.response.status === 502) {
      setConnectionStatus("server_error");
    } else if (err.message.includes("CORS")) {
      setConnectionStatus("cors_error");
    } else if (err.response && err.response.data && err.response.data.subscriptionRequired) {
      setConnectionStatus("subscription_expired");
    } else {
      setConnectionStatus("error");
    }
  }
};

// Fungsi untuk mengecek kesehatan API
const checkApiHealth = async () => {
  try {
    const response = await fetch(`${backendUrl}/api/test`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 detik timeout
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};

// Di dalam useEffect di ConnectionContext
useEffect(() => {
  const checkIntervalId = setInterval(() => {
    checkApiHealth().then(isHealthy => {
      if (isHealthy !== isConnected) {
        setIsConnected(isHealthy);
        setConnectionStatus(isHealthy ? "connected" : "error");
      }
    });
  }, 60000); // Check every minute
  
  // Initial check
  checkApiHealth().then(isHealthy => {
    setIsConnected(isHealthy);
    setConnectionStatus(isHealthy ? "connected" : "error");
  });
  
  return () => clearInterval(checkIntervalId);
}, [backendUrl]);
  
  // Fungsi untuk mengubah URL backend
  const updateBackendUrl = (newUrl) => {
    if (newUrl && newUrl.trim() !== "") {
      setBackendUrl(newUrl);
      // Update axios baseURL
      axiosInstance.defaults.baseURL = newUrl;
      // Re-check connection after URL change
      checkConnection();
    }
  };
  
  return (
    <ConnectionContext.Provider 
      value={{ 
        backendUrl, 
        userBackendUrl,
        updateBackendUrl, 
        isConnected, 
        connectionStatus,
        menuConnectionStatus,
        checkConnection
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};