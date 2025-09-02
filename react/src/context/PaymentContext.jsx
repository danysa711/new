import React, { createContext, useState, useEffect } from "react";
import axiosInstance from '../services/axios';
import { message } from 'antd';

// Konstanta untuk strategi retry
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 detik

export const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'available', 'unavailable'

  // Fungsi untuk melakukan retry request dengan exponential backoff
  const fetchWithRetry = async (apiCall, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
    try {
      return await apiCall();
    } catch (error) {
      if (retries === 0) {
        throw error;
      }
      
      console.log(`Retry attempt remaining: ${retries}. Retrying in ${delay}ms...`);
      
      // Tunggu sebelum retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry dengan delay yang lebih lama
      return fetchWithRetry(apiCall, retries - 1, delay * 2);
    }
  };

  // Fungsi untuk memuat transaksi aktif
  const loadPendingTransactions = async () => {
    try {
      const response = await fetchWithRetry(
        () => axiosInstance.get('/api/qris-payments')
      );
      
      if (response.status === 200 && Array.isArray(response.data)) {
        // Filter hanya transaksi yang masih menunggu
        const pendingQris = response.data.filter(payment => payment.status === 'UNPAID');
        setPendingTransactions(pendingQris);
        setApiStatus('available');
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      setApiStatus('unavailable');
      message.error('Gagal memuat transaksi - silakan coba lagi nanti', 3);
    }
  };

  // Fungsi untuk memuat riwayat transaksi
  const loadTransactionHistory = async () => {
    try {
      const response = await fetchWithRetry(
        () => axiosInstance.get('/api/qris-payments')
      );
      
      if (response.status === 200 && Array.isArray(response.data)) {
        setTransactionHistory(response.data);
        setApiStatus('available');
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setApiStatus('unavailable');
      message.error('Gagal memuat riwayat transaksi - silakan coba lagi nanti', 3);
    }
  };

  // Fungsi untuk memeriksa status transaksi
  const checkTransactionStatus = async (reference) => {
    try {
      const response = await fetchWithRetry(
        () => axiosInstance.get(`/api/qris-payment/${reference}/check`)
      );
      
      if (response.data && response.data.success) {
        // Refresh data jika status berubah
        await loadPendingTransactions();
        await loadTransactionHistory();
        return {
          success: true,
          message: response.data.message,
          newStatus: response.data.newStatus
        };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Status belum berubah'
      };
    } catch (error) {
      console.error('Error checking transaction status:', error);
      message.error('Gagal memeriksa status transaksi - silakan coba lagi nanti', 3);
      return {
        success: false,
        message: 'Gagal memeriksa status transaksi'
      };
    }
  };

  // Efek untuk memuat data awal
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setApiStatus('checking');
      
      try {
        // Muat data transaksi
        await loadPendingTransactions();
        await loadTransactionHistory();
      } catch (error) {
        console.error('Error loading initial payment data:', error);
        setApiStatus('unavailable');
        message.error('Gagal memuat data pembayaran - silakan coba lagi nanti', 3);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Interval untuk mengecek transaksi aktif setiap 30 detik
    // Tapi hanya jika API tersedia
    let intervalId = null;
    
    if (apiStatus === 'available') {
      intervalId = setInterval(() => {
        loadPendingTransactions();
      }, 30000);
    }
    
    // Cleanup pada unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [apiStatus]);

  // Metode manual refresh untuk pengguna
  const manualRefresh = async () => {
    message.info('Memperbarui data transaksi...', 1);
    setLoading(true);
    
    try {
      await loadPendingTransactions();
      await loadTransactionHistory();
      message.success('Data transaksi berhasil diperbarui', 2);
    } catch (error) {
      console.error('Error manually refreshing data:', error);
      message.error('Gagal memperbarui data - silakan coba lagi nanti', 3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentContext.Provider value={{
      loading,
      pendingTransactions,
      transactionHistory,
      apiStatus,
      refreshTransactions: loadPendingTransactions,
      refreshHistory: loadTransactionHistory,
      checkTransactionStatus,
      manualRefresh
    }}>
      {children}
    </PaymentContext.Provider>
  );
};