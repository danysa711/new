const { User, Software, SoftwareVersion, License, Order, Subscription, db } = require("../models");

const getUserPublicData = async (req, res) => {
  try {
    const { slug } = req.params;

    // Cari user berdasarkan slug
    const user = await User.findOne({
      where: { url_slug: slug },
      attributes: ['id', 'username', 'url_slug', 'backend_url', 'createdAt', 'role'],
    });

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    // Cek apakah user memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: user.id,
        status: 'active',
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      },
      attributes: ['id', 'start_date', 'end_date', 'status']
    });

    // Dapatkan statistik user
    const softwareCount = await Software.count({ where: { user_id: user.id } });
    const versionCount = await SoftwareVersion.count({ where: { user_id: user.id } });
    const licenseCount = await License.count({ where: { user_id: user.id } });
    const orderCount = await Order.count({ where: { user_id: user.id } });

    // Format respons
    const response = {
      username: user.username,
      url_slug: user.url_slug,
      backend_url: user.backend_url,
      createdAt: user.createdAt,
      hasActiveSubscription: !!activeSubscription,
      stats: {
        software: softwareCount,
        versions: versionCount,
        licenses: licenseCount,
        orders: orderCount
      }
    };

    // Jika user memiliki langganan aktif, berikan lebih banyak data
    if (activeSubscription) {
      response.subscription = {
        startDate: activeSubscription.start_date,
        endDate: activeSubscription.end_date,
        status: activeSubscription.status
      };

      // Tambahkan data produk terbaru
      const latestSoftware = await Software.findAll({
        where: { user_id: user.id },
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'requires_license', 'search_by_version', 'createdAt']
      });

      response.latestSoftware = latestSoftware;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error getting public user data:", error);
    return res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validasi ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID user tidak valid" });
    }

    // Cari user berdasarkan ID
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'url_slug', 'createdAt', 'role'],
    });

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    // Cek apakah user memiliki langganan aktif
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: user.id,
        status: 'active',
        end_date: {
          [db.Sequelize.Op.gt]: new Date()
        }
      },
      attributes: ['id', 'start_date', 'end_date', 'status']
    });

    // Dapatkan statistik user
    const softwareCount = await Software.count({ where: { user_id: user.id } });
    const versionCount = await SoftwareVersion.count({ where: { user_id: user.id } });
    const licenseCount = await License.count({ where: { user_id: user.id } });
    const orderCount = await Order.count({ where: { user_id: user.id } });

    // Format respons
    const response = {
      username: user.username,
      url_slug: user.url_slug,
      createdAt: user.createdAt,
      hasActiveSubscription: !!activeSubscription,
      stats: {
        software: softwareCount,
        versions: versionCount,
        licenses: licenseCount,
        orders: orderCount
      }
    };

    // Jika user memiliki langganan aktif, berikan lebih banyak data
    if (activeSubscription) {
      response.subscription = {
        startDate: activeSubscription.start_date,
        endDate: activeSubscription.end_date,
        status: activeSubscription.status
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return res.status(500).json({ error: "Terjadi kesalahan, coba lagi nanti" });
  }
};

module.exports = { getUserPublicData, getUserById };