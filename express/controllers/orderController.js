const { Order, License, Software, SoftwareVersion, OrderLicense, db } = require("../models");
const { Op } = require("sequelize");

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: License,
          through: { attributes: [] },
          attributes: ["id", "license_key", "is_active", "used_at"],
        },
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
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan", error });
  }
};

const createOrder = async (req, res) => {
  try {
    const { order_id, item_name, os, version, license_count, status } = req.body;
    const newOrder = await Order.create({ order_id, item_name, os, version, license_count, status });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan pesanan", error });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { order_id, item_name, os, version, license_count, status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });

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

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: License, through: { attributes: [] } }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
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

    const software = await Software.findOne({ where: { name: item_name } });
    if (!software) return res.status(404).json({ message: "Software tidak ditemukan" });

    const softwareVersion = await SoftwareVersion.findOne({
      where: { software_id: software.id, os, version },
    });
    if (!softwareVersion) return res.status(404).json({ message: "Versi software tidak ditemukan" });

    let licenseKeys = [];
    if (software.require_license) {
      const licenses = await License.findAll({
        where: { software_id: software.id, is_active: false },
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

// const findOrder = async (req, res) => {
//   const { order_id, item_name, os, version, item_amount } = req.body;
//   let transaction;

//   try {
//     transaction = await db.sequelize.transaction({
//       isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
//     });

//     const software = await Software.findOne({
//       where: db.sequelize.where(db.sequelize.fn("LOWER", db.sequelize.col("name")), { [db.Sequelize.Op.regexp]: item_name.toLowerCase() }),
//     });

//     if (!software) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "Software tidak ditemukan" });
//     }

//     // Cari softwareVersion berdasarkan software_id, os, version
//     const softwareVersion = await SoftwareVersion.findOne({
//       where: { software_id: software.id, os, version },
//       transaction,
//     });

//     let licenses = [];
//     let licenseInfo = [];

//     // Jika software tidak butuh lisensi dan tidak butuh versi → return download link saja
//     if (!software.requires_license) {
//       await transaction.commit();
//       return res.json({
//         message: "Pesanan ditemukan dan diproses",
//         item: software.name,
//         order_id: null,
//         download_link: softwareVersion?.download_link || null,
//         licenses: [], // Kosongkan lisensi karena tidak diperlukan
//       });
//     }

//     // Jika software membutuhkan versi tertentu tapi versi tidak ditemukan → return error
//     if (software.search_by_version && !softwareVersion) {
//       await transaction.commit();
//       return res.json({
//         message: "Versi software tidak ditemukan",
//         item: software.name,
//         order_id: null,
//         download_link: null,
//         licenses: [],
//       });
//     }

//     // Mencari lisensi
//     let licenseQuery = { software_id: software.id, is_active: false };

//     if (software.search_by_version) {
//       // Jika software butuh lisensi & butuh versi spesifik, gunakan software_version_id
//       licenseQuery.software_version_id = softwareVersion?.id;
//     }

//     // Cari lisensi yang tersedia
//     licenses = await License.findAll({
//       where: licenseQuery,
//       limit: item_amount,
//       lock: true,
//       transaction,
//     });

//     // Jika lisensi tidak cukup, tetapi softwareVersion tersedia dan software membutuhkan lisensi & versi → Kembalikan download link saja
//     if (licenses.length < item_amount && software.requires_license && software.search_by_version && softwareVersion?.download_link) {
//       await transaction.commit();
//       return res.json({
//         message: "Lisensi tidak tersedia, tetapi download link diberikan",
//         item: software.name,
//         order_id: null,
//         download_link: softwareVersion.download_link,
//         licenses: [],
//       });
//     }

//     if (licenses.length < item_amount) {
//       await transaction.rollback();
//       return res.status(400).json({ message: "Stok lisensi tidak cukup" });
//     }

//     // Tandai lisensi sebagai aktif
//     await Promise.all(
//       licenses.map(async (license) => {
//         await license.update(
//           { is_active: true, used_at: new Date(), updatedAt: new Date() }, // Set updatedAt
//           { transaction }
//         );
//       })
//     );

//     licenseInfo = licenses.map((l) => l.license_key);

//     // Simpan order dalam database
//     const order = await Order.create(
//       {
//         order_id,
//         item_name,
//         os,
//         version,
//         license_count: software.requires_license ? item_amount : 0,
//         status: "processed",
//         software_id: software.id,
//         createdAt: new Date(), // Set createdAt
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     await Promise.all(
//       licenses.map(async (license) => {
//         await OrderLicense.create(
//           {
//             order_id: order.id,
//             license_id: license.id,
//           },
//           { transaction }
//         );
//       })
//     );

//     return res.json({
//       message: "Pesanan ditemukan dan diproses",
//       item: software.name,
//       order_id: order.order_id,
//       download_link: softwareVersion?.download_link || null,
//       licenses: licenseInfo,
//     });
//   } catch (error) {
//     console.error("Terjadi kesalahan:", error);
//     if (transaction) await transaction.rollback();
//     return res.status(500).json({ message: "Terjadi kesalahan pada server" });
//   } finally {
//     if (transaction) transaction = null;
//   }
// };

const findOrder = async (req, res) => {
  const { order_id, item_name, os, version, item_amount } = req.body;
  let transaction;

  try {
    transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    const software = await Software.findOne({
      where: db.sequelize.where(db.sequelize.fn("LOWER", db.sequelize.col("name")), { [db.Sequelize.Op.regexp]: item_name.toLowerCase() }),
    });

    if (!software) {
      await transaction.rollback();
      return res.status(404).json({ message: "Software tidak ditemukan" });
    }

    const softwareVersion = await SoftwareVersion.findOne({
      where: { software_id: software.id, os, version },
      transaction,
    });

    let licenses = [];
    let licenseInfo = [];

    if (!software.requires_license) {
      await transaction.commit();
      return res.json({
        message: "Pesanan ditemukan dan diproses",
        item: software.name,
        order_id: null,
        download_link: softwareVersion?.download_link || null,
        licenses: [],
      });
    }

    if (software.search_by_version && !softwareVersion) {
      await transaction.commit();
      return res.json({
        message: "Versi software tidak ditemukan",
        item: software.name,
        order_id: null,
        download_link: null,
        licenses: [],
      });
    }

    let licenseQuery = { software_id: software.id, is_active: false };

    if (software.search_by_version) {
      licenseQuery.software_version_id = softwareVersion?.id;
    }

    licenses = await License.findAll({
      where: licenseQuery,
      limit: item_amount,
      lock: true,
      transaction,
    });

    if (licenses.length < item_amount && software.search_by_version && softwareVersion?.download_link) {
      await transaction.commit();
      return res.json({
        message: "Lisensi tidak tersedia, tetapi download link diberikan",
        item: software.name,
        order_id: null,
        download_link: softwareVersion.download_link,
        licenses: [],
      });
    }

    if (licenses.length < item_amount) {
      await transaction.rollback();
      return res.status(400).json({ message: "Stok lisensi tidak cukup" });
    }

    await Promise.all(
      licenses.map(async (license) => {
        await license.update({ is_active: true, used_at: new Date(), updatedAt: new Date() }, { transaction });
      })
    );

    licenseInfo = licenses.map((l) => l.license_key);

    const order = await Order.create(
      {
        order_id,
        item_name,
        os,
        version,
        license_count: software.requires_license ? item_amount : 0,
        // license_count: software.requires_license ? licenseInfo : 0,
        status: "processed",
        software_id: software.id,
        createdAt: new Date(),
      },
      { transaction }
    );

    await Promise.all(
      licenses.map(async (license) => {
        await OrderLicense.create(
          {
            order_id: order.id,
            license_id: license.id,
          },
          { transaction }
        );
      })
    );

    await transaction.commit();

    return res.json({
      message: "Pesanan ditemukan dan diproses",
      item: software.name,
      order_id: order.order_id,
      download_link: softwareVersion?.download_link || null,
      licenses: licenseInfo,
    });
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    if (transaction && !transaction.finished) await transaction.rollback();
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (transaction) transaction = null;
  }
};

const getOrderUsage = async (req, res) => {
  try {
    let { startDate, endDate } = req.body;

    // Jika tidak ada filter, gunakan default 30 hari terakhir
    if (!startDate || !endDate) {
      const today = new Date();
      const last30Days = new Date();
      last30Days.setDate(today.getDate() - 30);

      startDate = startDate || last30Days.toISOString().split("T")[0]; // Format YYYY-MM-DD
      endDate = endDate || today.toISOString().split("T")[0];
    }

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    const orders = await Order.findAll({
      attributes: ["software_id", [db.Sequelize.fn("COUNT", db.Sequelize.col("software_id")), "count"]],
      include: [{ model: Software, attributes: ["name"] }],
      where: {
        createdAt: {
          [Op.between]: [finalStartDate, finalEndDate],
        },
      },
      group: ["software_id", "Software.id"],
      raw: true,
    });

    console.log("Order Usage Data:", orders); // 🔍 Debug: Pastikan data keluar

    if (orders.length === 0) {
      return res.json([]); // ✅ Jika kosong, tetap kembalikan array kosong
    }

    // Format data sesuai yang frontend butuhkan
    const result = orders.map((order) => ({
      name: order["Software.name"],
      count: order.count,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching order usage:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getOrderCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    // const finalStartDate = startDate || defaultStartDate.toISOString().split("T")[0];
    // const finalEndDate = endDate || today.toISOString().split("T")[0];

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    const totalOrders = await Order.count({
      where: {
        createdAt: {
          [db.Sequelize.Op.between]: [finalStartDate, finalEndDate],
        },
      },
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
