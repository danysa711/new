const { Software, db } = require("../models");
const { Op } = require("sequelize");

const getAllSoftware = async (req, res) => {
  try {
    const softwareList = await Software.findAll();
    return res.status(200).json(softwareList);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const getSoftwareById = async (req, res) => {
  try {
    const { id } = req.params;
    const software = await Software.findByPk(id);

    if (!software) {
      return res.status(404).json({ message: "Software tidak ditemukan" });
    }

    return res.status(200).json(software);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// const createSoftware = async (req, res) => {
//   try {
//     const { name, requires_license, search_by_version } = req.body;

//     const newSoftware = await Software.create({ name, requires_license, search_by_version });

//     return res.status(201).json({ message: "Software berhasil ditambahkan", software: newSoftware });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Terjadi kesalahan pada server" });
//   }
// };

const createSoftware = async (req, res) => {
  try {
    const { name, requires_license, search_by_version } = req.body;

    const newSoftware = await Software.create({
      name,
      requires_license,
      search_by_version,
      createdAt: new Date(), // Menambahkan createdAt agar selalu update dengan waktu saat ini
      updatedAt: new Date(), // Pastikan updatedAt juga diperbarui
    });

    return res.status(201).json({ message: "Software berhasil ditambahkan", software: newSoftware });
  } catch (error) {
    console.error("Error creating software:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// const updateSoftware = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, requires_license, search_by_version } = req.body;

//     const software = await Software.findByPk(id);
//     if (!software) {
//       return res.status(404).json({ message: "Software tidak ditemukan" });
//     }

//     await software.update({ name, requires_license, search_by_version });

//     return res.status(200).json({ message: "Software berhasil diperbarui", software });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Terjadi kesalahan pada server" });
//   }
// };

const updateSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, requires_license, search_by_version } = req.body;

    const software = await Software.findByPk(id);
    if (!software) {
      return res.status(404).json({ message: "Software tidak ditemukan" });
    }

    await software.update({
      name,
      requires_license,
      search_by_version,
      updatedAt: new Date(), // Memastikan updatedAt diperbarui
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

    const software = await Software.findByPk(id);
    if (!software) {
      return res.status(404).json({ message: "Software tidak ditemukan" });
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

    console.log("Received Filter:", { startDate, endDate });

    // Default 30 hari terakhir
    const today = new Date();
    let defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 30);

    // Gunakan objek Date untuk query
    // const finalStartDate = startDate ? new Date(startDate) : defaultStartDate;
    // const finalEndDate = endDate ? new Date(endDate) : today;

    const finalStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : defaultStartDate;
    const finalEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : today;

    console.log("finalStartDate finalEndDate:", { finalStartDate, finalEndDate });
    const totalSoftware = await Software.count({
      where: {
        // createdAt: {
        //   [Op.between]: [finalStartDate, finalEndDate],
        // },
        createdAt: {
          [db.Sequelize.Op.between]: [finalStartDate, finalEndDate],
        },
      },
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
