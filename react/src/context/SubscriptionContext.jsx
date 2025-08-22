// react/src/context/SubscriptionContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axios";
import { AuthContext } from "./AuthContext";

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    hasActiveSubscription: false,
    subscription: null,
    loading: true,
    error: null
  });
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // Fetch subscription status
  const checkSubscriptionStatus = async () => {
    if (!token) {
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        loading: false,
        error: null
      });
      return;
    }
    
    try {
      setSubscriptionStatus(prev => ({ ...prev, loading: true, error: null }));
      const response = await axiosInstance.get("/api/user/subscription/status");
      setSubscriptionStatus({
        hasActiveSubscription: response.data.hasActiveSubscription,
        subscription: response.data.subscription,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        loading: false,
        error: error.response?.data?.error || "Failed to check subscription status"
      });
    }
  };
  
  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      const response = await axiosInstance.get("/api/subscription-plans");
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
    }
  };
  
  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const response = await axiosInstance.get("/api/payment-methods");
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  useEffect(() => {
    if (token) {
      checkSubscriptionStatus();
      fetchPlans();
      fetchPaymentMethods();
    }
  }, [token]);

  // Extend subscription
  const extendSubscription = async (planId, paymentMethod) => {
    try {
      const response = await axiosInstance.post("/api/user/subscription/extend", {
        plan_id: planId,
        payment_method: paymentMethod
      });
      
      // Refresh subscription status
      checkSubscriptionStatus();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error extending subscription:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to extend subscription" 
      };
    }
  };
  
  // Cancel subscription
  const cancelSubscription = async (subscriptionId) => {
    try {
      const response = await axiosInstance.post(`/api/user/subscription/cancel/${subscriptionId}`);
      
      // Refresh subscription status
      checkSubscriptionStatus();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to cancel subscription" 
      };
    }
  };
  
  // Request trial subscription
  const requestTrial = async (message) => {
    try {
      const response = await axiosInstance.post("/api/user/subscription/trial", { message });
      
      // Refresh subscription status
      checkSubscriptionStatus();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error requesting trial:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Failed to request trial" 
      };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        plans,
        paymentMethods,
        checkSubscriptionStatus,
        extendSubscription,
        cancelSubscription,
        requestTrial,
        isUrlActive: user?.url_active || false
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};