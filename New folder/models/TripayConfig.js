// models/TripayConfig.js
module.exports = (sequelize, DataTypes) => {
  const TripayConfig = sequelize.define('TripayConfig', {
    api_key: {
      type: DataTypes.STRING,
      allowNull: true
    },
    private_key: {
      type: DataTypes.STRING,
      allowNull: true
    },
    merchant_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sandbox_mode: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true
  });

  return TripayConfig;
};