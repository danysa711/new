const { Software, db } = require("../models");
const { Op } = require("sequelize");

const getAllSoftware = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Getting software for user:", userId, "role:", req.userRole);

    let softwareList;
    
    // Jika user adalah admin, ambil semua software
    if (req.userRole === "admin") {
      softwareList = await Software.findAll();
    } else {
      // Jika user biasa, hanya ambil software miliknya
      softwareList = await Software.findAll({
        where: { user_id: userId }
      });
    }
    
    console.log(`Found ${softwareList.length} software items`);
    return res.status(200).json(softwareList);
  } catch (error) {
    console.error("Error getting software:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getSoftwareById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const software = await Software.findByPk(id);

    if (!software) {
      return res.status(404).json({ message: "Software tidak ditemukan" });
    }

    // Jika bukan admin dan bukan pemilik software, tolak akses
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    return res.status(200).json(software);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const createSoftware = async (req, res) => {
  try {
    const { name, requires_license, search_by_version } = req.body;
    const userId = req.userId;

    const newSoftware = await Software.create({
      name,
      requires_license,
      search_by_version,
      user_id: userId, // Tambahkan user_id ke software yang dibuat
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({ message: "Software berhasil ditambahkan", software: newSoftware });
  } catch (error) {
    console.error("Error creating software:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const updateSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, requires_license, search_by_version } = req.body;
    const userId = req.userId;

    const software = await Software.findByPk(id);
    if (!software) {
      return res.status(404).json({ message: "Software tidak ditemukan" });
    }

    // Jika bukan admin dan bukan pemilik software, tolak akses
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk mengubah software ini" });
    }

    await software.update({
      name,
      requires_license,
      search_by_version,
      updatedAt: new Date(),
    });

    return res.status(200).json({ message: "Software berhasil diperbarui", software });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const deleteSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const software = await Software.findByPk(id);
    if (!software) {
      return res.status(404).json({ message: "Software tidak ditemukan" });
    }

    // Jika bukan admin dan bukan pemilik software, tolak akses
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk menghapus software ini" });
    }

    await software.destroy();

    return res.status(200).json({ message: "Software berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getSoftwareCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.userId;

    console.log("Received Filter:", { startDate, endDate });

    // Default 30 hari terakhir
    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    console.log("finalStartDate finalEndDate:", { finalStartDate, finalEndDate });
    
    // Filter berdasarkan user_id jika bukan admin
    const whereCondition = {
      createdAt: {
        [db.Sequelize.Op.between]: [finalStartDate, finalEndDate],
      }
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }
    
    const totalSoftware = await Software.count({
      where: whereCondition
    });

    res.json({ totalSoftware });
  } catch (error) {
    console.error("Error fetching software count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllSoftware,
  getSoftwareById,
  createSoftware,
  updateSoftware,
  deleteSoftware,
  getSoftwareCount,
};