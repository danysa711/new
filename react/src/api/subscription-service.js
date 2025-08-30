// src/api/subscription-service.js

import axiosInstance from './axios';
import { API_ENDPOINTS } from './config';

/**
 * Service untuk manajemen langganan
 */

// Mendapatkan semua paket langganan
export const getAllSubscriptionPlans = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTION_PLANS);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Mendapatkan paket langganan berdasarkan ID
export const getSubscriptionPlanById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.SUBSCRIPTION_PLANS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subscription plan with id ${id}:`, error);
    throw error;
  }
};

// Mendapatkan langganan user saat ini
export const getUserSubscriptions = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_SUBSCRIPTIONS);
    return response.data;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }
};

// Mendapatkan langganan berdasarkan ID
export const getSubscriptionById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USER_SUBSCRIPTIONS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subscription with id ${id}:`, error);
    throw error;
  }
};

// Membatalkan langganan
export const cancelSubscription = async (id) => {
  try {
    const response = await axiosInstance.put(`${API_ENDPOINTS.USER_SUBSCRIPTIONS}/${id}/cancel`, {});
    return response.data;
  } catch (error) {
    console.error(`Error canceling subscription with id ${id}:`, error);
    throw error;
  }
};