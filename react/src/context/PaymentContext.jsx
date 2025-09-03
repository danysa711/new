// src/context/PaymentContext.jsx

import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../services/axios";
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
      
      console.log(`Sisa percobaan: ${retries}. Mencoba ulang dalam ${delay}ms...`);
      
      // Tunggu sebelum retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry dengan delay yang lebih lama
      return fetchWithRetry(apiCall, retries - 1, delay * 2);
    }
  };

  // Fungsi untuk memicu pembaruan pembayaran - definisikan sebagai variabel di dalam komponen
  const triggerPaymentUpdate = async (reference) => {
    try {
      console.log(`Memicu pembaruan pembayaran untuk referensi: ${reference}`);
      const response = await axiosInstance.post(`/api/qris-payment/${reference}/check`);
      return response.data;
    } catch (error) {
      console.error('Error memicu pembaruan pembayaran:', error);
      return {
        success: false,
        message: 'Gagal memeriksa status pembayaran',
        newStatus: null
      };
    }
  };
  
  // Fungsi untuk memeriksa status pembayaran - definisikan sebagai variabel di dalam komponen
  const checkPaymentStatus = async (reference) => {
    try {
      console.log(`Memeriksa status pembayaran untuk referensi: ${reference}`);
      const response = await axiosInstance.get(`/api/qris-payment/${reference}/check`);
      return response.data;
    } catch (error) {
      console.error('Error memeriksa status pembayaran:', error);
      return {
        success: false,
        message: 'Gagal memeriksa status pembayaran'
      };
    }
  };

  // Fungsi untuk memuat transaksi aktif
  const loadPendingTransactions = async () => {
    try {
      setLoading(true);
      setApiStatus('checking');
      
      // Batasi jumlah transaksi yang diminta untuk mengurangi beban server
      const params = { limit: 10 };
      
      // Tambahkan cache control untuk mencegah cache
      const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' };
      
      let success = false;
      let retries = 0;
      const maxRetries = 3;
      
      while (!success && retries < maxRetries) {
        try {
          // Tambahkan delay progresif antara percobaan
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
          }
          
          const response = await axiosInstance.get('/api/qris-payments', {
            params,
            headers,
            timeout: 15000 + (retries * 5000) // Tambahkan timeout yang lebih lama untuk setiap percobaan
          });
          
          if (response.data) {
            // Filter hanya transaksi yang masih menunggu
            const pendingQris = Array.isArray(response.data) ? 
              response.data.filter(payment => payment.status === 'UNPAID') : 
              [];
            
            setPendingTransactions(pendingQris);
            setApiStatus('available');
            success = true;
            return pendingQris;
          }
        } catch (error) {
          retries++;
          console.warn(`Percobaan ${retries}/${maxRetries} gagal:`, error);
          
          if (retries >= maxRetries) {
            console.error('Semua percobaan gagal untuk memuat transaksi tertunda');
            // Tetap gunakan data kosong agar UI tidak rusak
            setPendingTransactions([]);
            setApiStatus('unavailable');
            return [];
          }
        }
      }
      
      return []; // Return default jika loop berakhir tanpa success
    } catch (error) {
      console.error('Error memuat transaksi tertunda:', error);
      setPendingTransactions([]);
      setApiStatus('unavailable');
      message.error('Gagal memuat transaksi - silakan coba lagi nanti', 3);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk memuat riwayat transaksi
  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      
      const response = await fetchWithRetry(
        () => axiosInstance.get('/api/qris-payments')
      );
      
      if (response.status === 200 && Array.isArray(response.data)) {
        setTransactionHistory(response.data);
        setApiStatus('available');
        return response.data;
      }
      
      return []; // Return array kosong jika response tidak sesuai
    } catch (error) {
      console.error('Error memuat riwayat transaksi:', error);
      setApiStatus('unavailable');
      message.error('Gagal memuat riwayat transaksi - silakan coba lagi nanti', 3);
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
      // Gunakan fungsi checkPaymentStatus yang telah didefinisikan
      const result = await fetchWithRetry(() => checkPaymentStatus(reference));
      
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
        // Jalankan kedua fungsi secara bersamaan
        await Promise.all([
          loadTransactionHistory(),
          loadPendingTransactions()
        ]);
      } catch (error) {
        console.error('Error memuat data pembayaran awal:', error);
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
      console.error('Error saat manual refresh:', error);
      message.error('Gagal memperbarui data - silakan coba lagi nanti', 3);
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
    refreshTransactions: loadPendingTransactions,
    refreshHistory: loadTransactionHistory,
    loadTransactionsHistory,
    checkTransactionStatus,
    triggerPaymentUpdate, // Ekspos fungsi yang didefinisikan di dalam komponen
    manualRefresh
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
};