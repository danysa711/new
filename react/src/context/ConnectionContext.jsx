import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

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
  
useEffect(() => {
  // Penanganan khusus saat status koneksi berubah
  if (connectionStatus === 'subscription_expired') {
    // Simpan flag di localStorage bahwa langganan telah kedaluwarsa
    localStorage.setItem('subscription_expired', 'true');
    
    // Tampilkan pesan ke pengguna
    console.log('Langganan kedaluwarsa: Beberapa fitur mungkin terbatas. Data yang diubah hanya akan tersimpan secara lokal.');
    
    // Kita tidak perlu mengalihkan pengguna, biarkan mereka tetap menggunakan UI
  } else {
    localStorage.removeItem('subscription_expired');
  }
}, [connectionStatus]);

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
        // Test connection dengan endpoint sederhana
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
          }
        });
        
        console.log("Status respons:", response.status);
        
        // Cek Content-Type sebelum parsing ke JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          // Jika respons OK dan content-type adalah JSON, koneksi berhasil
          if (response.ok) {
            const data = await response.json();
            console.log("Data respons:", data);
            
            if (data && data.message === "API is working") {
              setIsConnected(true);
              setConnectionStatus("connected");
              console.log("Koneksi berhasil!");
            } else {
              setIsConnected(false);
              setConnectionStatus("error");
              console.log("Format respons tidak valid");
            }
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

  return (
    <ConnectionContext.Provider
      value={{
        connectionStatus,
        isConnected,
        proxyEnabled,
        setProxyEnabled,
        checkConnection: () => {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          if (!token) return;
          
          // Panggil cek koneksi ulang
          setConnectionStatus("checking");
          
          // Jika user memiliki langganan aktif, langsung set connected
          if (user && user.hasActiveSubscription) {
            setIsConnected(true);
            setConnectionStatus("connected");
            return;
          }
          
          // Test connection dengan endpoint sederhana
          let testUrl = proxyEnabled ? '/api/test' : `${backendUrl}/api/test`;
          
          fetch(testUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(response => {
            // Cek content-type sebelum parsing JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              if (response.ok) return response.json();
              
              // Periksa status 403 untuk kemungkinan langganan kedaluwarsa
              if (response.status === 403) {
                // Coba untuk mendapatkan error JSON
                return response.json().catch(() => {
                  // Jika gagal, kemungkinan HTML
                  throw new Error('subscription_expired');
                });
              }
              
              throw new Error(`HTTP error ${response.status}`);
            } else {
              // Jika bukan JSON, kemungkinan HTML error
              if (response.status === 403) {
                throw new Error('subscription_expired');
              }
              throw new Error(`Invalid content-type: ${contentType}`);
            }
          })
          .then(data => {
            // Cek apakah ini error dengan flag subscriptionRequired
            if (data && data.subscriptionRequired) {
              setIsConnected(false);
              setConnectionStatus("subscription_expired");
              return;
            }
            
            if (data && data.message === "API is working") {
              setIsConnected(true);
              setConnectionStatus("connected");
            } else {
              setIsConnected(false);
              setConnectionStatus("error");
            }
          })
          .catch(err => {
            console.error("Error checking connection:", err);
            // Periksa untuk kesalahan langganan kedaluwarsa
            if (err.message === 'subscription_expired' || err.response?.data?.subscriptionRequired) {
              setIsConnected(false);
              setConnectionStatus("subscription_expired");
              console.log("Langganan kedaluwarsa");
              return;
            }
            setIsConnected(false);
            setConnectionStatus("error");
          });
        },
        backendUrl
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};