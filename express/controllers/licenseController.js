const { License, Software, db, SoftwareVersion } = require("../models");
const { Op } = require("sequelize");

const getAllLicenses = async (req, res) => {
  try {
    const licenses = await License.findAll({
      include: [{ model: Software, attributes: ["name"] }],
    });
    return res.status(200).json(licenses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getLicenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const license = await License.findByPk(id, {
      include: [{ model: Software, attributes: ["name"] }],
    });

    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
    }

    return res.status(200).json(license);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const createLicense = async (req, res) => {
  try {
    const { software_id, license_key, is_active = false, used_at = null } = req.body;

    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }

    const newLicense = await License.create({ software_id, license_key, is_active, used_at });

    return res.status(201).json({ message: "Lisensi berhasil ditambahkan", license: newLicense });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// const createMultipleLicenses = async (req, res) => {
//   let transaction;

//   try {
//     transaction = await db.sequelize.transaction({
//       isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
//     });

//     const { software_id, license_keys, software_version_id } = req.body;

//     // Cari software berdasarkan ID
//     const software = await Software.findByPk(software_id);
//     console.log(software);
//     if (!software) {
//       return res.status(400).json({ message: "Software ID tidak valid" });
//     }

//     // Jika software memerlukan versi, pastikan software_version_id valid
//     if (software.search_by_version) {
//       const softwareVersion = await SoftwareVersion.findByPk(software_version_id);
//       if (!softwareVersion) {
//         return res.status(400).json({ message: "Software Version ID tidak valid" });
//       }
//     }

//     // Jika software tidak membutuhkan lisensi, kembalikan respon
//     if (!software.requires_license) {
//       return res.status(400).json({ message: "Software ini tidak memerlukan lisensi" });
//     }

//     // Pastikan license_keys adalah array yang valid
//     if (!Array.isArray(license_keys) || license_keys.length === 0) {
//       return res.status(400).json({ message: "License keys harus berupa array dan tidak boleh kosong" });
//     }

//     // Query untuk mendapatkan lisensi yang sudah ada
//     const existingLicenses = await License.findAll({
//       where: {
//         software_id,
//         license_key: license_keys,
//         ...(software.search_by_version && { software_version_id }), // Tambahkan filter versi jika diperlukan
//       },
//       transaction,
//       lock: transaction.LOCK.IN_SHARE_MODE,
//     });

//     // Buat set untuk lisensi yang sudah ada
//     const existingKeys = new Set(existingLicenses.map((l) => l.license_key));

//     // Filter lisensi baru yang belum ada
//     const newLicensesData = license_keys
//       .filter((key) => !existingKeys.has(key))
//       .map((key) => ({
//         software_id,
//         software_version_id: software.search_by_version ? software_version_id : null,
//         license_key: key,
//         is_active: false,
//         used_at: null,
//       }));

//     // Masukkan lisensi baru secara bulk jika ada data baru
//     if (newLicensesData.length > 0) {
//       await License.bulkCreate(newLicensesData, { transaction });
//     }

//     await transaction.commit();
//     return res.status(201).json({
//       message: `${newLicensesData.length} lisensi berhasil ditambahkan`,
//       licenses: newLicensesData,
//     });
//   } catch (error) {
//     console.error(error);
//     if (transaction) await transaction.rollback();
//     return res.status(500).json({ message: "Terjadi kesalahan pada server" });
//   } finally {
//     if (transaction) transaction = null;
//   }
// };

const createMultipleLicenses = async (req, res) => {
  let transaction;

  try {
    transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    const { software_id, license_keys, software_version_id } = req.body;

    // Cari software berdasarkan ID
    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }

    // Jika software memerlukan versi, pastikan software_version_id valid
    if (software.search_by_version) {
      const softwareVersion = await SoftwareVersion.findByPk(software_version_id);
      if (!softwareVersion) {
        return res.status(400).json({ message: "Software Version ID tidak valid" });
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

    const license = await License.findByPk(id);
    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
    }

    if (software_id) {
      const software = await Software.findByPk(software_id);
      if (!software) {
        return res.status(400).json({ message: "Software ID tidak valid" });
      }
    }

    await license.update({ software_id, license_key, is_active, used_at });

    return res.status(200).json({ message: "Lisensi berhasil diperbarui", license });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// const updateLicenseMultiply = async (req, res) => {
//   try {
//     const { software_id, license_keys, software_version_id } = req.body;

//     // Validasi software
//     const software = await Software.findByPk(software_id);
//     if (!software) {
//       return res.status(400).json({ message: "Software ID tidak valid" });
//     }

//     // Validasi software version jika diberikan
//     let softwareVersion = null;
//     if (software_version_id) {
//       softwareVersion = await SoftwareVersion.findByPk(software_version_id);
//       if (!softwareVersion) {
//         return res.status(400).json({ message: "Software Version ID tidak valid" });
//       }
//     }

//     // Validasi license_keys
//     if (!Array.isArray(license_keys) || license_keys.length === 0) {
//       return res.status(400).json({ message: "License keys harus berupa array dan tidak boleh kosong" });
//     }

//     // Filter license keys yang valid
//     const validLicenseKeys = [...new Set(license_keys.map((key) => key.trim()).filter((key) => key.length > 0))];

//     if (validLicenseKeys.length === 0) {
//       return res.status(400).json({ message: "Tidak ada license key yang valid" });
//     }

//     // Ambil semua lisensi yang sudah ada berdasarkan software_id dan license_keys
//     const existingLicenses = await License.findAll({
//       where: {
//         software_id,
//         license_key: validLicenseKeys,
//       },
//     });

//     const existingKeys = new Set(existingLicenses.map((license) => license.license_key));

//     // Update lisensi yang sudah ada dengan software_version_id jika diberikan
//     const updatePromises = existingLicenses.map(async (license) => {
//       if (softwareVersion) {
//         license.software_version_id = software_version_id;
//       }
//       return license.save();
//     });

//     // Buat lisensi baru jika belum ada
//     const newLicenses = validLicenseKeys
//       .filter((key) => !existingKeys.has(key))
//       .map((key) => ({
//         software_id,
//         license_key: key,
//         software_version_id: software_version_id || null,
//         is_active: false,
//         used_at: null,
//       }));

//     if (newLicenses.length > 0) {
//       await License.bulkCreate(newLicenses);
//     }

//     // Jalankan update lisensi yang sudah ada
//     await Promise.all(updatePromises);

//     return res.status(200).json({ message: "Lisensi berhasil diperbarui" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Terjadi kesalahan pada server" });
//   }
// };

const updateLicenseMultiply = async (req, res) => {
  try {
    const { software_id, license_keys, software_version_id } = req.body;

    // Validasi software
    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }

    // Validasi software version jika diberikan
    let softwareVersion = null;
    if (software_version_id) {
      softwareVersion = await SoftwareVersion.findByPk(software_version_id);
      if (!softwareVersion) {
        return res.status(400).json({ message: "Software Version ID tidak valid" });
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

    // Ambil semua lisensi yang sudah ada berdasarkan software_id dan license_keys
    const existingLicenses = await License.findAll({
      where: {
        software_id,
        license_key: validLicenseKeys,
      },
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

    const license = await License.findByPk(id);
    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
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

    console.log("Delete lisensi ini:", licenses);

    if (!Array.isArray(licenses) || licenses.length === 0) {
      return res.status(400).json({ message: "No licenses provided for deletion" });
    }

    // Hapus semua license dengan license_key yang ada dalam array
    await License.destroy({
      where: {
        license_key: licenses, // Gunakan langsung array license keys
      },
    });

    return res.status(200).json({ message: "Selected licenses deleted successfully" });
  } catch (error) {
    console.error("Error deleting licenses:", error);
    return res.status(500).json({ message: "Failed to delete licenses", error });
  }
};

const getAllAvailableLicenses = async (req, res) => {
  try {
    const licenses = await License.findAll({
      where: { is_active: false },
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

    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }

    const licenses = await License.findAll({
      where: {
        software_id,
        is_active: false,
      },
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

const activateLicense = async (req, res) => {
  try {
    const { id } = req.params;

    const license = await License.findByPk(id);
    if (!license) {
      return res.status(404).json({ message: "Lisensi tidak ditemukan" });
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
    const { startDate, endDate } = req.body;

    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    const totalLicenses = await License.count({
      where: {
        createdAt: {
          [db.Sequelize.Op.between]: [finalStartDate, finalEndDate],
        },
      },
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

    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    // Pastikan format tanggal sesuai
    // const finalStartDate = startDate ? new Date(startDate) : defaultStartDate;
    // const finalEndDate = endDate ? new Date(endDate) : today;

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    const availableLicenses = await License.count({
      where: {
        is_active: false, // Ganti isUsed dengan is_active sesuai fungsi asli
        createdAt: {
          [Op.between]: [finalStartDate.toISOString(), finalEndDate.toISOString()],
        },
      },
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
