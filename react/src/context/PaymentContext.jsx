import React, { createContext, useState, useEffect } from "react";
import { 
  getAllAvailablePaymentMethods, 
  subscribeToPaymentUpdates, 
  getTripayStatus 
} from "../utils/paymentStorage";
import axiosInstance from '../services/axios';

export const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [tripayEnabled, setTripayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Fungsi untuk memuat metode pembayaran
  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      
      // Coba ambil dari API
      try {
        const response = await axiosInstance.get('/api/payment-methods');
        if (response.data && Array.isArray(response.data)) {
          setPaymentMethods(response.data);
        } else {
          // Jika format tidak sesuai, gunakan dari localStorage
          setPaymentMethods(getAllAvailablePaymentMethods());
        }
      } catch (error) {
        console.warn('Error fetching payment methods from API, using localStorage:', error);
        setPaymentMethods(getAllAvailablePaymentMethods());
      }
      
      // Cek status Tripay
      try {
        const response = await axiosInstance.get('/api/settings/tripay-status');
        setTripayEnabled(response.data.enabled);
      } catch (error) {
        console.warn('Error fetching Tripay status from API, using localStorage:', error);
        setTripayEnabled(getTripayStatus());
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setLoading(false);
    }
  };

  // Fungsi untuk memuat transaksi aktif
  const loadPendingTransactions = async () => {
    try {
      const response = await axiosInstance.get('/api/transactions/active');
      if (response.status === 200 && Array.isArray(response.data)) {
        setPendingTransactions(response.data);
      }
    } catch (error) {
      console.warn('Error loading pending transactions:', error);
    }
  };

  // Fungsi untuk memuat riwayat transaksi
  const loadTransactionHistory = async () => {
    try {
      const response = await axiosInstance.get('/api/transactions/history');
      if (response.status === 200 && Array.isArray(response.data)) {
        setTransactionHistory(response.data);
      }
    } catch (error) {
      console.warn('Error loading transaction history:', error);
    }
  };

  // Fungsi untuk memeriksa status transaksi
  const checkTransactionStatus = async (reference) => {
    try {
      const response = await axiosInstance.get(`/api/transactions/${reference}/check`);
      
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
      return {
        success: false,
        message: 'Gagal memeriksa status transaksi'
      };
    }
  };

  // Fungsi untuk membuat transaksi manual
  const createManualTransaction = async (data) => {
    try {
      const response = await axiosInstance.post('/api/transactions/manual', data);
      
      if (response.data && response.data.success) {
        // Refresh data transaksi aktif
        await loadPendingTransactions();
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Gagal membuat transaksi'
      };
    } catch (error) {
      console.error('Error creating manual transaction:', error);
      return {
        success: false,
        message: 'Gagal membuat transaksi: ' + (error.response?.data?.message || error.message)
      };
    }
  };

  // Fungsi untuk membuat transaksi Tripay
  const createTripayTransaction = async (data) => {
    try {
      const response = await axiosInstance.post('/api/tripay/create-transaction', data);
      
      if (response.data && response.data.success) {
        // Refresh data transaksi aktif
        await loadPendingTransactions();
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        message: response.data?.message || 'Gagal membuat transaksi'
      };
    } catch (error) {
      console.error('Error creating Tripay transaction:', error);
      return {
        success: false,
        message: 'Gagal membuat transaksi: ' + (error.response?.data?.message || error.message)
      };
    }
  };

  // Efek untuk memuat data awal dan subscribe ke perubahan
  useEffect(() => {
    // Memuat data awal
    loadPaymentMethods();
    loadPendingTransactions();
    loadTransactionHistory();
    
    // Subscribe ke perubahan pengaturan pembayaran
    const unsubscribe = subscribeToPaymentUpdates((event) => {
      if (event.action === 'methods_updated' || 
          event.action === 'tripay_status_updated' || 
          event.action === 'tripay_config_updated') {
        // Refresh data
        loadPaymentMethods();
      }
    });
    
    // Interval untuk mengecek transaksi aktif setiap 30 detik
    const transactionInterval = setInterval(() => {
      loadPendingTransactions();
    }, 30000);
    
    // Cleanup pada unmount
    return () => {
      unsubscribe();
      clearInterval(transactionInterval);
    };
  }, []);

  return (
    <PaymentContext.Provider value={{
      paymentMethods,
      tripayEnabled,
      loading,
      pendingTransactions,
      transactionHistory,
      refreshMethods: loadPaymentMethods,
      refreshTransactions: loadPendingTransactions,
      refreshHistory: loadTransactionHistory,
      checkTransactionStatus,
      createManualTransaction,
      createTripayTransaction
    }}>
      {children}
    </PaymentContext.Provider>
  );
};