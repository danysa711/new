// src/utils/logger.js

/**
 * Logger sederhana untuk aplikasi
 */

// Level logging
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Level default
let currentLogLevel = LOG_LEVELS.INFO;

// Fungsi untuk mengatur level log
export const setLogLevel = (level) => {
  currentLogLevel = level;
};

// Logger utama
export const logger = {
  error: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  // Log API request
  apiRequest: (method, url, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(`[API] ${method.toUpperCase()} ${url}`, data || '');
    }
  },
  
  // Log API response
  apiResponse: (method, url, status, data = null) => {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    
    if (currentLogLevel >= level) {
      const logFn = status >= 400 ? console.error : console.debug;
      logFn(`[API] ${method.toUpperCase()} ${url} [${status}]`, data || '');
    }
  }
};

export default logger;