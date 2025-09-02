// File: src/services/api.js

import axiosInstance from './axios';

// Get all software
export const getAllSoftware = async (setSoftwareList, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.get('/api/software');
    setSoftwareList && setSoftwareList(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching software:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Get software by ID
export const getSoftwareById = async (id, setSoftware, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.get(`/api/software/${id}`);
    setSoftware && setSoftware(response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching software with id ${id}:`, error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Add software
export const addSoftware = async (softwareData, setSoftwareList, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.post('/api/software', softwareData);
    getAllSoftware(setSoftwareList, setLoading, setError);
    return response;
  } catch (error) {
    console.error('Error adding software:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Update software
export const updateSoftware = async (softwareData, setSoftwareList, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.put(`/api/software/${softwareData.id}`, softwareData);
    getAllSoftware(setSoftwareList, setLoading, setError);
    return response;
  } catch (error) {
    console.error(`Error updating software with id ${softwareData.id}:`, error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Delete software
export const deleteSoftware = async (id, setSoftwareList, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.delete(`/api/software/${id}`);
    getAllSoftware(setSoftwareList, setLoading, setError);
    return response;
  } catch (error) {
    console.error(`Error deleting software with id ${id}:`, error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Get all software versions
export const getAllSoftwareVersion = async (setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.get('/api/software-versions');
    setSoftwareVersions && setSoftwareVersions(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching software versions:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Get software versions by software ID
export const getSoftwareVersionByParamSoftwareId = async (software_id, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.get(`/api/software-versions/${software_id}/versions`);
    setSoftwareVersions && setSoftwareVersions(response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching versions for software id ${software_id}:`, error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Add software version
export const addSoftwareVersion = async (versionData, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.post('/api/software-versions', versionData);
    getAllSoftwareVersion(setSoftwareVersions, setLoading, setError);
    return response;
  } catch (error) {
    console.error('Error adding software version:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Update software version
export const updateSoftwareVersion = async (versionData, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.put(`/api/software-versions/${versionData.id}`, versionData);
    getAllSoftwareVersion(setSoftwareVersions, setLoading, setError);
    return response;
  } catch (error) {
    console.error(`Error updating software version with id ${versionData.id}:`, error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Delete software version
export const deleteSoftwareVersion = async (id, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.delete(`/api/software-versions/${id}`);
    getAllSoftwareVersion(setSoftwareVersions, setLoading, setError);
    return response;
  } catch (error) {
    console.error(`Error deleting software version with id ${id}:`, error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Get all licenses
export const getAllLicenses = async (setLicenses, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.get('/api/licenses');
    setLicenses && setLicenses(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching licenses:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Get all available licenses
export const getAllAvailableLicenses = async (setLicenses, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    // Tambahkan parameter onlyAvailable=true untuk memastikan hanya lisensi yang belum digunakan
    const response = await axiosInstance.get('/api/licenses/available/all?onlyAvailable=true');
    setLicenses && setLicenses(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching available licenses:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Add multiple licenses
export const addMultipleLicenses = async (licensesData, setLicenses, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.post('/api/licenses-bulk', licensesData);
    getAllAvailableLicenses(setLicenses, setLoading, setError);
    return response;
  } catch (error) {
    console.error('Error adding licenses:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Update multiple licenses
export const updateLicensesMultiple = async (licensesData, setLicenses, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.put('/api/licenses-bulk', licensesData);
    getAllAvailableLicenses(setLicenses, setLoading, setError);
    return response;
  } catch (error) {
    console.error('Error updating licenses:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Delete multiple licenses
export const deleteMultipleLicenses = async (licensesData, setLoading, setError) => {
  try {
    setLoading && setLoading(true);
    const response = await axiosInstance.post('/api/licenses/delete-multiple', licensesData);
    return response;
  } catch (error) {
    console.error('Error deleting licenses:', error);
    setError && setError(error.message);
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// Get all orders
export const getAllOrders = async () => {
  try {
    const response = await axiosInstance.get('/api/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Delete order
export const deleteOrder = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting order with id ${id}:`, error);
    throw error;
  }
};