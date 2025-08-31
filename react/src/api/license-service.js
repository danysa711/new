// src/api/license-service.js

import axiosInstance from './axios';
import { API_ENDPOINTS } from './config';

/**
 * Service untuk manajemen lisensi
 */

// Mendapatkan semua lisensi
export const getAllLicenses = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.LICENSES);
    return response.data;
  } catch (error) {
    console.error('Error fetching licenses:', error);
    throw error;
  }
};

// Mendapatkan semua lisensi yang tersedia
export const getAllAvailableLicenses = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.LICENSES_AVAILABLE + '?onlyAvailable=true');
    return response.data;
  } catch (error) {
    console.error('Error fetching available licenses:', error);
    throw error;
  }
};

// Mendapatkan lisensi berdasarkan ID
export const getLicenseById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.LICENSES}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching license with id ${id}:`, error);
    throw error;
  }
};

// Membuat lisensi baru
export const createLicense = async (licenseData) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.LICENSES, licenseData);
    return response.data;
  } catch (error) {
    console.error('Error creating license:', error);
    throw error;
  }
};

// Membuat banyak lisensi sekaligus
export const createMultipleLicenses = async (licensesData) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.LICENSES_BULK, licensesData);
    return response.data;
  } catch (error) {
    console.error('Error creating multiple licenses:', error);
    throw error;
  }
};

// Memperbarui lisensi
export const updateLicense = async (id, licenseData) => {
  try {
    const response = await axiosInstance.put(`${API_ENDPOINTS.LICENSES}/${id}`, licenseData);
    return response.data;
  } catch (error) {
    console.error(`Error updating license with id ${id}:`, error);
    throw error;
  }
};

// Memperbarui banyak lisensi sekaligus
export const updateMultipleLicenses = async (licensesData) => {
  try {
    const response = await axiosInstance.put(API_ENDPOINTS.LICENSES_BULK, licensesData);
    return response.data;
  } catch (error) {
    console.error('Error updating multiple licenses:', error);
    throw error;
  }
};

// Menghapus lisensi
export const deleteLicense = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.LICENSES}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting license with id ${id}:`, error);
    throw error;
  }
};

// Menghapus banyak lisensi sekaligus
export const deleteMultipleLicenses = async (licenses) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.LICENSES_DELETE_MULTIPLE, { licenses });
    return response.data;
  } catch (error) {
    console.error('Error deleting multiple licenses:', error);
    throw error;
  }
};

// Mendapatkan jumlah lisensi
export const getLicenseCount = async (filter = {}) => {
  try {
    const response = await axiosInstance.post(`${API_ENDPOINTS.LICENSES_COUNT}`, filter);
    return response.data;
  } catch (error) {
    console.error('Error fetching license count:', error);
    throw error;
  }
};