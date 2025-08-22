// express/controllers/tripayController.js
const { TripaySettings } = require("../models");
const axios = require("axios");

// Get Tripay settings
const getTripaySettings = async (req, res) => {
  try {
    const settings = await TripaySettings.findOne({
      where: { is_active: true },
      attributes: { exclude: ["private_key"] } // Don't expose private key
    });
    res.json(settings);
  } catch (error) {
    console.error("Error fetching Tripay settings:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil pengaturan Tripay" });
  }
};

// Update Tripay settings (admin only)
const updateTripaySettings = async (req, res) => {
  try {
    const { api_key, private_key, merchant_code, is_sandbox, is_active } = req.body;

    // Find existing settings or create new one
    let settings = await TripaySettings.findOne();
    
    if (settings) {
      // Update existing settings
      const updates = {};
      if (api_key !== undefined) updates.api_key = api_key;
      if (private_key !== undefined) updates.private_key = private_key;
      if (merchant_code !== undefined) updates.merchant_code = merchant_code;
      if (is_sandbox !== undefined) updates.is_sandbox = is_sandbox;
      if (is_active !== undefined) updates.is_active = is_active;
      
      await settings.update(updates);
    } else {
      // Create new settings
      settings = await TripaySettings.create({
        api_key,
        private_key,
        merchant_code,
        is_sandbox: is_sandbox !== undefined ? is_sandbox : true,
        is_active: is_active !== undefined ? is_active : true
      });
    }

    // Don't expose private key in response
    const responseSettings = { ...settings.toJSON() };
    delete responseSettings.private_key;

    res.json({ message: "Pengaturan Tripay berhasil diperbarui", settings: responseSettings });
  } catch (error) {
    console.error("Error updating Tripay settings:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui pengaturan Tripay" });
  }
};

// Get payment channels from Tripay API
const getPaymentChannels = async (req, res) => {
  try {
    const settings = await TripaySettings.findOne({ where: { is_active: true } });
    
    if (!settings) {
      return res.status(404).json({ error: "Pengaturan Tripay belum dikonfigurasi" });
    }

    const baseUrl = settings.is_sandbox ? 
      "https://tripay.co.id/api-sandbox" : 
      "https://tripay.co.id/api";
    
    const response = await axios.get(`${baseUrl}/merchant/payment-channel`, {
      headers: {
        "Authorization": `Bearer ${settings.api_key}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching payment channels:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil channel pembayaran dari Tripay" });
  }
};

// Create transaction in Tripay
const createTransaction = async (req, res) => {
  try {
    const { method, amount, order_items, customer_name, customer_email, customer_phone, callback_url, return_url, expired_time } = req.body;
    
    const settings = await TripaySettings.findOne({ where: { is_active: true } });
    
    if (!settings) {
      return res.status(404).json({ error: "Pengaturan Tripay belum dikonfigurasi" });
    }

    const baseUrl = settings.is_sandbox ? 
      "https://tripay.co.id/api-sandbox" : 
      "https://tripay.co.id/api";
    
    // Prepare request payload
    const payload = {
      method,
      merchant_ref: `INV-${Date.now()}`,
      amount,
      customer_name,
      customer_email,
      customer_phone,
      order_items,
      callback_url,
      return_url,
      expired_time: expired_time || 24 * 60, // Default 24 hours in minutes
      signature: createSignature(settings.merchant_code, settings.private_key, amount)
    };
    
    const response = await axios.post(`${baseUrl}/transaction/create`, payload, {
      headers: {
        "Authorization": `Bearer ${settings.api_key}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ 
      error: "Terjadi kesalahan saat membuat transaksi di Tripay",
      details: error.response?.data || error.message
    });
  }
};

// Get transaction details from Tripay
const getTransactionDetails = async (req, res) => {
  try {
    const { reference } = req.params;
    
    const settings = await TripaySettings.findOne({ where: { is_active: true } });
    
    if (!settings) {
      return res.status(404).json({ error: "Pengaturan Tripay belum dikonfigurasi" });
    }

    const baseUrl = settings.is_sandbox ? 
      "https://tripay.co.id/api-sandbox" : 
      "https://tripay.co.id/api";
    
    const response = await axios.get(`${baseUrl}/transaction/detail?reference=${reference}`, {
      headers: {
        "Authorization": `Bearer ${settings.api_key}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ 
      error: "Terjadi kesalahan saat mengambil detail transaksi dari Tripay",
      details: error.response?.data || error.message
    });
  }
};

// Handle Tripay callback
const handleCallback = async (req, res) => {
  try {
    const { data } = req.body;
    
    // Verify callback authenticity (implement later)
    // ...

    // Process the payment result
    // Update subscription payment_status based on payment result
    // ...

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing callback:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses callback Tripay" });
  }
};

// Helper function to create signature
const createSignature = (merchantCode, privateKey, amount) => {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", privateKey);
  hmac.update(merchantCode + amount);
  return hmac.digest("hex");
};

module.exports = {
  getTripaySettings,
  updateTripaySettings,
  getPaymentChannels,
  createTransaction,
  getTransactionDetails,
  handleCallback
};