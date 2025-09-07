const { Subscription, SubscriptionPlan, User, db } = require("../models");

const getAllSubscriptionPlans = async (req, res) => {
  try {
    console.log("Get all subscription plans called, user:", {
      userId: req.userId || 'no user id',
      userRole: req.userRole || 'no user role'
    });
    
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['duration_days', 'ASC']]
    });

    return res.status(200).json(plans);
  } catch (error) {
    console.error("Error getting subscription plans:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getSubscriptionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    return res.status(200).json(plan);
  } catch (error) {
    console.error("Error getting subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const createSubscriptionPlan = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { name, duration_days, price, description, is_active } = req.body;

    // Validasi input
    if (!name || !duration_days || !price) {
      return res.status(400).json({ error: "Nama, durasi, dan harga harus diisi" });
    }

    const newPlan = await SubscriptionPlan.create({
      name,
      duration_days,
      price,
      description,
      is_active: is_active !== undefined ? is_active : true
    });

    return res.status(201).json({
      message: "Paket langganan berhasil dibuat",
      plan: newPlan
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const updateSubscriptionPlan = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { name, duration_days, price, description, is_active } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    await plan.update({
      name: name || plan.name,
      duration_days: duration_days || plan.duration_days,
      price: price || plan.price,
      description: description || plan.description,
      is_active: is_active !== undefined ? is_active : plan.is_active
    });

    return res.status(200).json({
      message: "Paket langganan berhasil diperbarui",
      plan
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const deleteSubscriptionPlan = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
    }

    await plan.destroy();

    return res.status(200).json({ message: "Paket langganan berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;

    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      include: [{ model: User, attributes: ['username', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error getting user subscriptions:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      console.log("Permintaan ditolak: user bukan admin", req.userRole);
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    console.log("Mengambil semua langganan dengan hak admin");
    const subscriptions = await Subscription.findAll({
      include: [{ model: User, attributes: ['id', 'username', 'email', 'url_slug'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error mendapatkan semua langganan:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await Subscription.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'username', 'email', 'url_slug'] }]
    });

    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    // Only allow admin or the subscription owner to access
    if (req.userRole !== "admin" && subscription.user_id !== req.userId) {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    return res.status(200).json(subscription);
  } catch (error) {
    console.error("Error getting subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const createSubscription = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { user_id, plan_id, payment_method, custom_days } = req.body;

    // Validasi input
    if ((!plan_id && !custom_days) || !user_id) {
      return res.status(400).json({ error: "User ID dan Plan ID atau Custom Days harus diisi" });
    }

    // Cek apakah user ada
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    let duration_days = custom_days;
    let plan = null;

    // Jika menggunakan plan_id, ambil durasi dari plan
    if (plan_id) {
      plan = await SubscriptionPlan.findByPk(plan_id);
      if (!plan) {
        return res.status(404).json({ error: "Paket langganan tidak ditemukan" });
      }
      duration_days = plan.duration_days;
    }

    // Hitung tanggal berakhir berdasarkan durasi
    const start_date = new Date();
    const end_date = new Date();
    end_date.setDate(end_date.getDate() + parseInt(duration_days));

    // Cek apakah user sudah memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id,
        status: "active",
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });

    // Jika sudah ada langganan aktif, perpanjang langganan tersebut
    if (activeSubscription) {
      const newEndDate = new Date(activeSubscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + parseInt(duration_days));
      
      await activeSubscription.update({
        end_date: newEndDate,
        payment_status: "paid",
        payment_method: payment_method || "manual"
      });

      return res.status(200).json({
        message: "Langganan berhasil diperpanjang",
        subscription: activeSubscription
      });
    }

    // Buat langganan baru
    const newSubscription = await Subscription.create({
      user_id,
      start_date,
      end_date,
      status: "active",
      payment_status: "paid",
      payment_method: payment_method || "manual"
    });

    return res.status(201).json({
      message: "Langganan berhasil dibuat",
      subscription: newSubscription
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const updateSubscriptionStatus = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { status, payment_status } = req.body;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    await subscription.update({
      status: status || subscription.status,
      payment_status: payment_status || subscription.payment_status
    });

    return res.status(200).json({
      message: "Status langganan berhasil diperbarui",
      subscription
    });
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    // Only allow admin or the subscription owner to cancel
    if (req.userRole !== "admin" && subscription.user_id !== req.userId) {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    await subscription.update({ status: "canceled" });

    return res.status(200).json({
      message: "Langganan berhasil dibatalkan",
      subscription
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

const extendSubscription = async (req, res) => {
  try {
    // Check if the requester is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }

    const { id } = req.params;
    const { days } = req.body;

    if (!days || isNaN(days) || days <= 0) {
      return res.status(400).json({ error: "Jumlah hari harus diisi dengan angka positif" });
    }

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({ error: "Langganan tidak ditemukan" });
    }

    // Hitung tanggal berakhir baru
    const currentEndDate = new Date(subscription.end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(days));

    await subscription.update({
      end_date: newEndDate,
      status: "active" // Pastikan status aktif jika sebelumnya expired
    });

    return res.status(200).json({
      message: `Langganan berhasil diperpanjang ${days} hari`,
      subscription
    });
  } catch (error) {
    console.error("Error extending subscription:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

module.exports = {
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getUserSubscriptions,
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscriptionStatus,
  cancelSubscription,
  extendSubscription
};