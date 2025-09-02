// src/api/order-service.js

import axiosInstance, { findOrders as findOrdersBase } from './axios';
import { API_ENDPOINTS } from './config';

/**
 * Service untuk manajemen pesanan
 */

// Mendapatkan semua pesanan
export const getAllOrders = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.ORDERS);
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Mendapatkan pesanan berdasarkan ID
export const getOrderById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.ORDERS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error);
    throw error;
  }
};

// Membuat pesanan baru
export const createOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.ORDERS, orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Memperbarui pesanan
export const updateOrder = async (id, orderData) => {
  try {
    const response = await axiosInstance.put(`${API_ENDPOINTS.ORDERS}/${id}`, orderData);
    return response.data;
  } catch (error) {
    console.error(`Error updating order with id ${id}:`, error);
    throw error;
  }
};

// Menghapus pesanan
export const deleteOrder = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.ORDERS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting order with id ${id}:`, error);
    throw error;
  }
};

// Mencari pesanan
export const findOrders = async (orderData) => {
  return findOrdersBase(orderData);
};

// Mendapatkan statistik penggunaan pesanan
export const getOrderUsage = async (filter = {}) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.ORDERS_USAGE, filter);
    return response.data;
  } catch (error) {
    console.error('Error fetching order usage:', error);
    throw error;
  }
};

// Mendapatkan jumlah pesanan
export const getOrderCount = async (filter = {}) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.ORDERS_COUNT, filter);
    return response.data;
  } catch (error) {
    console.error('Error fetching order count:', error);
    throw error;
  }
};