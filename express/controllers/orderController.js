const { Order, License, Software, SoftwareVersion, OrderLicense, Subscription, db } = require("../models");
const { Op } = require("sequelize");

const getOrders = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Filter kondisi berdasarkan role
    const whereCondition = req.userRole === "admin" 
      ? {} 
      : { user_id: userId };
      
    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: License,
          through: { attributes: [] },
          attributes: ["id", "license_key", "is_active", "used_at"],
        },
        {
          model: Software,
          attributes: ["name", "requires_license"]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.userId;
    const order = await Order.findByPk(req.params.id);
    
    if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    
    // Cek kepemilikan order jika bukan admin
    if (req.userRole !== "admin" && order.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke pesanan ini" });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error });
  }
};

const createOrder = async (req, res) => {
  try {
    const { order_id, item_name, os, version, license_count, status } = req.body;
    const userId = req.userId;
    
    const newOrder = await Order.create({ 
      order_id, 
      item_name, 
      os, 
      version, 
      license_count, 
      status,
      user_id: userId 
    });
    
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan pesanan", error });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { order_id, item_name, os, version, license_count, status } = req.body;
    const userId = req.userId;
    
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    
    // Cek kepemilikan order jika bukan admin
    if (req.userRole !== "admin" && order.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk mengubah pesanan ini" });
    }

    await order.update({ order_id, item_name, os, version, license_count, status });
    res.json({ message: "Pesanan berhasil diperbarui", order });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui pesanan", error });
  }
};

const deleteOrder = async (req, res) => {
  let transaction;

  try {
    transaction = await db.sequelize.transaction();
    const userId = req.userId;

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: License, through: { attributes: [] } }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }
    
    // Cek kepemilikan order jika bukan admin
    if (req.userRole !== "admin" && order.user_id !== userId) {
      await transaction.rollback();
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk menghapus pesanan ini" });
    }

    // Ambil semua license_id terkait order
    const licenseIds = order.Licenses.map((license) => license.id);

    if (licenseIds.length > 0) {
      // Ubah status lisensi kembali ke is_active: false
      await License.update({ is_active: false, updatedAt: new Date() }, { where: { id: licenseIds }, transaction });

      // Hapus entri dari order_licenses
      await OrderLicense.destroy({
        where: { order_id: order.id },
        transaction,
      });
    }

    // Hapus order
    await order.destroy({ transaction });

    await transaction.commit();
    res.json({ message: "Pesanan berhasil dihapus dan lisensi dikembalikan" });
  } catch (error) {
    console.error("Gagal menghapus pesanan:", error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: "Gagal menghapus pesanan", error });
  }
};

