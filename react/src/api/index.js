// src/api/index.js

/**
 * API Module - Mengekspor semua service API dalam satu file
 */

// Konfigurasi
export { default as config } from './config';
export * from './config';

// Utilitas
export * from './utils';

// Axios instance
export { default as axiosInstance } from './axios';
export * from './axios';

// Auth Service
export * from './auth-service';

// Connection Service
export * from './connection-service';

// Software Service
export * from './software-service';

// License Service
export * from './license-service';

// Order Service
export * from './order-service';

// Subscription Service
export * from './subscription-service';

// Settings Service
export * from './settings-service';

// Export semua service dalam objek untuk kemudahan akses
import * as authService from './auth-service';
import * as connectionService from './connection-service';
import * as softwareService from './software-service';
import * as licenseService from './license-service';
import * as orderService from './order-service';
import * as subscriptionService from './subscription-service';
import * as settingsService from './settings-service';
import * as utils from './utils';

// Bundle semua service
export const services = {
  auth: authService,
  connection: connectionService,
  software: softwareService,
  license: licenseService,
  order: orderService,
  subscription: subscriptionService,
  settings: settingsService,
  utils
};

export default services;