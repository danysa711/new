// src/utils/logger.js
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args) => {
    if (!isProduction) console.log(...args);
  },
  error: (...args) => {
    if (!isProduction) console.error(...args);
  },
  warn: (...args) => {
    if (!isProduction) console.warn(...args);
  },
  info: (...args) => {
    if (!isProduction) console.info(...args);
  },
  debug: (...args) => {
    if (!isProduction) console.debug(...args);
  }
};