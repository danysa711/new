// src/api/config.js

import { detectDomainAndGenerateBackendUrl } from '../utils/domainUtils';

/**
 * Konfigurasi API dan Backend
 */

// URL backend default berdasarkan domain saat ini
export const DEFAULT_BACKEND_URL = detectDomainAndGenerateBackendUrl();

// Timeout untuk request API (dalam milidetik)
export const REQUEST_TIMEOUT = 30000;

// Header default untuk request API
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Kunci untuk menyimpan token di localStorage/sessionStorage
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  BACKEND_URL: 'backendUrl',
  REMEMBER: 'remember'
};

// Status kode HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Status koneksi
export const CONNECTION_STATUS = {
  CHECKING: 'checking',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  SUBSCRIPTION_EXPIRED: 'subscription_expired'
};

// Endpoint API
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  REFRESH_TOKEN: '/api/user/refresh',
  USER_PROFILE: '/api/user/profile',
  UPDATE_USER: '/api/user',
  VERIFY_PASSWORD: '/api/user/password',
  BACKEND_URL: '/api/user/backend-url',
  PUBLIC_PROFILE: '/api/user/public',
  
  // Software
  SOFTWARE: '/api/software',
  SOFTWARE_COUNT: '/api/software/count',
  
  // Software Versions
  SOFTWARE_VERSIONS: '/api/software-versions',
  SOFTWARE_VERSIONS_COUNT: '/api/software-versions/count',
  
  // Licenses
  LICENSES: '/api/licenses',
  LICENSES_BULK: '/api/licenses-bulk',
  LICENSES_AVAILABLE: '/api/licenses/available/all',
  LICENSES_COUNT: '/api/licenses/count',
  LICENSES_DELETE_MULTIPLE: '/api/licenses/delete-multiple',
  
  // Orders
  ORDERS: '/api/orders',
  ORDERS_FIND: '/api/orders/find',
  ORDERS_COUNT: '/api/orders/count',
  ORDERS_USAGE: '/api/orders/usage',
  
  // Subscription
  SUBSCRIPTION_PLANS: '/api/subscription-plans',
  USER_SUBSCRIPTIONS: '/api/subscriptions/user',
  
  // WhatsApp Trial Settings
  WHATSAPP_TRIAL: '/api/settings/whatsapp-trial',
  
  // Test
  TEST: '/api/test'
};