// File: src/services/localSettings.js

// Default settings yang akan digunakan jika tidak bisa mengakses API
const defaultSettings = {
  whatsapp: {
    phone: "6281234567890",
    message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
  },
  company: {
    name: "Kinterstore",
    address: "Jakarta, Indonesia",
    email: "info@kinterstore.my.id"
  }
};

// Simpan settings ke localStorage
export const saveLocalSettings = (settings) => {
  try {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Error saving local settings:", error);
    return false;
  }
};

// Ambil settings dari localStorage
export const getLocalSettings = () => {
  try {
    const storedSettings = localStorage.getItem('app_settings');
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error getting local settings:", error);
    return defaultSettings;
  }
};

// Default subscription untuk simulasi
const defaultSubscription = {
  id: 0,
  user_id: 0,
  start_date: new Date().toISOString(),
  end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
  status: "active",
  payment_status: "paid",
  payment_method: "manual",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Simpan subscription ke localStorage
export const saveLocalSubscription = (subscription) => {
  try {
    localStorage.setItem('user_subscription', JSON.stringify(subscription));
    return true;
  } catch (error) {
    console.error("Error saving local subscription:", error);
    return false;
  }
};

// Ambil subscription dari localStorage
export const getLocalSubscription = () => {
  try {
    const storedSubscription = localStorage.getItem('user_subscription');
    if (storedSubscription) {
      return JSON.parse(storedSubscription);
    }
    return null;
  } catch (error) {
    console.error("Error getting local subscription:", error);
    return null;
  }
};

// Inisialisasi pengaturan default jika belum ada
export const initializeLocalData = () => {
  if (!localStorage.getItem('app_settings')) {
    saveLocalSettings(defaultSettings);
  }
};

// Export defaults untuk digunakan langsung
export { defaultSettings, defaultSubscription };