const processOrder = async (req, res) => {
  try {
    const { order_id, item_name, os, version, license_count } = req.body;
    const userId = req.userId;

    const software = await Software.findOne({ where: { name: item_name } });
    if (!software) return res.status(404).json({ message: "Software tidak ditemukan" });
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    const softwareVersion = await SoftwareVersion.findOne({
      where: { software_id: software.id, os, version },
    });
    if (!softwareVersion) return res.status(404).json({ message: "Versi software tidak ditemukan" });
    
    // Cek kepemilikan version jika bukan admin
    if (req.userRole !== "admin" && softwareVersion.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke versi software ini" });
    }

    let licenseKeys = [];
    if (software.require_license) {
      // Tambahan filter untuk user_id jika bukan admin
      const whereCondition = { 
        software_id: software.id, 
        is_active: false 
      };
      
      if (req.userRole !== "admin") {
        whereCondition.user_id = userId;
      }
      
      const licenses = await License.findAll({
        where: whereCondition,
        limit: license_count,
      });

      if (licenses.length < license_count) {
        return res.status(400).json({ message: "Lisensi tidak mencukupi" });
      }

      for (const license of licenses) {
        license.is_active = true;
        license.used_at = new Date();
        await license.save();
        licenseKeys.push(license.license_key);
      }
    }

    const order = await Order.create({
      order_id,
      item_name,
      os,
      version,
      license_count,
      status: "processed",
      user_id: userId
    });

    return res.json({
      message: "Pesanan berhasil diproses",
      order_id: order.order_id,
      download_link: softwareVersion.download_link,
      license_keys: software.require_license ? licenseKeys : "Tidak memerlukan lisensi",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan dalam memproses pesanan" });
  }
};

const findOrder = async (req, res) => {
  const { order_id, item_name, os, version, item_amount } = req.body;
  let transaction;
  const userId = req.userId;

  console.log("findOrder diakses oleh:", {
    userId: userId,
    role: req.userRole,
    body: req.body
  });

  // PERBAIKAN: Pastikan semua model di-import dengan benar
  // Cek apakah model Subscription tersedia
  if (!Subscription) {
    console.error("Model Subscription tidak tersedia");
    return res.status(500).json({ 
      message: "Terjadi kesalahan konfigurasi server", 
      error: "Model not available" 
    });
  }

  try {
    // PERBAIKAN: Periksa jika order_id atau item_name kosong
    if (!order_id || !item_name) {
      return res.status(400).json({ 
        message: "Nomor pesanan dan nama produk harus diisi",
        error: true 
      });
    }

    // PERBAIKAN: Batasi scope transaksi dan tangani dengan lebih baik
    try {
      // Mulai transaksi database
      transaction = await db.sequelize.transaction();
      
      // Cari software berdasarkan nama DAN user_id
      console.log("Mencari software dengan nama:", item_name, "untuk user:", userId);
      
      let whereCondition = {};
      
      // PERBAIKAN: Gunakan pendekatan yang lebih sederhana untuk mencari software
      if (req.userRole === "admin") {
        // Admin dapat mencari semua software
        whereCondition = db.sequelize.where(
          db.sequelize.fn("LOWER", db.sequelize.col("name")), 
          db.sequelize.fn("LOWER", item_name)
        );
      } else {

      // Filter berdasarkan user_id jika bukan admin
       whereCondition = {
          [Op.and]: [
            db.sequelize.where(
              db.sequelize.fn("LOWER", db.sequelize.col("name")), 
              db.sequelize.fn("LOWER", item_name)
            ),
            { user_id: userId }
          ]
        };
      }
      
      let software = await Software.findOne({
        where: whereCondition,
        transaction
      });

      if (!software) {
        console.log("Software tidak ditemukan");
        await transaction.rollback();
        return res.status(404).json({ message: "Software tidak ditemukan" });
      }
      
      console.log("Software ditemukan:", {
        id: software.id,
        name: software.name,
        requires_license: software.requires_license,
        user_id: software.user_id
      });
      
      // Cari versi software
      let softwareVersion = null;
      let versionQuery = { software_id: software.id };
      
      if (os) versionQuery.os = os;
      if (version) versionQuery.version = version;
      
      // Filter berdasarkan user_id jika bukan admin
      if (req.userRole !== "admin") {
        versionQuery.user_id = userId;
      }
      
      console.log("Mencari versi software dengan query:", versionQuery);
      
      softwareVersion = await SoftwareVersion.findOne({
        where: versionQuery,
        transaction
      });
      
      console.log("Versi software:", softwareVersion ? {
        id: softwareVersion.id,
        version: softwareVersion.version,
        os: softwareVersion.os,
        download_link: softwareVersion.download_link ? "Ada" : "Tidak ada"
      } : "Tidak ditemukan");

      // Jika software tidak butuh lisensi → return download link saja
      if (!software.requires_license) {
        await transaction.commit();
        return res.json({
          message: "Pesanan ditemukan dan diproses",
          item: software.name,
          order_id: null,
          download_link: softwareVersion?.download_link || null,
          licenses: []
        });
      }

      // Jika software membutuhkan versi tapi versi tidak ditemukan → return pesan
      if (software.search_by_version && !softwareVersion) {
        await transaction.commit();
        return res.json({
          message: "Versi software tidak ditemukan",
          item: software.name,
          order_id: null,
          download_link: null,
          licenses: []
        });
      }

      // Cari lisensi
      let licenseQuery = { 
        software_id: software.id, 
        is_active: false 
      };
      
      if (software.search_by_version && softwareVersion) {
        licenseQuery.software_version_id = softwareVersion.id;
      }
      
      // Filter berdasarkan user_id jika bukan admin
      if (req.userRole !== "admin") {
        licenseQuery.user_id = userId;
      }
      
      console.log("Mencari lisensi dengan query:", licenseQuery);
      
      const licenses = await License.findAll({
        where: licenseQuery,
        limit: parseInt(item_amount || 1, 10),
        transaction
      });
      
      console.log(`Ditemukan ${licenses.length} lisensi dari ${item_amount || 1} yang dibutuhkan`);

      // Jika lisensi tidak cukup tetapi ada download link
      if (licenses.length < parseInt(item_amount || 1, 10) && 
          software.requires_license && 
          software.search_by_version && 
          softwareVersion?.download_link) {
        await transaction.commit();
        return res.json({
          message: "Lisensi tidak tersedia, tetapi download link diberikan",
          item: software.name,
          order_id: null,
          download_link: softwareVersion.download_link,
          licenses: []
        });
      }

      // Jika lisensi tidak cukup sama sekali
      if (licenses.length < parseInt(item_amount || 1, 10)) {
        await transaction.rollback();
        return res.status(400).json({ message: "Stok lisensi tidak cukup" });
      }

      // Tandai lisensi sebagai aktif
      console.log("Mengaktifkan lisensi yang ditemukan");
      
      const licenseIds = [];
      const licenseKeys = [];
      
      for (const license of licenses) {
        await license.update({ 
          is_active: true, 
          used_at: new Date()
        }, { transaction });
        
        licenseIds.push(license.id);
        licenseKeys.push(license.license_key);
      }
      
      // Buat pesanan baru
      console.log("Membuat pesanan baru untuk user:", userId);
      
      const order = await Order.create({
        order_id,
        item_name,
        os: os || '',
        version: version || '',
        license_count: parseInt(item_amount || 1, 10),
        status: "processed",
        software_id: software.id,
        user_id: userId,
        createdAt: new Date()
      }, { transaction });
      
      console.log("Pesanan berhasil dibuat dengan ID:", order.id);
      
      // Kaitkan lisensi dengan pesanan
      console.log("Mengaitkan lisensi dengan pesanan");
      
      for (const licenseId of licenseIds) {
        await OrderLicense.create({
          order_id: order.id,
          license_id: licenseId
        }, { transaction });
      }
      
      // Commit transaksi
      await transaction.commit();
      console.log("Transaksi berhasil dicommit");
      
      // Kirim respons
      return res.json({
        message: "Pesanan ditemukan dan diproses",
        item: software.name,
        order_id: order.order_id,
        download_link: softwareVersion?.download_link || null,
        licenses: licenseKeys,
        success: true
      });
      
    } catch (err) {
      // Rollback transaksi jika terjadi error
      console.error("Error dalam transaksi:", err);
      if (transaction) await transaction.rollback();
      
      return res.status(500).json({ 
        message: "Terjadi kesalahan saat memproses pesanan", 
        error: err.message 
      });
    }
    
  } catch (generalError) {
    console.error("Error umum:", generalError);
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }
    
    return res.status(500).json({ 
      message: "Terjadi kesalahan pada server", 
      error: generalError.message
    });
  }
};

const getOrderUsage = async (req, res) => {
  try {
    let { startDate, endDate } = req.body;
    const userId = req.userId;

    // Jika tidak ada filter, gunakan default 30 hari terakhir
    if (!startDate || !endDate) {
      const today = new Date();
      const last30Days = new Date();
      last30Days.setDate(today.getDate() - 30);

      startDate = startDate || last30Days.toISOString().split("T")[0]; // Format YYYY-MM-DD
      endDate = endDate || today.toISOString().split("T")[0];
    }

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date();
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();

    console.log("Filter tanggal:", { finalStartDate, finalEndDate, userId });

    // Gunakan raw query untuk menghindari masalah dengan alias
    const query = `
      SELECT Orders.software_id, COUNT(Orders.software_id) AS count, Software.name
      FROM Orders
      LEFT JOIN Software ON Orders.software_id = Software.id
      WHERE Orders.createdAt BETWEEN ? AND ?
      ${req.userRole !== "admin" ? "AND Orders.user_id = ?" : ""}
      GROUP BY Orders.software_id, Software.id
    `;

    const replacements = [
      finalStartDate,
      finalEndDate,
      ...(req.userRole !== "admin" ? [userId] : [])
    ];

    const orders = await db.sequelize.query(query, {
      replacements,
      type: db.Sequelize.QueryTypes.SELECT
    });

    console.log("Order Usage Data:", orders);

    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Format data sesuai yang frontend butuhkan
    const result = orders.map((order) => ({
      name: order.name,
      count: parseInt(order.count),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching order usage:", error);
    console.error("Error detail:", error.sql || error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getOrderCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.userId;

    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    // Tambahan filter untuk user_id jika bukan admin
    const whereCondition = {
      createdAt: {
        [db.Sequelize.Op.between]: [finalStartDate, finalEndDate],
      }
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }

    const totalOrders = await Order.count({
      where: whereCondition
    });

    res.json({ totalOrders });
  } catch (error) {
    console.error("Error fetching order count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  processOrder,
  findOrder,
  getOrderUsage,
  getOrderCount,
};