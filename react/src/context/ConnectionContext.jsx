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
    
    // Gunakan endpoint yang lebih reliable (/api/test) untuk cek koneksi
    let testUrl;
    
    if (proxyEnabled) {
      // Jika proxy diaktifkan, gunakan domain frontend + /api
      testUrl = '/api/test';
    } else {
      // Jika tidak, gunakan backendUrl langsung
      testUrl = `${backendUrl}/api/test`;
    }
    
    console.log("Memeriksa koneksi ke:", testUrl);

    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      // Tambahkan timeout untuk fetch
      signal: AbortSignal.timeout(10000) // 10 detik timeout
    });
    
    console.log("Status respons:", response.status);
    
    // Periksa status respons
    if (response.ok) {
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data && data.message === "API is working") {
            setIsConnected(true);
            setConnectionStatus("connected");
            console.log("Koneksi berhasil!");
            return;
          }
        }
      } catch (jsonError) {
        console.error("Gagal memproses respons JSON:", jsonError);
      }
    }
      
    // Jika respons bukan OK atau bukan JSON valid, coba endpoint fallback
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
    
    // Coba endpoint fallback yang tidak memerlukan autentikasi
    const fallbackUrl = proxyEnabled ? '/api/settings/public' : `${backendUrl}/api/settings/public`;
    console.log("Mencoba endpoint fallback:", fallbackUrl);
    
    const fallbackResponse = await fetch(fallbackUrl, {
      signal: AbortSignal.timeout(5000) // 5 detik timeout untuk fallback
    });
    
    if (fallbackResponse.ok) {
      setIsConnected(true);
      setConnectionStatus("connected");
      console.log("Koneksi berhasil via fallback!");
      return;
    }
    
    // Jika masih gagal, set status error
    setIsConnected(false);
    setConnectionStatus("error");
    console.log("Koneksi gagal dengan semua endpoint");
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
      
      // Gunakan endpoint /api/test yang reliable
      const testUrl = proxyEnabled ? '/api/test' : `${backendUrl}/api/test`;
      console.log("Memeriksa koneksi ke:", testUrl);
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(10000) // 10 detik timeout
      });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const data = await response.json();
            if (data && data.message === "API is working") {
              setIsConnected(true);
              setConnectionStatus("connected");
              message.success('Koneksi berhasil!', 3);
              console.log("Koneksi berhasil!");
              return;
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }
      
      // Jika tidak berhasil, coba beri pesan yang lebih spesifik berdasarkan status kode
      if (response.status === 401) {
        message.error('Sesi Anda telah berakhir. Silakan login kembali.', 3);
        setIsConnected(false);
        setConnectionStatus("disconnected");
      } else if (response.status === 403) {
        message.warning('Akses ditolak. Langganan Anda mungkin telah berakhir.', 3);
        setIsConnected(false);
        setConnectionStatus("subscription_expired");
      } else if (response.status >= 500) {
        message.error(`Kesalahan server (${response.status}). Silakan coba lagi nanti.`, 3);
        setIsConnected(false);
        setConnectionStatus("error");
      } else {
        message.error('Gagal terhubung ke server. Silakan coba lagi nanti.', 3);
        setIsConnected(false);
        setConnectionStatus("error");
      }
    } catch (err) {
      console.error("Error koneksi:", err);
      setIsConnected(false);
      setConnectionStatus("error");
      
      // Cek apakah ini error timeout
      if (err.name === 'AbortError') {
        message.error('Koneksi timeout. Server mungkin tidak merespons.', 3);
      } else {
        message.error('Error koneksi: ' + (err.message || 'Tidak diketahui'), 3);
      }
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