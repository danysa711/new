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
  // Tambahkan state untuk lastChecked
  const [lastChecked, setLastChecked] = useState(null);
  
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
    setLastChecked(new Date());
    return;
  }

  try {
    setConnectionStatus("checking");
    
    // Gunakan urutan endpoint yang benar untuk pemeriksaan koneksi
    const endpointsToTry = [
      '/api/settings/public',       // Endpoint publik tanpa autentikasi
      '/api/settings/qris-public',  // Endpoint publik QRIS
      '/api/test',                  // Endpoint fallback
    ];
    
    let connected = false;
    
    // Iterasi melalui setiap endpoint sampai ada yang berhasil
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Memeriksa koneksi ke endpoint: ${endpoint}`);
        
        // Untuk endpoint publik, jangan sertakan Authorization header
        const headers = {};
        if (!endpoint.includes('/public')) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const testUrl = proxyEnabled ? endpoint : `${backendUrl}${endpoint}`;
        const response = await fetch(testUrl, {
          headers,
          signal: AbortSignal.timeout(8000) // 8 detik timeout
        });
        
        if (response.ok) {
          console.log(`Koneksi berhasil melalui endpoint: ${endpoint}`);
          connected = true;
          break;
        }
      } catch (err) {
        console.warn(`Endpoint ${endpoint} gagal:`, err);
      }
    }
    
    if (connected) {
      setIsConnected(true);
      setConnectionStatus("connected");
    } else {
      setIsConnected(false);
      setConnectionStatus("error");
      console.log("Semua endpoint gagal");
    }
  } catch (err) {
    console.error("Error koneksi:", err);
    setIsConnected(false);
    setConnectionStatus("error");
  } finally {
    setLastChecked(new Date());
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
        setLastChecked(new Date()); // Update lastChecked
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
          setLastChecked(new Date()); // Update lastChecked
        } else {
          checkConnection();
        }
      }
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [backendUrl, user, proxyEnabled]);

  // Fungsi manualCheckConnection yang diekspos keluar
  const manualCheckConnection = async () => {
    message.info('Memeriksa koneksi...', 2);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (!token) {
      message.error('Anda belum login', 3);
      setLastChecked(new Date()); // Update lastChecked
      return;
    }
    
    try {
      setConnectionStatus("checking");
      
      // Gunakan urutan endpoint yang benar
      const endpointsToTry = [
        '/api/settings/public',  // Endpoint publik dulu
        '/api/test',             // Endpoint dengan autentikasi
        '/api/status'            // Endpoint fallback
      ];
      
      let connected = false;
      
      // Iterasi melalui setiap endpoint
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`Memeriksa koneksi ke endpoint: ${endpoint}`);
          
          // Buat opsi request yang sesuai
          const requestOptions = {};
          if (endpoint === '/api/settings/public') {
            requestOptions.headers = { 'Accept': 'application/json' };
          } else {
            requestOptions.headers = {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            };
          }
          
          const testUrl = proxyEnabled ? endpoint : `${backendUrl}${endpoint}`;
          const response = await fetch(testUrl, {
            ...requestOptions,
            signal: AbortSignal.timeout(8000)
          });
          
          if (response.ok) {
            console.log(`Koneksi berhasil melalui endpoint: ${endpoint}`);
            connected = true;
            break;
          }
        } catch (err) {
          console.warn(`Endpoint ${endpoint} gagal:`, err);
        }
      }
      
      if (connected) {
        setIsConnected(true);
        setConnectionStatus("connected");
        message.success('Koneksi berhasil!', 3);
      } else {
        setIsConnected(false);
        setConnectionStatus("error");
        message.error('Semua endpoint gagal, tidak dapat terhubung ke server', 3);
      }
    } catch (err) {
      console.error("Error koneksi:", err);
      setIsConnected(false);
      setConnectionStatus("error");
      message.error(`Error koneksi: ${err.message || 'Tidak diketahui'}`, 3);
    } finally {
      // Update lastChecked setelah pemeriksaan selesai
      setLastChecked(new Date());
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
        backendUrl,
        lastChecked // Ekspos lastChecked jika diperlukan
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};