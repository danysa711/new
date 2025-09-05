// src/context/PaymentContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { message } from 'antd';

// Import layanan QRIS yang telah ditingkatkan
import { 
  getQrisPayments,
  checkPaymentStatus,
  confirmQrisPayment,
  cancelQrisPayment
} from "../services/qris-service-improved";

// Import utilitas API yang telah ditingkatkan
import { makeRequest } from "../api/api-service-enhanced";

export const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  // Context
  const { user, token } = useContext(AuthContext);
  
  // State
  const [loading, setLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'available', 'unavailable'
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);

  // Fungsi untuk memicu pembaruan pembayaran - menggunakan makeRequest yang ditingkatkan
  const triggerPaymentUpdate = async (reference) => {
    try {
      console.log(`Memicu pembaruan pembayaran untuk referensi: ${reference}`);
      
      const result = await makeRequest({
        method: 'POST',
        endpoint: `/api/qris-payment/${reference}/check`,
        showError: false
      });
      
      if (result.success) {
        return result.data;
      } else {
        return {
          success: false,
          message: result.message || 'Gagal memeriksa status pembayaran',
          newStatus: null
        };
      }
    } catch (error) {
      console.error('Error memicu pembaruan pembayaran:', error);
      return {
        success: false,
        message: 'Gagal memeriksa status pembayaran',
        newStatus: null
      };
    }
  };

  // Fungsi untuk memuat transaksi aktif dengan error handling yang lebih baik
  const loadPendingTransactions = async () => {
    try {
      setLoading(true);
      setApiStatus('checking');
      
      // Gunakan layanan yang telah ditingkatkan
      const payments = await getQrisPayments();
      
      // Filter hanya pembayaran yang berstatus UNPAID
      let pendingPayments = payments.filter(payment => payment.status === 'UNPAID');
      
      // Filter hanya pembayaran yang belum kedaluwarsa (kurang dari 1 jam)
      pendingPayments = pendingPayments.filter(payment => {
        const createdAt = new Date(payment.createdAt);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours <= 1;
      });
      
      // Urutkan berdasarkan tanggal terbaru
      pendingPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Batasi hanya 3 pembayaran terbaru
      pendingPayments = pendingPayments.slice(0, 3);
      
      setPendingTransactions(pendingPayments);
      setApiStatus('available');
      setLastRefresh(new Date());
      
      return pendingPayments;
    } catch (error) {
      console.error('Error memuat transaksi tertunda:', error);
      setPendingTransactions([]);
      setApiStatus('unavailable');
      setLastRefresh(new Date());
      setError(error.message || 'Gagal memuat transaksi');
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk memuat riwayat transaksi
  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      
      // Gunakan layanan yang telah ditingkatkan
      const payments = await getQrisPayments();
      
      setTransactionHistory(payments);
      setApiStatus('available');
      setLastRefresh(new Date());
      
      return payments;
    } catch (error) {
      console.error('Error memuat riwayat transaksi:', error);
      setApiStatus('unavailable');
      setLastRefresh(new Date());
      setError(error.message || 'Gagal memuat riwayat transaksi');
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Alias untuk loadTransactionHistory (untuk kompatibilitas)
  const loadTransactionsHistory = async () => {
    return await loadTransactionHistory();
  };

  // Fungsi untuk memeriksa status transaksi
  const checkTransactionStatus = async (reference) => {
    try {
      // Gunakan layanan yang telah ditingkatkan
      const result = await checkPaymentStatus(reference);
      
      if (result && result.success) {
        // Refresh data jika status berubah
        await loadPendingTransactions();
        await loadTransactionHistory();
        return {
          success: true,
          message: result.message,
          newStatus: result.newStatus
        };
      }
      
      return {
        success: false,
        message: result?.message || 'Status belum berubah'
      };
    } catch (error) {
      console.error('Error memeriksa status transaksi:', error);
      return {
        success: false,
        message: 'Gagal memeriksa status transaksi'
      };
    }
  };

  // Efek untuk memuat data awal
  useEffect(() => {
    const fetchInitialData = async () => {
      // Jangan memuat jika tidak ada token atau user
      if (!token || !user) {
        setLoading(false);
        setApiStatus('unavailable');
        return;
      }
      
      setLoading(true);
      setApiStatus('checking');
      
      try {
        // Jalankan kedua fungsi secara bersamaan
        await Promise.all([
          loadPendingTransactions(),
          loadTransactionHistory()
        ]);
      } catch (error) {
        console.error('Error memuat data pembayaran awal:', error);
        setApiStatus('unavailable');
        setError('Gagal memuat data pembayaran');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Interval untuk mengecek transaksi aktif setiap 30 detik
    // Tapi hanya jika API tersedia dan user terautentikasi
    let intervalId = null;
    
    if (token && user && apiStatus === 'available') {
      intervalId = setInterval(() => {
        loadPendingTransactions().catch(err => 
          console.error('Error pada refresh otomatis:', err)
        );
      }, 30000);
    }
    
    // Cleanup pada unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [token, user, apiStatus]);

  // Metode manual refresh untuk pengguna
  const manualRefresh = async () => {
    // Jangan lakukan refresh jika tidak ada token atau user
    if (!token || !user) {
      message.error('Anda perlu login untuk mengakses data pembayaran');
      return;
    }
    
    message.info('Memperbarui data transaksi...', 1);
    setLoading(true);
    
    try {
      await loadPendingTransactions();
      await loadTransactionHistory();
      message.success('Data transaksi berhasil diperbarui', 2);
    } catch (error) {
      console.error('Error saat manual refresh:', error);
      message.error('Gagal memperbarui data - silakan coba lagi nanti', 3);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk membatalkan pembayaran
  const cancelPayment = async (reference) => {
    try {
      setLoading(true);
      
      // Gunakan layanan yang telah ditingkatkan
      const result = await cancelQrisPayment(reference);
      
      if (result.success) {
        message.success('Pembayaran berhasil dibatalkan');
        // Refresh data
        await loadPendingTransactions();
        return { success: true };
      } else {
        throw new Error(result.message || 'Gagal membatalkan pembayaran');
      }
    } catch (error) {
      console.error('Error membatalkan pembayaran:', error);
      message.error(error.message || 'Gagal membatalkan pembayaran');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Nilai yang akan disediakan oleh context
  const contextValue = {
    loading,
    pendingTransactions,
    transactionHistory,
    apiStatus,
    lastRefresh,
    error,
    refreshTransactions: loadPendingTransactions,
    refreshHistory: loadTransactionHistory,
    loadTransactionsHistory,
    checkTransactionStatus,
    triggerPaymentUpdate,
    manualRefresh,
    cancelPayment
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentProvider;