// express/utils/init-database.js
const { sequelize } = require("../config/database");
const { ensureQrisTables } = require("./fix-qris-endpoints");

const initializeDatabase = async () => {
  try {
    console.log("Initializing database...");
    
    // Authenticate database connection
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    
    // Ensure QRIS tables
    await ensureQrisTables();
    
    console.log("Database initialization completed.");
    return true;
  } catch (error) {
    console.error("Unable to initialize database:", error);
    return false;
  }
};

module.exports = { initializeDatabase };