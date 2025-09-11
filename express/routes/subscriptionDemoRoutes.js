// routes/subscriptionDemoRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

// Endpoint demo untuk transaksi - tanpa middleware auth
router.post('/', async (req, res) => {
  try {
    console.log("Demo endpoint called with body:", req.body);
    
    // Gunakan user ID dummy jika tidak ada dalam request
    const userId = req.body.user_id || 1;
    
    // Dummy data plan jika tidak ada di request
    const planData = {
      id: req.body.plan_id || 29,
      name: req.body.plan_name || '1 Hari',
      price: req.body.price || 1000
    };
    
    // Ambil metode pembayaran dari request atau default ke QRIS
    const paymentMethod = req.body.payment_method || 'QRIS';
    
    // Konfigurasi Tripay dari env atau config
    const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || "5CVDH22vZjFAWySB7lIpCDRd2hXIBnycUA1tvHBa";
    const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || "4PAWA-uFTIU-H6Ced-yK6Bz-f0AGl";
    const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || "T44798";
    const TRIPAY_PROXY_URL = process.env.TRIPAY_PROXY_URL || "http://116.193.191.41/api/tripay-proxy";
    const CALLBACK_URL = process.env.CALLBACK_URL || "http://116.193.191.41/api/tripay/callback/autobot";
    const RETURN_URL = process.env.FRONTEND_URL || "https://kinterstore.my.id";
    
    // Generate merchant reference
    const merchantRef = `DEMO-${Date.now()}`;
    
    // Konversi price ke integer
    const priceInt = Math.floor(Number(planData.price));
    console.log("Price as integer:", priceInt);
    
    // Generate signature
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(TRIPAY_MERCHANT_CODE + merchantRef + priceInt)
      .digest('hex');
    
    // Unix timestamp 24 jam dari sekarang (dalam detik)
    const expiredTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    console.log("Expired time (Unix timestamp):", expiredTime);
    
    // Payload untuk Tripay
    const payload = {
      method: paymentMethod,
      merchant_ref: merchantRef,
      amount: priceInt,
      customer_name: req.body.customer_name || "Demo User",
      customer_email: req.body.customer_email || "demo@example.com",
      customer_phone: req.body.customer_phone || "08123456789",
      order_items: [{
        name: `Langganan ${planData.name}`,
        price: priceInt,
        quantity: 1
      }],
      callback_url: CALLBACK_URL,
      return_url: `${RETURN_URL}/subscription`,
      expired_time: expiredTime,
      signature: signature
    };
    
    console.log("Sending payload to Tripay:", JSON.stringify(payload, null, 2));
    
    // Kirim request ke Tripay via proxy
    const response = await axios({
      method: 'post',
      url: `${TRIPAY_PROXY_URL}/transaction/create`,
      headers: {
        'X-Tripay-API-Key': TRIPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    console.log("Tripay response status:", response.status);
    
    // Dummy transaction data jika response gagal
    const transactionData = response.data?.data || {
      reference: "TRX" + Date.now(),
      merchant_ref: merchantRef,
      payment_method: paymentMethod,
      payment_name: paymentMethod === "QRIS" ? "QRIS" : "Virtual Account",
      amount: priceInt,
      fee: 800,
      total_amount: priceInt + 800,
      status: "UNPAID",
      created_at: new Date().toISOString(),
      expired_at: new Date(expiredTime * 1000).toISOString(),
      payment_code: "123456789",
      qr_url: "https://tripay.co.id/qr/sample.png",
      instructions: [{
        title: `Cara Pembayaran ${paymentMethod}`,
        steps: [
          "Buka aplikasi e-wallet atau mobile banking Anda",
          "Pilih menu Scan QR atau QRIS",
          "Scan QR code yang tersedia",
          "Periksa detail transaksi",
          "Masukkan PIN atau password Anda",
          "Pembayaran selesai"
        ]
      }]
    };
    
    return res.json({
      success: true,
      message: "Transaksi demo berhasil dibuat",
      transaction: transactionData
    });
  } catch (error) {
    console.error("Error creating demo transaction:", error);
    console.error("Error details:", error.response?.data);
    
    // Fallback dengan transaksi dummy jika terjadi error
    const dummyTransaction = {
      reference: "TRX" + Date.now(),
      merchant_ref: "DEMO-" + Date.now(),
      payment_method: req.body.payment_method || "QRIS",
      payment_name: req.body.payment_method === "QRIS" ? "QRIS" : "Virtual Account",
      amount: Math.floor(Number(req.body.price || 1000)),
      fee: 800,
      total_amount: Math.floor(Number(req.body.price || 1000)) + 800,
      status: "UNPAID",
      created_at: new Date().toISOString(),
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      payment_code: "123456789",
      qr_url: "https://tripay.co.id/qr/sample.png",
      plan_name: req.body.plan_name || "1 Hari Demo",
      instructions: [{
        title: `Cara Pembayaran ${req.body.payment_method || "QRIS"}`,
        steps: [
          "Buka aplikasi e-wallet atau mobile banking Anda",
          "Pilih menu Scan QR atau QRIS",
          "Scan QR code yang tersedia",
          "Periksa detail transaksi",
          "Masukkan PIN atau password Anda",
          "Pembayaran selesai"
        ]
      }]
    };
    
    return res.json({
      success: true,
      message: "Transaksi demo dibuat (menggunakan data dummy karena error)",
      transaction: dummyTransaction,
      error_details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;