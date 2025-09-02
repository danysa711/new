require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Danysa711@@@',
    database: process.env.DB_NAME || 'db_shopee_bot',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: "mysql",
  },
};