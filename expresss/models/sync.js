const sequelize = require("../config/database.js");

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database & tables synced successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
