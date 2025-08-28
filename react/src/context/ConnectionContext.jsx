import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axiosInstance from "../services/axios";

export const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
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
    
    // Update axios baseURL berdasarkan pengaturan proxy
    if (proxyEnabled) {
      // Gunakan domain frontend dengan /api sebagai baseURL
      const frontendOrigin = window.location.origin;
      axiosInstance.defaults.baseURL = `${frontendOrigin}`;
      console.log(`API Proxy diaktifkan. Menggunakan baseURL: ${frontendOrigin}`);
    } else {
      // Gunakan backendUrl langsung
      axiosInstance.defaults.baseURL = backendUrl;
      console.log(`API Proxy dinonaktifkan. Menggunakan baseURL: ${backendUrl}`);
    }
  }, [backendUrl, proxyEnabled]);
  
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
        
        // Jika respons OK, koneksi berhasil
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
      } catch (err) {
        console.error("Error koneksi:", err);
        setIsConnected(false);
        setConnectionStatus("error");
      }
    };

    // Jika user dan token ada, cek status langganan
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
  }, [backendUrl, token, user, proxyEnabled]);
  
  // Fungsi untuk mengubah URL backend
  const updateBackendUrl = async (newUrl) => {
    if (newUrl && newUrl.trim() !== "") {
      setBackendUrl(newUrl);
      
      // Jika ada fungsi updateBackendUrl di AuthContext, panggil untuk menyimpan ke server
      if (user && token) {
        try {
          // Panggil API untuk memperbarui backend URL di server
          await axiosInstance.put('/api/user/backend-url', { backend_url: newUrl });
          
          // Perbarui user data dengan backend URL baru
          if (user) {
            user.backend_url = newUrl;
            
            // Perbarui di storage lokal
            const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
            storedUser.backend_url = newUrl;
            
            if (localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(storedUser));
            }
            
            if (sessionStorage.getItem('user')) {
              sessionStorage.setItem('user', JSON.stringify(storedUser));
            }
          }
        } catch (error) {
          console.error('Error updating backend URL on server:', error);
        }
      }
    }
  };
  
  return (
    <ConnectionContext.Provider 
      value={{ 
        backendUrl, 
        updateBackendUrl, 
        isConnected, 
        connectionStatus,
        proxyEnabled,
        setProxyEnabled
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};