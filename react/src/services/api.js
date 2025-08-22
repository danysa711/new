import axiosInstance from "./axios";
import API from "./const";

// ########################
// Software API
// ########################

export const getAllSoftware = async (setSoftwareList, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(API.SOFTWARE.GET.ALL);
    setSoftwareList(response.data);
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to fetch software");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const getSoftwareById = async (id, setSoftware, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(API.SOFTWARE.GET.BY_ID.replace(':id', id));
    setSoftware(response.data);
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to fetch software");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const addSoftware = async (softwareData, setSoftwareList, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.post(API.SOFTWARE.POST.ALL, softwareData);
    if (setSoftwareList) {
      const updatedList = await axiosInstance.get(API.SOFTWARE.GET.ALL);
      setSoftwareList(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to add software");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const updateSoftware = async (softwareData, setSoftwareList, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.put(
      API.SOFTWARE.PUT.BY_ID.replace(':id', softwareData.id),
      softwareData
    );
    if (setSoftwareList) {
      const updatedList = await axiosInstance.get(API.SOFTWARE.GET.ALL);
      setSoftwareList(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to update software");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const deleteSoftware = async (id, setSoftwareList, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.delete(API.SOFTWARE.DELETE.BY_ID.replace(':id', id));
    if (setSoftwareList) {
      const updatedList = await axiosInstance.get(API.SOFTWARE.GET.ALL);
      setSoftwareList(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to delete software");
    throw error;
  } finally {
    setLoading(false);
  }
};

// ########################
// License API
// ########################

export const getAllLicenses = async (setLicenses, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(API.LICENSE.GET.ALL);
    setLicenses(response.data);
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to fetch licenses");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const getAllAvailableLicenses = async (setLicenses, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(API.LICENSE.GET.AVAILABLE_ALL);
    setLicenses(response.data);
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to fetch available licenses");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const addLicense = async (licenseData, setLicenses, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.post(API.LICENSE.POST.ALL, licenseData);
    if (setLicenses) {
      const updatedList = await axiosInstance.get(API.LICENSE.GET.ALL);
      setLicenses(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to add license");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const addMultipleLicenses = async (licensesData, setLicenses, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.post(API.LICENSE.POST.MULTIPLE, licensesData);
    if (setLicenses) {
      const updatedList = await axiosInstance.get(API.LICENSE.GET.AVAILABLE_ALL);
      setLicenses(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to add licenses");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const updateLicense = async (licenseData, setLicenses, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.put(
      API.LICENSE.PUT.BY_ID.replace(':id', licenseData.id),
      licenseData
    );
    if (setLicenses) {
      const updatedList = await axiosInstance.get(API.LICENSE.GET.ALL);
      setLicenses(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to update license");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const updateLicensesMultiple = async (licensesData, setLicenses, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.put(API.LICENSE.PUT.MULTIPLE, licensesData);
    if (setLicenses) {
      const updatedList = await axiosInstance.get(API.LICENSE.GET.AVAILABLE_ALL);
      setLicenses(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to update licenses");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const deleteLicense = async (id, setLicenses, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.delete(API.LICENSE.DELETE.BY_ID.replace(':id', id));
    if (setLicenses) {
      const updatedList = await axiosInstance.get(API.LICENSE.GET.ALL);
      setLicenses(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to delete license");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const deleteMultipleLicenses = async (licensesData, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.post(API.LICENSE.POST.MULTIPLE_DELETE, licensesData);
    return response;
  } catch (error) {
    setError && setError(error.response?.data?.error || "Failed to delete licenses");
    throw error;
  } finally {
    setLoading && setLoading(false);
  }
};

// ########################
// Software Version API
// ########################

export const getAllSoftwareVersion = async (setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(API.SOFTWARE_VERSION.GET.ALL);
    setSoftwareVersions(response.data);
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to fetch software versions");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const getSoftwareVersionById = async (id, setSoftwareVersion, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(API.SOFTWARE_VERSION.GET.BY_ID.replace(':id', id));
    setSoftwareVersion(response.data);
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to fetch software version");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const getSoftwareVersionByParamSoftwareId = async (id, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.get(API.SOFTWARE_VERSION.GET.BY_SOFTWARE_ID.replace(':software_id', id));
    setSoftwareVersions(response.data);
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to fetch software versions");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const addSoftwareVersion = async (versionData, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.post(API.SOFTWARE_VERSION.POST.ALL, versionData);
    if (setSoftwareVersions) {
      const updatedList = await axiosInstance.get(API.SOFTWARE_VERSION.GET.ALL);
      setSoftwareVersions(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to add software version");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const updateSoftwareVersion = async (versionData, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.put(
      API.SOFTWARE_VERSION.PUT.BY_ID.replace(':id', versionData.id),
      versionData
    );
    if (setSoftwareVersions) {
      const updatedList = await axiosInstance.get(API.SOFTWARE_VERSION.GET.ALL);
      setSoftwareVersions(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to update software version");
    throw error;
  } finally {
    setLoading(false);
  }
};

export const deleteSoftwareVersion = async (id, setSoftwareVersions, setLoading, setError) => {
  try {
    setLoading(true);
    const response = await axiosInstance.delete(API.SOFTWARE_VERSION.DELETE.BY_ID.replace(':id', id));
    if (setSoftwareVersions) {
      const updatedList = await axiosInstance.get(API.SOFTWARE_VERSION.GET.ALL);
      setSoftwareVersions(updatedList.data);
    }
    return response;
  } catch (error) {
    setError(error.response?.data?.error || "Failed to delete software version");
    throw error;
  } finally {
    setLoading(false);
  }
};

// ########################
// Order API
// ########################

export const getAllOrders = async () => {
  try {
    const response = await axiosInstance.get(API.ORDER.GET.ALL);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await axiosInstance.get(API.ORDER.GET.BY_ID.replace(':id', id));
    return response.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(API.ORDER.POST.ALL, orderData);
    return response.data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    const response = await axiosInstance.put(API.ORDER.PUT.BY_ID.replace(':id', id), orderData);
    return response.data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await axiosInstance.delete(API.ORDER.DELETE.BY_ID.replace(':id', id));
    return response.data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

export const findOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(API.ORDER.POST.FIND, orderData);
    return response.data;
  } catch (error) {
    console.error("Error finding order:", error);
    throw error;
  }
};