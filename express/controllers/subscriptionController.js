// express/controllers/subscriptionController.js
const { Subscription, User, SubscriptionPlan } = require("../models");
const { Op } = require("sequelize");

// Get all active subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [{ model: User, attributes: ["id", "username", "email", "url_slug"] }],
      order: [["createdAt", "DESC"]]
    });
    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data langganan" });
  }
};

// Get subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findByPk(id, {
      include: [{ model: User, attributes: ["id", "username", "email", "url_slug"] }],
    });

    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    res.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data langganan" });
  }
};

// Get current user's subscriptions
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]]
    });
    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data langganan pengguna" });
  }
};

// Create new subscription (admin only)
const createSubscription = async (req, res) => {
  try {
    const { user_id, start_date, end_date, status = "active", payment_status = "pending", payment_method } = req.body;

    // Validate required fields
    if (!user_id || !start_date || !end_date) {
      return res.status(400).json({ error: "User ID, tanggal mulai, dan tanggal berakhir wajib diisi" });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    // Create subscription
    const newSubscription = await Subscription.create({
      user_id,
      start_date,
      end_date,
      status,
      payment_status,
      payment_method
    });

    // If subscription is active and payment is paid, activate user URL
    if (status === "active" && payment_status === "paid") {
      await user.update({ url_active: true });
    }

    res.status(201).json({ message: "Langganan berhasil dibuat", subscription: newSubscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat membuat langganan" });
  }
};

// Update subscription (admin only)
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, status, payment_status, payment_method } = req.body;

    const subscription = await Subscription.findByPk(id, {
      include: [{ model: User }]
    });

    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    const updates = {};
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (status !== undefined) updates.status = status;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (payment_method !== undefined) updates.payment_method = payment_method;

    await subscription.update(updates);

    // Update user URL active status based on subscription status
    if (subscription.User) {
      const user = subscription.User;
      const isActiveAndPaid = subscription.status === "active" && subscription.payment_status === "paid";
      
      // Only update if status changed
      if (user.url_active !== isActiveAndPaid) {
        await user.update({ url_active: isActiveAndPaid });
      }
    }

    res.json({ message: "Langganan berhasil diperbarui", subscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui langganan" });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const requestingUser = await User.findByPk(userId);

    const subscription = await Subscription.findByPk(id, {
      include: [{ model: User }]
    });

    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    // Check if admin or subscription owner
    if (requestingUser.role !== "admin" && subscription.user_id !== userId) {
      return res.status(403).json({ error: "Tidak diizinkan membatalkan langganan pengguna lain" });
    }

    await subscription.update({ status: "canceled" });

    // Deactivate user URL if no active subscriptions left
    if (subscription.User) {
      const user = subscription.User;
      const activeSubscriptions = await Subscription.findOne({
        where: {
          user_id: user.id,
          status: "active",
          payment_status: "paid",
          end_date: { [Op.gt]: new Date() }
        }
      });

      if (!activeSubscriptions) {
        await user.update({ url_active: false });
      }
    }

    res.json({ message: "Langganan berhasil dibatalkan", subscription });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat membatalkan langganan" });
  }
};

// Delete subscription (admin only)
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    await subscription.destroy();
    res.json({ message: "Langganan berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat menghapus langganan" });
  }
};

// Get subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [["duration_days", "ASC"]]
    });
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil data paket langganan" });
  }
};

// Create subscription plan (admin only)
const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, duration_days, price, description, is_active = true } = req.body;

    // Validate required fields
    if (!name || !duration_days || price === undefined) {
      return res.status(400).json({ error: "Nama, durasi, dan harga wajib diisi" });
    }

    const newPlan = await SubscriptionPlan.create({
      name,
      duration_days,
      price,
      description,
      is_active
    });

    res.status(201).json({ message: "Paket langganan berhasil dibuat", plan: newPlan });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat membuat paket langganan" });
  }
};

// Update subscription plan (admin only)
const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration_days, price, description, is_active } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (duration_days !== undefined) updates.duration_days = duration_days;
    if (price !== undefined) updates.price = price;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;

    await plan.update(updates);

    res.json({ message: "Paket langganan berhasil diperbarui", plan });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui paket langganan" });
  }
};

// Delete subscription plan (admin only)
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    await plan.destroy();
    res.json({ message: "Paket langganan berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat menghapus paket langganan" });
  }
};

// Check subscription status
const checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get current active subscription
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: userId,
        status: "active",
        end_date: { [Op.gt]: new Date() }
      },
      order: [["end_date", "DESC"]]
    });

    if (!activeSubscription) {
      return res.json({ 
        hasActiveSubscription: false,
        subscription: null
      });
    }

    res.json({
      hasActiveSubscription: true,
      subscription: activeSubscription
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memeriksa status langganan" });
  }
};

// Extend subscription with a plan
const extendSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const { plan_id, payment_method } = req.body;

    // Validate plan ID
    if (!plan_id) {
      return res.status(400).json({ error: "ID paket langganan wajib diisi" });
    }

    // Check if plan exists
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan || !plan.is_active) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan atau tidak aktif" });
    }

    // Get latest subscription to determine start date
    const latestSubscription = await Subscription.findOne({
      where: { user_id: userId },
      order: [["end_date", "DESC"]]
    });

    // Calculate start and end dates
    let startDate;
    if (latestSubscription && new Date(latestSubscription.end_date) > new Date()) {
      // If existing subscription is still active, start from its end date
      startDate = new Date(latestSubscription.end_date);
    } else {
      // Otherwise start from now
      startDate = new Date();
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create new subscription
    const newSubscription = await Subscription.create({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      status: "active",
      payment_status: "pending", // Start as pending until payment is confirmed
      payment_method: payment_method || null
    });

    // Return the new subscription with payment information
    res.status(201).json({
      message: "Perpanjangan langganan berhasil dibuat, menunggu pembayaran",
      subscription: newSubscription,
      payment_info: {
        amount: plan.price,
        plan_name: plan.name,
        duration_days: plan.duration_days
      }
    });
  } catch (error) {
    console.error("Error extending subscription:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memperpanjang langganan" });
  }
};

// Admin approves payment
const approvePayment = async (req, res) => {
  try {
    const { subscription_id } = req.params;

    const subscription = await Subscription.findByPk(subscription_id, {
      include: [{ model: User }]
    });

    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    // Update subscription status
    await subscription.update({
      payment_status: "paid"
    });

    // Activate user URL
    if (subscription.User && subscription.status === "active") {
      await subscription.User.update({ url_active: true });
    }

    res.json({
      message: "Pembayaran berhasil dikonfirmasi",
      subscription
    });
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat mengonfirmasi pembayaran" });
  }
};

// Request trial subscription
const requestTrialSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    // Check if user already has any subscription
    const existingSubscription = await Subscription.findOne({
      where: { user_id: userId }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: "Anda sudah pernah berlangganan sebelumnya" });
    }

    // Create a 1-day trial subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // 1 day trial

    const trialSubscription = await Subscription.create({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      status: "active",
      payment_status: "pending", // Admin needs to approve
      payment_method: "trial"
    });

    // Get user info
    const user = await User.findByPk(userId);

    res.status(201).json({
      message: "Permintaan trial berhasil dibuat, menunggu persetujuan admin",
      subscription: trialSubscription,
      request_info: {
        username: user.username,
        email: user.email,
        message: message || "Permintaan trial"
      }
    });
  } catch (error) {
    console.error("Error requesting trial:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat meminta trial" });
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  getUserSubscriptions,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  checkSubscriptionStatus,
  extendSubscription,
  approvePayment,
  requestTrialSubscription
};