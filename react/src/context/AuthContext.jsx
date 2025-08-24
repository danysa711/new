import { createContext, useState, useEffect, useCallback } from "react";
import { API_URL } from "../services/axios";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("token") || sessionStorage.getItem("token") || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || null
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(false);

  // Listen for subscription status updates from other components
  useEffect(() => {
    const handleUserDataUpdated = (event) => {
      const { user: updatedUser } = event.detail;
      setUser(updatedUser);
    };
    
    window.addEventListener('userDataUpdated', handleUserDataUpdated);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdated);
    };
  }, []);

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
  }, []);

  useEffect(() => {
    // If token exists but no user data, fetch user profile
    if (token && !user) {
      fetchUserProfile();
    }
    
    // Set interval to periodically check subscription status
    const checkInterval = setInterval(() => {
      if (token && user) {
        fetchUserProfile();
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
    
    return () => clearInterval(checkInterval);
  }, [token]);

  const fetchUserProfile = useCallback(async () => {
  try {
    setLoading(true);
    
    // Tambahkan timeout yang lebih pendek
    const res = await axios.get(`${API_URL}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 5000 // 5 detik timeout
    }).catch(error => {
      console.error("Profile fetch error:", error.message);
      throw error;
    });
      const userData = res.data.user;
      
      // Check if subscription status has changed
      if (user && user.hasActiveSubscription !== userData.hasActiveSubscription) {
        console.log('Subscription status changed:', 
          user.hasActiveSubscription ? 'active → inactive' : 'inactive → active');
        
        // Dispatch event for ConnectionContext to update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('subscriptionStatusChanged', { 
            detail: { 
              status: userData.hasActiveSubscription ? 'active' : 'expired' 
            } 
          }));
        }
      }
      
      // If we got a new token in the response, update it
      if (res.data.token) {
        setToken(res.data.token);
        if (localStorage.getItem("remember") === "true") {
          localStorage.setItem("token", res.data.token);
        } else {
          sessionStorage.setItem("token", res.data.token);
        }
      }
      
      setUser(userData);
      
      // Save user data to storage
      if (localStorage.getItem("remember") === "true") {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        sessionStorage.setItem("user", JSON.stringify(userData));
      }
      
      return userData;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      
      if (error.code === "ERR_NETWORK" || error.message.includes("Network Error")) {
      // Jangan logout pada network error, biarkan retry
      return null;
    }
      // If fetch fails due to invalid token, logout
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/register`, { username, email, password });
      const { token, refreshToken, user } = res.data;

      setToken(token);
      setRefreshToken(refreshToken);
      setUser(user);

      // Store in session storage by default for new registrations
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

  const login = async (username, password, remember) => {
    try {
      setLoading(true);
      console.log("Logging in with:", { username, password, remember });
      console.log("API URL:", API_URL);
      
      const res = await axios.post(`${API_URL}/api/login`, { username, password });
      console.log("Login response:", res.data);
      
      const { token, refreshToken, user } = res.data;

      setToken(token);
      setRefreshToken(refreshToken);
      setUser(user);

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

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("remember");
    sessionStorage.removeItem("remember");
  };

  const updateUserData = (userData) => {
    setUser(userData);
    if (localStorage.getItem("remember") === "true") {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      refreshToken, 
      token, 
      user, 
      login, 
      logout, 
      register, 
      loading,
      updateUserData,
      fetchUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};