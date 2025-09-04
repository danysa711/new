// services/qris-service.js

import axiosInstance from './axios';

// Mendapatkan pengaturan QRIS
export const getQrisSettings = async () => {
  try {
    // Coba beberapa endpoint yang berbeda
    const endpoints = [
      '/api/settings/qris-public',
      '/api/qris-settings/public',
      '/api/qris-settings?admin=true'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Mencoba endpoint QRIS settings: ${endpoint}`);
        const response = await axiosInstance.get(endpoint);
        if (response.data) {
          console.log(`Berhasil mendapatkan data dari ${endpoint}`);
          return response.data;
        }
      } catch (err) {
        console.warn(`Gagal pada endpoint ${endpoint}:`, err);
      }
    }
    
    // Fallback jika semua endpoint gagal
    console.warn('Semua endpoint QRIS settings gagal, menggunakan data default');
    return {
      merchant_name: "Kinterstore",
      qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
      is_active: true,
      expiry_hours: 24,
      instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
    };
  } catch (error) {
    console.error('Error mendapatkan pengaturan QRIS:', error);
    // Tetap berikan data default untuk fallback UI
    return {
      merchant_name: "Kinterstore",
      qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
      is_active: true,
      expiry_hours: 24,
      instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
    };
  }
};

// Membuat pembayaran QRIS baru
export const createQrisPayment = async (planId) => {
  try {
    const response = await axiosInstance.post('/api/qris-payment', { plan_id: planId });
    return response.data;
  } catch (error) {
    console.error('Error membuat pembayaran QRIS:', error);
    throw error;
  }
};

// Upload bukti pembayaran
export const uploadPaymentProof = async (reference, file) => {
  try {
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    const response = await axiosInstance.post(
      `/api/qris-payment/${reference}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error upload bukti pembayaran:', error);
    
    // Coba dengan metode base64
    try {
      console.log("Mencoba upload dengan metode base64...");
      
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      const base64Content = base64Data.split(',')[1]; // Ambil bagian base64 saja
      
      const response = await axiosInstance.post(
        `/api/qris-payment/${reference}/upload-base64`,
        {
          payment_proof_base64: base64Content,
          file_type: file.type
        }
      );
      
      return response.data;
    } catch (base64Error) {
      console.error('Error upload dengan metode base64:', base64Error);
      throw base64Error;
    }
  }
};

// Mendapatkan riwayat pembayaran QRIS
export const getQrisPayments = async () => {
  try {
    // Tambahkan timestamp untuk menghindari cache
    const timestamp = Date.now();
    const response = await axiosInstance.get(`/api/qris-payments?ts=${timestamp}`);
    
    // Pastikan response.data adalah array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data; // Untuk kasus response berisi { data: [...] }
    } else {
      console.warn("Respons QRIS payments bukan array, mengembalikan array kosong");
      return [];
    }
  } catch (error) {
    console.error('Error mendapatkan riwayat pembayaran QRIS:', error);
    return []; // Return array kosong jika error
  }
};

// Memeriksa status pembayaran
export const checkPaymentStatus = async (reference) => {
  try {
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

// Trigger pembaruan pembayaran
export const triggerPaymentUpdate = async (reference) => {
  try {
    console.log(`Triggering payment update for reference: ${reference}`);
    const response = await axiosInstance.post(`/api/qris-payment/${reference}/check`);
    return response.data;
  } catch (error) {
    console.error('Error triggering payment update:', error);
    return {
      success: false,
      message: 'Gagal memeriksa status pembayaran',
      newStatus: null
    };
  }
};

// Simulasi subscribe to payment updates
export const subscribeToPaymentUpdates = (callback) => {
  console.log("Subscribed to payment updates");
  // Dummy function, returns unsubscribe function
  return () => console.log("Unsubscribed from payment updates");
};

// Mendapatkan status Tripay
export const getTripayStatus = async (reference) => {
  console.log(`Getting Tripay status for reference: ${reference}`);
  // Dummy response
  return {
    success: true,
    message: "Status diproses",
    status: "PENDING"
  };
};