// File: api/api-service.js

import { fetchWithAuth, findOrders } from './api-adapter.js';

/**
 * API Service - Layanan untuk operasi API umum
 * 
 * Menyediakan fungsi-fungsi untuk:
 * 1. Mengambil data (GET)
 * 2. Membuat data baru (POST)
 * 3. Memperbarui data (PUT)
 * 4. Menghapus data (DELETE)
 */

// ============= SOFTWARE API =============

// Mendapatkan semua software
export const getAllSoftware = async () => {
  return fetchWithAuth('/api/software');
};

// Mendapatkan software berdasarkan ID
export const getSoftwareById = async (id) => {
  return fetchWithAuth(`/api/software/${id}`);
};

// Membuat software baru
export const createSoftware = async (data) => {
  return fetchWithAuth('/api/software', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Memperbarui software
export const updateSoftware = async (id, data) => {
  return fetchWithAuth(`/api/software/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Menghapus software
export const deleteSoftware = async (id) => {
  return fetchWithAuth(`/api/software/${id}`, {
    method: 'DELETE'
  });
};

// ============= SOFTWARE VERSION API =============

// Mendapatkan semua versi software
export const getAllSoftwareVersions = async () => {
  return fetchWithAuth('/api/software-versions');
};

// Mendapatkan versi software berdasarkan ID
export const getSoftwareVersionById = async (id) => {
  return fetchWithAuth(`/api/software-versions/${id}`);
};

// Mendapatkan versi software berdasarkan ID software
export const getSoftwareVersionsBySoftwareId = async (softwareId) => {
  return fetchWithAuth(`/api/software-versions/${softwareId}/versions`);
};

// Membuat versi software baru
export const createSoftwareVersion = async (data) => {
  return fetchWithAuth('/api/software-versions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Memperbarui versi software
export const updateSoftwareVersion = async (id, data) => {
  return fetchWithAuth(`/api/software-versions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Menghapus versi software
export const deleteSoftwareVersion = async (id) => {
  return fetchWithAuth(`/api/software-versions/${id}`, {
    method: 'DELETE'
  });
};

// ============= LICENSE API =============

// Mendapatkan semua lisensi
export const getAllLicenses = async () => {
  return fetchWithAuth('/api/licenses');
};

// Mendapatkan semua lisensi yang tersedia
export const getAllAvailableLicenses = async () => {
  return fetchWithAuth('/api/licenses/available/all');
};

// Mendapatkan lisensi berdasarkan ID
export const getLicenseById = async (id) => {
  return fetchWithAuth(`/api/licenses/${id}`);
};

// Membuat lisensi baru
export const createLicense = async (data) => {
  return fetchWithAuth('/api/licenses', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Membuat banyak lisensi sekaligus
export const createMultipleLicenses = async (data) => {
  return fetchWithAuth('/api/licenses-bulk', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Memperbarui lisensi
export const updateLicense = async (id, data) => {
  return fetchWithAuth(`/api/licenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Memperbarui banyak lisensi sekaligus
export const updateMultipleLicenses = async (data) => {
  return fetchWithAuth('/api/licenses-bulk', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Menghapus lisensi
export const deleteLicense = async (id) => {
  return fetchWithAuth(`/api/licenses/${id}`, {
    method: 'DELETE'
  });
};

// Menghapus banyak lisensi sekaligus
export const deleteMultipleLicenses = async (licenses) => {
  return fetchWithAuth('/api/licenses/delete-multiple', {
    method: 'POST',
    body: JSON.stringify({ licenses })
  });
};

// ============= ORDER API =============

// Mendapatkan semua pesanan
export const getAllOrders = async () => {
  return fetchWithAuth('/api/orders');
};

// Mendapatkan pesanan berdasarkan ID
export const getOrderById = async (id) => {
  return fetchWithAuth(`/api/orders/${id}`);
};

// Membuat pesanan baru
export const createOrder = async (data) => {
  return fetchWithAuth('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Memperbarui pesanan
export const updateOrder = async (id, data) => {
  return fetchWithAuth(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Menghapus pesanan
export const deleteOrder = async (id) => {
  return fetchWithAuth(`/api/orders/${id}`, {
    method: 'DELETE'
  });
};

// Mencari pesanan (menggunakan fungsi khusus dari api-adapter.js)
export const searchOrders = async (data) => {
  return findOrders(data);
};

// ============= USER API =============

// Mendapatkan profil user
export const getUserProfile = async () => {
  return fetchWithAuth('/api/user/profile');
};

// Mendapatkan profil user publik
export const getPublicUserProfile = async (slug) => {
  return fetchWithAuth(`/api/user/public/${slug}`);
};

// Memperbarui password user
export const updateUserPassword = async (currentPassword, newPassword) => {
  return fetchWithAuth('/api/user', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  });
};

// Verifikasi password user
export const verifyUserPassword = async (password) => {
  return fetchWithAuth('/api/user/password', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
};

// ============= SUBSCRIPTION API =============

// Mendapatkan semua paket langganan
export const getAllSubscriptionPlans = async () => {
  return fetchWithAuth('/api/subscription-plans');
};

// Mendapatkan langganan user
export const getUserSubscriptions = async () => {
  return fetchWithAuth('/api/subscriptions/user');
};

// ============= SETTINGS API =============

// Mendapatkan pengaturan WhatsApp trial
export const getWhatsAppTrialSettings = async () => {
  return fetchWithAuth('/api/settings/whatsapp-trial');
};