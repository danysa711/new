// express/controllers/paymentMethodController.js
const { PaymentMethod } = require("../models");

// Get all payment methods
const getAllPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.findAll({
      where: { is_active: true },
      order: [["name", "ASC"]]
    });
    res.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data metode pembayaran" });
  }
};

// Get payment method by ID
const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({ error: "Metode pembayaran tidak ditemukan" });
    }

    res.json(paymentMethod);
  } catch (error) {
    console.error("Error fetching payment method:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data metode pembayaran" });
  }
};

// Create new payment method (admin only)
const createPaymentMethod = async (req, res) => {
  try {
    const { name, code, type = "manual", account_number, account_name, is_active = true, tripay_code } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ error: "Nama dan kode wajib diisi" });
    }

    // Check if code already exists
    const existingMethod = await PaymentMethod.findOne({ where: { code } });
    if (existingMethod) {
      return res.status(400).json({ error: "Kode metode pembayaran sudah digunakan" });
    }

    // Create payment method
    const newMethod = await PaymentMethod.create({
      name,
      code,
      type,
      account_number,
      account_name,
      is_active,
      tripay_code
    });

    res.status(201).json({ message: "Metode pembayaran berhasil dibuat", paymentMethod: newMethod });
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat membuat metode pembayaran" });
  }
};

// Update payment method (admin only)
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, type, account_number, account_name, is_active, tripay_code } = req.body;

    const paymentMethod = await PaymentMethod.findByPk(id);
    if (!paymentMethod) {
      return res.status(404).json({ error: "Metode pembayaran tidak ditemukan" });
    }

    // Check if code is being changed and already exists
    if (code && code !== paymentMethod.code) {
      const existingMethod = await PaymentMethod.findOne({ where: { code } });
      if (existingMethod) {
        return res.status(400).json({ error: "Kode metode pembayaran sudah digunakan" });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (type !== undefined) updates.type = type;
    if (account_number !== undefined) updates.account_number = account_number;
    if (account_name !== undefined) updates.account_name = account_name;
    if (is_active !== undefined) updates.is_active = is_active;
    if (tripay_code !== undefined) updates.tripay_code = tripay_code;

    await paymentMethod.update(updates);

    res.json({ message: "Metode pembayaran berhasil diperbarui", paymentMethod });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui metode pembayaran" });
  }
};

// Delete payment method (admin only)
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findByPk(id);
    if (!paymentMethod) {
      return res.status(404).json({ error: "Metode pembayaran tidak ditemukan" });
    }

    await paymentMethod.destroy();
    res.json({ message: "Metode pembayaran berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat menghapus metode pembayaran" });
  }
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
};