// src/context/ConnectionContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { message } from 'antd';

// Konstanta untuk status koneksi
export const CONNECTION_STATUS = {
  CHECKING: 'checking',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  SUBSCRIPTION_EXPIRED: 'subscription_expired'
};

export const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [backendUrl, setBackendUrl] = useState(() => {
    // Prioritaskan backend URL dari user jika tersedia
    return user?.backend_url || localStorage.getItem("backendUrl") || import.meta.env.VITE_BACKEND_URL || "https://db.kinterstore.my.id";
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [proxyEnabled, setProxyEnabled] = useState(localStorage.getItem("useProxyApi") === "true");
  
  // Update backendUrl ketika user berubah
  useEffect(() => {
    if (user?.backend_url) {
      setBackendUrl(user.backend_url);
      localStorage.setItem("backendUrl", user.backend_url);
    }
  }, [user]);
  
  // Simpan URL dan proxyEnabled di localStorage saat berubah
  useEffect(() => {
    if (backendUrl) {
      localStorage.setItem("backendUrl", backendUrl);
    }
    
    localStorage.setItem("useProxyApi", proxyEnabled.toString());
  }, [backendUrl, proxyEnabled]);
  
  // Cek koneksi saat URL berubah atau user login/logout
  useEffect(() => {
    const checkConnection = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        return;
      }

      try {
        setConnectionStatus("checking");
        
        // Gunakan endpoint yang tersedia (tidak menggunakan /api/test yang 404)
        let testUrl;
        
        if (proxyEnabled) {
          // Jika proxy diaktifkan, gunakan domain frontend + /api
          testUrl = '/api/subscriptions/user';
        } else {
          // Jika tidak, gunakan backendUrl langsung
          testUrl = `${backendUrl}/api/subscriptions/user`;
        }
        
        console.log("Memeriksa koneksi ke:", testUrl);

        const response = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("Status respons:", response.status);
        
        // Cek Content-Type sebelum parsing ke JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          // Jika respons OK dan content-type adalah JSON, koneksi berhasil
          if (response.ok) {
            setIsConnected(true);
            setConnectionStatus("connected");
            console.log("Koneksi berhasil!");
          } else {
            // Periksa jika ini masalah langganan kedaluwarsa
            if (response.status === 403) {
              try {
                const errorData = await response.json();
                if (errorData && errorData.subscriptionRequired) {
                  setIsConnected(false);
                  setConnectionStatus("subscription_expired");
                  console.log("Langganan kedaluwarsa");
                  return;
                }
              } catch (e) {
                console.error("Gagal parse respons error:", e);
              }
            }
            
            // Jika bukan masalah langganan, set sebagai error umum
            setIsConnected(false);
            setConnectionStatus("error");
            console.log("Koneksi gagal dengan status:", response.status);
          }
        } else {
          // Jika content-type bukan JSON (mungkin HTML), kemungkinan langganan kedaluwarsa
          if (response.status === 403) {
            setIsConnected(false);
            setConnectionStatus("subscription_expired");
            console.log("Langganan kedaluwarsa (respons HTML)");
            return;
          } else {
            setIsConnected(false);
            setConnectionStatus("error");
            console.log("Koneksi gagal: respons bukan JSON");
          }
        }
      } catch (err) {
        console.error("Error koneksi:", err);
        // Tambahkan penanganan khusus dalam checkConnection
        if (err.response?.data?.subscriptionRequired) {
          setIsConnected(false);
          setConnectionStatus("subscription_expired");
          console.log("Langganan kedaluwarsa");
          return;
        }
        setIsConnected(false);
        setConnectionStatus("error");
      }
    };

    // Jika user dan token ada, cek status langganan
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (user && token) {
      // Jika user memiliki langganan aktif, abaikan masalah koneksi backend
      if (user.hasActiveSubscription) {
        console.log("User memiliki langganan aktif, mengatur koneksi ke connected");
        setIsConnected(true);
        setConnectionStatus("connected");
      } else {
        // Jika tidak berlangganan, cek koneksi seperti biasa
        checkConnection();
      }
    } else if (backendUrl) {
      // Jika tidak ada user/token tapi ada backendUrl, tetap cek koneksi
      checkConnection();
    }
    
    // Set interval untuk cek koneksi secara berkala (setiap 1 menit)
    const intervalId = setInterval(() => {
      if (backendUrl && token) {
        // Jika user memiliki langganan aktif, abaikan cek koneksi berkala
        if (user && user.hasActiveSubscription) {
          setIsConnected(true);
          setConnectionStatus("connected");
        } else {
          checkConnection();
        }
      }
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [backendUrl, user, proxyEnabled]);

  // Fungsi manualCheckConnection untuk tombol "Coba Lagi"
  const manualCheckConnection = async () => {
    message.info('Memeriksa koneksi...', 2);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (!token) {
      message.error('Anda belum login', 3);
      return;
    }
    
    try {
      setConnectionStatus("checking");
      
      // Buat array endpoint untuk dicoba
      const endpointsToTry = [
        '/api/subscriptions/user',
        '/api/subscription-plans',
        '/api/user/profile'
      ];
      
      // Coba setiap endpoint sampai salah satu berhasil
      for (const endpoint of endpointsToTry) {
        try {
          const testUrl = proxyEnabled ? endpoint : `${backendUrl}${endpoint}`;
          console.log("Memeriksa koneksi ke:", testUrl);
          
          const response = await fetch(testUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            setIsConnected(true);
            setConnectionStatus("connected");
            message.success('Koneksi berhasil!', 3);
            console.log("Koneksi berhasil!");
            return;
          }
        } catch (err) {
          console.error(`Error mencoba endpoint ${endpoint}:`, err);
          // Lanjutkan ke endpoint berikutnya
          continue;
        }
      }
      
      // Jika semua endpoint gagal
      setIsConnected(false);
      setConnectionStatus("error");
      message.error('Gagal terhubung ke server. Silakan coba lagi nanti.', 3);
    } catch (err) {
      console.error("Error koneksi:", err);
      setIsConnected(false);
      setConnectionStatus("error");
      message.error('Error koneksi: ' + err.message, 3);
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        connectionStatus,
        isConnected,
        proxyEnabled,
        setProxyEnabled,
        checkConnection: manualCheckConnection,
        backendUrl
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};