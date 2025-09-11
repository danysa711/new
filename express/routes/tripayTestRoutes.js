const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint test untuk Tripay interceptor
router.get("/test-intercept", (req, res) => {
  // Simulasi request ke Tripay dengan nilai price problematik
  const testData = {
    amount: "29.99",
    order_items: [
      { name: "Test Item", price: "29.99", quantity: 1 }
    ]
  };
  
  console.log("Before intercept:", JSON.stringify(testData));
  
  // Panggil axios.post (yang sudah di-override) dengan data test
  axios.post("https://dummy.tripay.co.id/api/transaction/create", testData, {})
    .then(() => {
      console.log("After intercept:", JSON.stringify(testData));
      res.json({
        success: true,
        message: "Interceptor test completed",
        original: { amount: "29.99", price: "29.99" },
        intercepted: { amount: testData.amount, price: testData.order_items[0].price }
      });
    })
    .catch(error => {
      console.error("Test intercept error:", error);
      res.status(500).json({
        success: false,
        message: "Interceptor test failed",
        error: error.message
      });
    });
});

// Endpoint untuk test koneksi Tripay via proxy
router.get("/test-proxy-connection", async (req, res) => {
  try {
    // Ambil konfigurasi Tripay
    const apiKey = global.TRIPAY_CONFIG ? global.TRIPAY_CONFIG.API_KEY : process.env.TRIPAY_API_KEY;
    const TRIPAY_PROXY_URL = process.env.TRIPAY_PROXY_URL || "http://116.193.191.41/api/tripay-proxy";
    
    // Test koneksi ke Tripay via proxy
    const response = await axios.get(`${TRIPAY_PROXY_URL}/merchant/payment-channel`, {
      headers: {
        'X-Tripay-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    res.json({
      success: true,
      message: "Koneksi ke Tripay berhasil via proxy",
      channels: response.data.data.slice(0, 5) // Hanya tampilkan 5 channel pertama
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Koneksi ke Tripay gagal",
      error: error.message,
      details: error.response?.data
    });
  }
});

module.exports = router;