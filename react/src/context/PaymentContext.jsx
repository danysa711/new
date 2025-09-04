// src/context/PaymentContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axios";
import { message } from 'antd';
import { AuthContext } from "./AuthContext"; // ✅ tambahan

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');

  const { user } = useContext(AuthContext); // ✅ ambil user

  const fetchWithRetry = async (apiCall, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
    try {
      return await apiCall();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(apiCall, retries - 1, delay * 2);
    }
  };

  const triggerPaymentUpdate = async (reference) => {
    try {
      const response = await axiosInstance.post(`/api/qris-payment/${reference}/check`, {
        user_id: user?.id // ✅ sertakan user_id
      });
      return response.data;
    } catch (error) {
      console.error('Error memicu pembaruan pembayaran:', error);
      return { success: false, message: 'Gagal memeriksa status pembayaran', newStatus: null };
    }
  };

  const checkPaymentStatus = async (reference) => {
    try {
      const response = await axiosInstance.get(`/api/qris-payment/${reference}/check`, {
        params: { user_id: user?.id } // ✅ sertakan user_id
      });
      return response.data;
    } catch (error) {
      console.error('Error memeriksa status pembayaran:', error);
      return { success: false, message: 'Gagal memeriksa status pembayaran' };
    }
  };

  const loadPendingTransactions = async () => {
    try {
      setLoading(true);
      setApiStatus('checking');
      const response = await axiosInstance.get('/api/qris-payments', {
        params: { user_id: user?.id }, // ✅ sertakan user_id
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        timeout: 15000
      });
      const pendingQris = Array.isArray(response.data) ?
        response.data.filter(payment => payment.status === 'UNPAID') : [];
      setPendingTransactions(pendingQris);
      setApiStatus('available');
      return pendingQris;
    } catch (error) {
      console.error('Error memuat transaksi tertunda:', error);
      setPendingTransactions([]);
      setApiStatus('unavailable');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetchWithRetry(() => 
        axiosInstance.get('/api/qris-payments', { params: { user_id: user?.id } }) // ✅ sertakan user_id
      );
      if (response.status === 200 && Array.isArray(response.data)) {
        setTransactionHistory(response.data);
        setApiStatus('available');
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error memuat riwayat transaksi:', error);
      setApiStatus('unavailable');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadTransactionHistory(), loadPendingTransactions()]);
    })();
  }, [user?.id]);

  return (
    <PaymentContext.Provider value={{
      loading,
      pendingTransactions,
      transactionHistory,
      apiStatus,
      triggerPaymentUpdate,
      checkPaymentStatus,
      loadPendingTransactions,
      loadTransactionHistory
    }}>
      {children}
    </PaymentContext.Provider>
  );
};
