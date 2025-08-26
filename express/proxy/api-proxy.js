// File: express/api-proxy.js

/**
 * Server proxy API untuk domain frontend
 * 
 * Server ini akan menangani permintaan dari domain frontend dan meneruskannya ke backend
 * Ini membantu mengatasi masalah CORS dan membuat API tersedia di domain yang sama
 */

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 3501;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3500';

// Konfigurasi CORS
app.use(cors({
  origin: true, // Mengizinkan semua origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware untuk parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log semua permintaan
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint test sederhana
app.get('/api/proxy-test', (req, res) => {
  res.json({
    message: 'API Proxy is working',
    timestamp: new Date().toISOString(),
    backend: BACKEND_URL
  });
});

app.use('/api/test-backend', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/test`);
    const data = await response.json();
    res.json({
      message: 'Backend connection test',
      backendResponse: data,
      status: 'success'
    });
  } catch (error) {
    console.error('Error connecting to backend:', error);
    res.status(500).json({
      message: 'Error connecting to backend',
      error: error.message,
      status: 'error'
    });
  }
});

// Konfigurasi proxy middleware
const apiProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // Jangan ubah path
  },
  onProxyReq: (proxyReq, req, res) => {
    // Tambahkan header tambahan jika diperlukan
    proxyReq.setHeader('X-Forwarded-By', 'API-Proxy');
    
    // Jika ada body dan method bukan GET, atur kembali body
    if (req.body && req.method !== 'GET') {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Tambahkan header ke respons jika diperlukan
    proxyRes.headers['x-powered-by'] = 'API-Proxy';
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({
      message: 'Proxy Error',
      error: err.message
    });
  }
});

// Gunakan proxy middleware untuk semua permintaan ke /api/*
app.use('/api', apiProxy);

// Serve static files dari folder build React
app.use(express.static(path.join(__dirname, '../react/dist')));

// Handle semua rute frontend dengan mengirimkan index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../react/dist/index.html'));
});

// Mulai server
app.listen(PORT, () => {
  console.log(`🚀 API Proxy Server berjalan di http://localhost:${PORT}`);
  console.log(`Meneruskan permintaan ke backend: ${BACKEND_URL}`);
});