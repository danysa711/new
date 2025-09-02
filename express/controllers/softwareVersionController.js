const { SoftwareVersion, Software } = require("../models");
const { Op } = require("sequelize");

const getAllSoftwareVersions = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Filter kondisi berdasarkan role
    const whereCondition = req.userRole === "admin" 
  ? {} 
  : { user_id: userId };
      
    const versions = await SoftwareVersion.findAll({
      where: whereCondition,
      include: [{ model: Software, attributes: ["name"] }],
    });
    return res.status(200).json(versions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getSoftwareVersionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const version = await SoftwareVersion.findByPk(id, {
      include: [{ model: Software, attributes: ["name"] }],
    });

    if (!version) {
      return res.status(404).json({ message: "Software version tidak ditemukan" });
    }
    
    // Cek akses untuk non-admin
    if (req.userRole !== "admin" && version.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke versi software ini" });
    }

    return res.status(200).json(version);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getSoftwareVersionBySoftwareId = async (req, res) => {
  try {
    const userId = req.userId;
    const softwareId = req.params.software_id;
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin") {
      const software = await Software.findByPk(softwareId);
      if (!software || software.user_id !== userId) {
        return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
      }
    }
    
    const versions = await SoftwareVersion.findAll({
      where: { software_id: softwareId },
    });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil versi software" });
  }
};

const createSoftwareVersion = async (req, res) => {
  try {
    const { software_id, version, os, download_link } = req.body;
    const userId = req.userId;

    // Cek software
    const software = await Software.findByPk(software_id);
    if (!software) {
      return res.status(400).json({ message: "Software ID tidak valid" });
    }
    
    // Cek kepemilikan software jika bukan admin
    if (req.userRole !== "admin" && software.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
    }

    const newVersion = await SoftwareVersion.create({
      software_id,
      version,
      os,
      download_link,
      user_id: userId, // Tambahkan user_id
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "Software version berhasil ditambahkan", version: newVersion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const updateSoftwareVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { software_id, version, os, download_link } = req.body;
    const userId = req.userId;

    // Cek version
    const softwareVersion = await SoftwareVersion.findByPk(id);
    if (!softwareVersion) {
      return res.status(404).json({ message: "Software version tidak ditemukan" });
    }
    
    // Cek kepemilikan version jika bukan admin
    if (req.userRole !== "admin" && softwareVersion.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk mengubah versi software ini" });
    }

    // Cek software jika ada perubahan software_id
    if (software_id && software_id !== softwareVersion.software_id) {
      const software = await Software.findByPk(software_id);
      if (!software) {
        return res.status(400).json({ message: "Software ID tidak valid" });
      }
      
      // Cek kepemilikan software jika bukan admin
      if (req.userRole !== "admin" && software.user_id !== userId) {
        return res.status(403).json({ message: "Anda tidak memiliki akses ke software ini" });
      }
    }

    await softwareVersion.update({
      software_id: software_id || softwareVersion.software_id,
      version,
      os,
      download_link,
      updatedAt: new Date(),
    });

    return res.status(200).json({ message: "Software version berhasil diperbarui", version: softwareVersion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const deleteSoftwareVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const softwareVersion = await SoftwareVersion.findByPk(id);
    if (!softwareVersion) {
      return res.status(404).json({ message: "Software version tidak ditemukan" });
    }
    
    // Cek kepemilikan version jika bukan admin
    if (req.userRole !== "admin" && softwareVersion.user_id !== userId) {
      return res.status(403).json({ message: "Anda tidak memiliki akses untuk menghapus versi software ini" });
    }

    await softwareVersion.destroy();

    return res.status(200).json({ message: "Software version berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getSoftwareVersionCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.userId;

    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    // Filter berdasarkan user_id jika bukan admin
    const whereCondition = {
      createdAt: {
        [Op.between]: [finalStartDate, finalEndDate],
      }
    };
    
    if (req.userRole !== "admin") {
      whereCondition.user_id = userId;
    }
    
    const totalVersions = await SoftwareVersion.count({
      where: whereCondition
    });

    res.json({ totalSoftwareVersions: totalVersions });
  } catch (error) {
    console.error("Error fetching software versions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllSoftwareVersions,
  getSoftwareVersionById,
  getSoftwareVersionBySoftwareId,
  createSoftwareVersion,
  updateSoftwareVersion,
  deleteSoftwareVersion,
  getSoftwareVersionCount,
};