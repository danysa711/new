const { Sequelize } = require("sequelize");
const config = require("./config.js");

// Tambahkan penanganan error jika config.development tidak ada
const dbConfig = config.development || {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Danysa711@@@',
  database: process.env.DB_NAME || 'db_shopee_bot',
  host: process.env.DB_HOST || '127.0.0.1',
  dialect: "mysql",
};

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  pool: {
    max: 50, // Tingkatkan jumlah maksimum koneksi
    min: 10, // Tingkatkan jumlah minimum koneksi
    acquire: 60000, // Waktu tunggu maksimum sebelum request gagal (dinaikkan)
    idle: 20000, // Waktu idle lebih lama sebelum koneksi ditutup
  },
  dialectOptions: {
    connectTimeout: 90000, // Perpanjang timeout koneksi ke database
  },
  logging: false,
});

module.exports = sequelize;