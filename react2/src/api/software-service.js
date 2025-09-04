// src/api/software-service.js

import axiosInstance from './axios';
import { API_ENDPOINTS } from './config';

/**
 * Service untuk manajemen software dan versi
 */

// Mendapatkan semua software
export const getAllSoftware = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.SOFTWARE);
    return response.data;
  } catch (error) {
    console.error('Error fetching software:', error);
    throw error;
  }
};

// Mendapatkan software berdasarkan ID
export const getSoftwareById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.SOFTWARE}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching software with id ${id}:`, error);
    throw error;
  }
};

// Membuat software baru
export const createSoftware = async (softwareData) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.SOFTWARE, softwareData);
    return response.data;
  } catch (error) {
    console.error('Error creating software:', error);
    throw error;
  }
};

// Memperbarui software
export const updateSoftware = async (id, softwareData) => {
  try {
    const response = await axiosInstance.put(`${API_ENDPOINTS.SOFTWARE}/${id}`, softwareData);
    return response.data;
  } catch (error) {
    console.error(`Error updating software with id ${id}:`, error);
    throw error;
  }
};

// Menghapus software
export const deleteSoftware = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.SOFTWARE}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting software with id ${id}:`, error);
    throw error;
  }
};

// Mendapatkan jumlah software
export const getSoftwareCount = async (filter = {}) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.SOFTWARE_COUNT, filter);
    return response.data;
  } catch (error) {
    console.error('Error fetching software count:', error);
    throw error;
  }
};

// Mendapatkan semua versi software
export const getAllSoftwareVersions = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.SOFTWARE_VERSIONS);
    return response.data;
  } catch (error) {
    console.error('Error fetching software versions:', error);
    throw error;
  }
};

// Mendapatkan versi software berdasarkan ID
export const getSoftwareVersionById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.SOFTWARE_VERSIONS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching software version with id ${id}:`, error);
    throw error;
  }
};

// Mendapatkan versi software berdasarkan ID software
export const getSoftwareVersionsBySoftwareId = async (softwareId) => {
  try {
    const response = await axiosInstance.get(`${API_ENDPOINTS.SOFTWARE_VERSIONS}/${softwareId}/versions`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching versions for software id ${softwareId}:`, error);
    throw error;
  }
};

// Membuat versi software baru
export const createSoftwareVersion = async (versionData) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.SOFTWARE_VERSIONS, versionData);
    return response.data;
  } catch (error) {
    console.error('Error creating software version:', error);
    throw error;
  }
};

// Memperbarui versi software
export const updateSoftwareVersion = async (id, versionData) => {
  try {
    const response = await axiosInstance.put(`${API_ENDPOINTS.SOFTWARE_VERSIONS}/${id}`, versionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating software version with id ${id}:`, error);
    throw error;
  }
};

// Menghapus versi software
export const deleteSoftwareVersion = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.SOFTWARE_VERSIONS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting software version with id ${id}:`, error);
    throw error;
  }
};

// Mendapatkan jumlah versi software
export const getSoftwareVersionCount = async (filter = {}) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.SOFTWARE_VERSIONS_COUNT, filter);
    return response.data;
  } catch (error) {
    console.error('Error fetching software versions count:', error);
    throw error;
  }
};