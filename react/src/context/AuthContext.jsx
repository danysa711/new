import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State untuk token, user, dan URL backend
  const [token, setToken] = useState(
    localStorage.getItem("token") || sessionStorage.getItem("token") || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || null
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
  );
  const [backendUrl, setBackendUrl] = useState(
    localStorage.getItem("backendUrl") || "https://db.kinterstore.my.id"
  );
  const [loading, setLoading] = useState(false);

  // Membuat instance axios untuk permintaan API
  const createAxiosInstance = (url) => {
    return axios.create({
      baseURL: url,
      timeout: 30000, // Meningkatkan timeout menjadi 30 detik
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  // Menyimpan backendUrl saat berubah
  useEffect(() => {
    if (backendUrl) {
      localStorage.setItem("backendUrl", backendUrl);
    }
  }, [backendUrl]);

  // Memuat data dari storage saat komponen dimount
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
    
    const savedRefreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing saved user:", e);
        setUser(null);
      }
    }
    
    const savedBackendUrl = localStorage.getItem("backendUrl");
    if (savedBackendUrl) {
      setBackendUrl(savedBackendUrl);
    }
  }, []);

  // Fetch user profile jika token ada tapi data user tidak ada
  useEffect(() => {
    if (token && !user) {
      fetchUserProfile();
    }
  }, [token]);

  // Fungsi untuk mendapatkan profil user
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Buat instance axios dengan backendUrl yang tersimpan
      const axiosInstance = createAxiosInstance(backendUrl);
      
      const res = await axiosInstance.get("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userData = res.data.user;
      
      // Update backendUrl jika user memiliki backend_url yang berbeda
      if (userData.backend_url && userData.backend_url !== backendUrl) {
        setBackendUrl(userData.backend_url);
        localStorage.setItem("backendUrl", userData.backend_url);
      }
      
      // Pastikan field hasActiveSubscription selalu ada
      if (userData.subscription) {
        userData.hasActiveSubscription = true;
      } else if (userData.hasActiveSubscription === undefined) {
        // Jika tidak ada informasi langganan, cek dari data subscription
        userData.hasActiveSubscription = Boolean(userData.Subscriptions && userData.Subscriptions.length > 0);
      }
      
      setUser(userData);
      
      // Simpan data user ke storage
      if (localStorage.getItem("remember") === "true") {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        sessionStorage.setItem("user", JSON.stringify(userData));
      }
      
      return userData;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      
      // Jika fetch gagal karena token tidak valid, logout
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk melakukan register
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      
      // Gunakan backendUrl tetap
      const url = backendUrl;
      
      // Buat instance axios dengan URL yang dipilih
      const axiosInstance = createAxiosInstance(url);
      
      const res = await axiosInstance.post("/api/register", { username, email, password });
      const { token, refreshToken, user } = res.data;

      // Update state
      setToken(token);
      setRefreshToken(refreshToken);
      setUser(user);

      // Simpan ke session storage
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("refreshToken", refreshToken);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("remember", "false");

      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Registration failed" 
      };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk melakukan login - dimodifikasi untuk menghilangkan parameter customBackendUrl
  const login = async (username, password, remember) => {
    try {
      setLoading(true);
      
      // Menggunakan backendUrl tetap
      const url = backendUrl;
      
      // Buat instance axios dengan URL yang dipilih
      const axiosInstance = createAxiosInstance(url);
      
      console.log("Logging in with:", { username, password, remember, backendUrl: url });
      
      const res = await axiosInstance.post("/api/login", { username, password });
      
      const { token, refreshToken, user } = res.data;

      // Pastikan field hasActiveSubscription selalu ada
      if (user) {
        if (user.hasActiveSubscription === undefined) {
          // Jika tidak ada informasi langganan, cek dari data subscription
          user.hasActiveSubscription = Boolean(user.Subscriptions && user.Subscriptions.length > 0);
        }
      }

      // Update state
      setToken(token);
      setRefreshToken(refreshToken);
      setUser(user);

      // Simpan data berdasarkan remember
      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("remember", "true");
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("refreshToken", refreshToken);
        sessionStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("remember", "false");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Login failed" 
      };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk logout
  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    
    // Hapus token dan data user dari storage
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("remember");
    sessionStorage.removeItem("remember");
    
    // JANGAN hapus backendUrl agar user bisa login kembali ke backend yang sama
  };

  // Fungsi untuk update data user
  const updateUserData = (userData) => {
    setUser(userData);
    
    // Update backend URL jika ada perubahan
    if (userData.backend_url && userData.backend_url !== backendUrl) {
      setBackendUrl(userData.backend_url);
      localStorage.setItem("backendUrl", userData.backend_url);
    }
    
    // Simpan ke storage
    if (localStorage.getItem("remember") === "true") {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // Fungsi untuk update backend URL
  const updateBackendUrl = async (newBackendUrl) => {
    try {
      setLoading(true);
      
      // Buat instance axios dengan backendUrl saat ini
      const axiosInstance = createAxiosInstance(backendUrl);
      
      // Jika user sudah login, simpan backend_url ke profil user
      if (token && user) {
        try {
          const response = await axiosInstance.put('/api/user/backend-url', { 
            backend_url: newBackendUrl 
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.status === 200) {
            // Update user data dengan backend URL baru
            const updatedUser = { ...user, backend_url: newBackendUrl };
            setUser(updatedUser);
            
            // Update di storage
            if (localStorage.getItem("remember") === "true") {
              localStorage.setItem("user", JSON.stringify(updatedUser));
            } else {
              sessionStorage.setItem("user", JSON.stringify(updatedUser));
            }
          }
        } catch (error) {
          console.error('Error updating backend URL on server:', error);
          // Tetap lanjutkan untuk update URL lokal meskipun gagal update di server
        }
      }
      
      // Update state dan localStorage
      setBackendUrl(newBackendUrl);
      localStorage.setItem("backendUrl", newBackendUrl);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating backend URL:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to update backend URL" 
      };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mencoba koneksi ke backend
  const testBackendConnection = async (url) => {
    try {
      const testUrl = url || backendUrl;
      const response = await fetch(`${testUrl}/api/test`);
      
      if (!response.ok) {
        throw new Error(`Connection failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.message === "API is working") {
        return { success: true, message: "Connection successful" };
      } else {
        throw new Error("Invalid response from backend");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      return {
        success: false,
        error: `Connection failed: ${error.message}`
      };
    }
  };

  // Berikan context ke komponen children
  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      backendUrl,
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