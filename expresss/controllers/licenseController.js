const { License, Software, db, SoftwareVersion } = require("../models");
const { Op } = require("sequelize");

const getAllLicenses = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Getting licenses for user:", userId, "role:", req.userRole);
    
    // Filter kondisi berdasarkan role
    const whereCondition = req.userRole === "admin" 
      ? {} 
      : { user_id: userId };
      
    const licenses = await License.findAll({
      where: whereCondition,
      include: [{ model: Software, attributes: ["name"] }],
    });
    console.log(`Found ${licenses.length} licenses`);
    return res.status(200).json(licenses);
  } catch (error) {
    console.error("Error getting licenses:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}

const getLicenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const license = await License.findByPk(id, {
      include: [{ model: Software, attributes: ["name"] }],
    });

    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
    }
    
    // Cek kepemilikan lisensi jika bukan admin
    if (req.userRole !== "admin" && license.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke lisensi ini" });
    }

    return res.status(200).json(license);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getAllAvailableLicenses = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Filter kondisi berdasarkan role, dan tambahkan filter is_active: false
    const whereCondition = req.userRole === "admin" 
      ? { is_active: false } // Hanya ambil lisensi yang belum digunakan (is_active: false)
      : { user_id: userId, is_active: false }; // Hanya ambil lisensi yang belum digunakan (is_active: false)
    
    const licenses = await License.findAll({
      where: whereCondition,
      include: [
        { model: Software, attributes: ["name"] },
        { model: SoftwareVersion, attributes: ["version", "os"] },
      ],
    });
    return res.status(200).json(licenses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getAvailableLicenses = async (req, res) => {
  try {
    const { software_id, quantity = 1 } = req.query;
    const userId = req.userId;

    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    const whereCondition = {
      software_id,
      is_active: false // Pastikan hanya mengambil lisensi yang belum digunakan
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }

    const licenses = await License.findAll({
      where: whereCondition,
      limit: parseInt(quantity, 10),
    });

    if (licenses.length === 0) {
      return res.status(404).json({ message: "Tidak ada lisensi yang tersedia" });
    }

    return res.status(200).json(licenses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const createLicense = async (req, res) => {
  try {
    const { software_id, license_key, is_active = false, used_at = null } = req.body;
    const userId = req.userId;

    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    const newLicense = await License.create({ 
      software_id, 
      license_key, 
      is_active, 
      used_at,
      user_id: userId 
    });

    return res.status(201).json({ message: "Lisensi berhasil ditambahkan", license: newLicense });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const createMultipleLicenses = async (req, res) => {
  let transaction;

  try {
    transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    const { software_id, license_keys, software_version_id } = req.body;
    const userId = req.userId;

    // Cari software berdasarkan ID
    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    // Jika software memerlukan versi, pastikan software_version_id valid
    if (software.search_by_version) {
      const softwareVersion = await SoftwareVersion.findByPk(software_version_id);
      if (!softwareVersion) {
        return res.status(400).json({ message: "Software Version ID tidak valid" });
      }
      
      // Cek kepemilikan version jika bukan admin
      if (req.userRole !== "admin" && softwareVersion.user_id !== userId) {
        return res.status(403).json({ message: "Anda tidak memiliki akses ke versi software ini" });
      }
    }

    // Jika software tidak membutuhkan lisensi, kembalikan respon
    if (!software.requires_license) {
      return res.status(400).json({ message: "Software ini tidak memerlukan lisensi" });
    }

    // Pastikan license_keys adalah array yang valid
    if (!Array.isArray(license_keys) || license_keys.length === 0) {
      return res.status(400).json({ message: "License keys harus berupa array dan tidak boleh kosong" });
    }

    // Query untuk mendapatkan lisensi yang sudah ada
    const existingLicenses = await License.findAll({
      where: {
        software_id,
        license_key: license_keys,
        ...(software.search_by_version && { software_version_id }), // Tambahkan filter versi jika diperlukan
      },
      transaction,
      lock: transaction.LOCK.IN_SHARE_MODE,
    });

    // Buat set untuk lisensi yang sudah ada
    const existingKeys = new Set(existingLicenses.map((l) => l.license_key));

    // Filter lisensi baru yang belum ada
    const newLicensesData = license_keys
      .filter((key) => !existingKeys.has(key))
      .map((key) => ({
        software_id,
        software_version_id: software.search_by_version ? software_version_id : null,
        license_key: key,
        is_active: false,
        used_at: null,
        user_id: userId, // Tambahkan user_id
        createdAt: new Date(), // Set createdAt saat pembuatan
      }));

    // Masukkan lisensi baru secara bulk jika ada data baru
    if (newLicensesData.length > 0) {
      await License.bulkCreate(newLicensesData, { transaction });
    }

    await transaction.commit();
    return res.status(201).json({
      message: `${newLicensesData.length} lisensi berhasil ditambahkan`,
      licenses: newLicensesData,
    });
  } catch (error) {
    console.error(error);
    if (transaction) await transaction.rollback();
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    if (transaction) transaction = null;
  }
};

const updateLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { software_id, license_key, is_active, used_at } = req.body;
    const userId = req.userId;

    const license = await License.findByPk(id);
    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
    }
    
    // Cek kepemilikan lisensi jika bukan admin
    if (req.userRole !== "admin" && license.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk mengubah lisensi ini" });
    }

    if (software_id) {
      const software = await Software.findByPk(software_id);
      if (!software) {
        return res.status(400).json({ message: "Software ID tidak valid" });
      }
      
      // Cek kepemilikan software jika bukan admin
      if (req.userRole !== "admin" && software.user_id !== userId) {
        return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
      }
    }

    await license.update({ software_id, license_key, is_active, used_at });

    return res.status(200).json({ message: "Lisensi berhasil diperbarui", license });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const updateLicenseMultiply = async (req, res) => {
  try {
    const { software_id, license_keys, software_version_id } = req.body;
    const userId = req.userId;

    // Validasi software
    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    // Validasi software version jika diberikan
    let softwareVersion = null;
    if (software_version_id) {
      softwareVersion = await SoftwareVersion.findByPk(software_version_id);
      if (!softwareVersion) {
        return res.status(400).json({ message: "Software Version ID tidak valid" });
      }
      
      // Cek kepemilikan version jika bukan admin
      if (req.userRole !== "admin" && softwareVersion.user_id !== userId) {
        return res.status(403).json({ message: "Anda tidak memiliki akses ke versi software ini" });
      }
    }

    // Validasi license_keys
    if (!Array.isArray(license_keys) || license_keys.length === 0) {
      return res.status(400).json({ message: "License keys harus berupa array dan tidak boleh kosong" });
    }

    // Filter license keys yang valid
    const validLicenseKeys = [...new Set(license_keys.map((key) => key.trim()).filter((key) => key.length > 0))];

    if (validLicenseKeys.length === 0) {
      return res.status(400).json({ message: "Tidak ada license key yang valid" });
    }

    // Tambahan filter untuk user_id jika bukan admin
    const whereCondition = {
      software_id,
      license_key: validLicenseKeys
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }

    // Ambil semua lisensi yang sudah ada berdasarkan software_id dan license_keys
    const existingLicenses = await License.findAll({
      where: whereCondition
    });

    const existingKeys = new Set(existingLicenses.map((license) => license.license_key));

    // Update lisensi yang sudah ada dengan software_version_id jika diberikan
    const updatePromises = existingLicenses.map(async (license) => {
      if (softwareVersion) {
        license.software_version_id = software_version_id;
      }
      license.updatedAt = new Date(); // Set updatedAt saat update
      return license.save();
    });

    // Buat lisensi baru jika belum ada
    const newLicenses = validLicenseKeys
      .filter((key) => !existingKeys.has(key))
      .map((key) => ({
        software_id,
        license_key: key,
        software_version_id: software_version_id || null,
        is_active: false,
        used_at: null,
        user_id: userId, // Tambahkan user_id
        createdAt: new Date(), // Set createdAt untuk lisensi baru
      }));

    if (newLicenses.length > 0) {
      await License.bulkCreate(newLicenses);
    }

    // Jalankan update lisensi yang sudah ada
    await Promise.all(updatePromises);

    return res.status(200).json({ message: "Lisensi berhasil diperbarui" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const deleteLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const license = await License.findByPk(id);
    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
    }
    
    // Cek kepemilikan lisensi jika bukan admin
    if (req.userRole !== "admin" && license.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk menghapus lisensi ini" });
    }

    await license.destroy();

    return res.status(200).json({ message: "Lisensi berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const deleteMultipleLicenses = async (req, res) => {
  console.log("Payload dari frontend:", req.body);
  try {
    const { licenses } = req.body; // Ambil daftar license_key yang akan dihapus
    const userId = req.userId;

    console.log("Delete lisensi ini:", licenses);
    console.log("User ID:", userId, "Role:", req.userRole);

    // Validasi data input
    if (!licenses) {
      return res.status(400).json({ message: "Parameter 'licenses' tidak ditemukan" });
    }
    
    if (!Array.isArray(licenses)) {
      return res.status(400).json({ message: "Parameter 'licenses' harus berupa array" });
    }
    
    if (licenses.length === 0) {
      return res.status(400).json({ message: "Tidak ada lisensi yang dipilih untuk dihapus" });
    }

    // Tambahan filter untuk user_id jika bukan admin
    const whereCondition = {
      license_key: licenses // Gunakan langsung array license keys
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }

    console.log("Where condition:", whereCondition);

    // Cari lisensi yang ingin dihapus terlebih dahulu
    const licensesToDelete = await License.findAll({
      where: whereCondition
    });

    console.log("Licenses found:", licensesToDelete.length);

    // Jika tidak ada lisensi yang ditemukan
    if (licensesToDelete.length === 0) {
      return res.status(404).json({ message: "Tidak ada lisensi yang ditemukan untuk dihapus" });
    }

    // Periksa apakah ada lisensi yang aktif
    const activeFound = licensesToDelete.some(license => license.is_active);
    if (activeFound) {
      return res.status(400).json({ message: "Tidak dapat menghapus lisensi yang sedang aktif/digunakan" });
    }

    // Hapus semua license dengan license_key yang ada dalam array
    const result = await License.destroy({
      where: whereCondition
    });

    console.log("Delete result:", result);

    return res.status(200).json({ 
      message: `${result} lisensi berhasil dihapus`
    });
  } catch (error) {
    console.error("Error deleting licenses:", error);
    return res.status(500).json({ message: "Gagal menghapus lisensi", error: error.message });
  }
};

const activateLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const license = await License.findByPk(id);
    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
    }
    
    // Cek kepemilikan lisensi jika bukan admin
    if (req.userRole !== "admin" && license.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk mengaktifkan lisensi ini" });
    }

    if (license.is_active) {
      return res.status(400).json({ message: "Lisensi sudah digunakan" });
    }

    await license.update({ is_active: true, used_at: new Date() });

    return res.status(200).json({ message: "Lisensi berhasil diaktifkan", license });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getLicenseCount = async (req, res) => {
  try {
    const { startDate, endDate, available } = req.body;
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
    
    // Jika parameter 'available' = true, hanya tampilkan lisensi yang tersedia (is_active = false)
    if (available === true) {
      whereCondition.is_active = false;
    }
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }

    const totalLicenses = await License.count({
      where: whereCondition
    });

    res.json({ totalLicenses });
  } catch (error) {
    console.error("Error fetching license count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAvailableLicensesCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.userId;

    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    // Tambahan filter untuk user_id jika bukan admin, serta filter is_active: false
    const whereCondition = {
      is_active: false, // Hanya hitung lisensi yang belum digunakan
      createdAt: {
        [Op.between]: [finalStartDate.toISOString(), finalEndDate.toISOString()],
      }
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }

    const availableLicenses = await License.count({
      where: whereCondition
    });

    res.json({ availableLicenses });
  } catch (error) {
    console.error("Error fetching available licenses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllLicenses,
  getLicenseById,
  getAllAvailableLicenses,
  getAvailableLicenses,
  createLicense,
  updateLicense,
  deleteLicense,
  deleteMultipleLicenses,
  activateLicense,
  createMultipleLicenses,
  updateLicenseMultiply,
  getLicenseCount,
  getAvailableLicensesCount,
};