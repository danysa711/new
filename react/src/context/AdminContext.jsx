// react/src/context/AdminContext.jsx
import { createContext, useState, useContext } from "react";
import axiosInstance from "../services/axios";
import { AuthContext } from "./AuthContext";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const { isAdmin } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [tripaySettings, setTripaySettings] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch all users (admin only)
  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/users");
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };
  
  // Fetch all subscriptions (admin only)
  const fetchSubscriptions = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/subscriptions");
      setSubscriptions(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setLoading(false);
    }
  };
  
  // Fetch all subscription plans (admin only)
  const fetchSubscriptionPlans = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/subscription-plans");
      setSubscriptionPlans(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      setLoading(false);
    }
  };
  
  // Fetch all payment methods (admin only)
  const fetchPaymentMethods = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/payment-methods");
      setPaymentMethods(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setLoading(false);
    }
  };
  
  // Fetch Tripay settings (admin only)
  const fetchTripaySettings = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/tripay/settings");
      setTripaySettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Tripay settings:", error);
      setLoading(false);
    }
  };
  
  // Create user (admin only)
  const createUser = async (userData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/users", userData);
      setLoading(false);
      
      // Refresh users list
      fetchUsers();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating user:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to create user" 
      };
    }
  };
  
  // Update user (admin only)
  const updateUser = async (userId, userData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/users/${userId}`, userData);
      setLoading(false);
      
      // Refresh users list
      fetchUsers();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating user:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to update user" 
      };
    }
  };
  
  // Delete user (admin only)
  const deleteUser = async (userId) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/api/users/${userId}`);
      setLoading(false);
      
      // Refresh users list
      fetchUsers();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error deleting user:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to delete user" 
      };
    }
  };
  
  // Create subscription (admin only)
  const createSubscription = async (subscriptionData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/subscriptions", subscriptionData);
      setLoading(false);
      
      // Refresh subscriptions list
      fetchSubscriptions();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating subscription:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to create subscription" 
      };
    }
  };
  
  // Update subscription (admin only)
  const updateSubscription = async (subscriptionId, subscriptionData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/subscriptions/${subscriptionId}`, subscriptionData);
      setLoading(false);
      
      // Refresh subscriptions list
      fetchSubscriptions();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating subscription:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to update subscription" 
      };
    }
  };
  
  // Delete subscription (admin only)
  const deleteSubscription = async (subscriptionId) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/api/subscriptions/${subscriptionId}`);
      setLoading(false);
      
      // Refresh subscriptions list
      fetchSubscriptions();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error deleting subscription:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to delete subscription" 
      };
    }
  };
  
  // Approve payment (admin only)
  const approvePayment = async (subscriptionId) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/api/subscriptions/${subscriptionId}/approve`);
      setLoading(false);
      
      // Refresh subscriptions list
      fetchSubscriptions();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error approving payment:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to approve payment" 
      };
    }
  };
  
  // Create subscription plan (admin only)
  const createSubscriptionPlan = async (planData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/subscription-plans", planData);
      setLoading(false);
      
      // Refresh subscription plans list
      fetchSubscriptionPlans();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to create subscription plan" 
      };
    }
  };
  
  // Update subscription plan (admin only)
  const updateSubscriptionPlan = async (planId, planData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/subscription-plans/${planId}`, planData);
      setLoading(false);
      
      // Refresh subscription plans list
      fetchSubscriptionPlans();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to update subscription plan" 
      };
    }
  };
  
  // Delete subscription plan (admin only)
  const deleteSubscriptionPlan = async (planId) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/api/subscription-plans/${planId}`);
      setLoading(false);
      
      // Refresh subscription plans list
      fetchSubscriptionPlans();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to delete subscription plan" 
      };
    }
  };
  
  // Create payment method (admin only)
  const createPaymentMethod = async (methodData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/payment-methods", methodData);
      setLoading(false);
      
      // Refresh payment methods list
      fetchPaymentMethods();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating payment method:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to create payment method" 
      };
    }
  };
  
  // Update payment method (admin only)
  const updatePaymentMethod = async (methodId, methodData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/payment-methods/${methodId}`, methodData);
      setLoading(false);
      
      // Refresh payment methods list
      fetchPaymentMethods();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating payment method:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to update payment method" 
      };
    }
  };
  
  // Delete payment method (admin only)
  const deletePaymentMethod = async (methodId) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/api/payment-methods/${methodId}`);
      setLoading(false);
      
      // Refresh payment methods list
      fetchPaymentMethods();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error deleting payment method:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to delete payment method" 
      };
    }
  };
  
  // Update Tripay settings (admin only)
  const updateTripaySettings = async (settingsData) => {
    if (!isAdmin) return { success: false, error: "Unauthorized" };
    
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/tripay/settings", settingsData);
      setLoading(false);
      
      // Refresh Tripay settings
      fetchTripaySettings();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating Tripay settings:", error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to update Tripay settings" 
      };
    }
  };

  return (
    <AdminContext.Provider
      value={{
        users,
        subscriptions,
        subscriptionPlans,
        paymentMethods,
        tripaySettings,
        loading,
        fetchUsers,
        fetchSubscriptions,
        fetchSubscriptionPlans,
        fetchPaymentMethods,
        fetchTripaySettings,
        createUser,
        updateUser,
        deleteUser,
        createSubscription,
        updateSubscription,
        deleteSubscription,
        approvePayment,
        createSubscriptionPlan,
        updateSubscriptionPlan,
        deleteSubscriptionPlan,
        createPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        updateTripaySettings
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};