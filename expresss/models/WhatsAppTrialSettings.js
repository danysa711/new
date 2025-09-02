// File: express/models/WhatsAppTrialSettings.js

module.exports = (sequelize, DataTypes) => {
  const WhatsAppTrialSettings = sequelize.define("WhatsAppTrialSettings", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '6281284712684'
    },
    messageTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'whatsapp_trial_settings',
    timestamps: true
  });

  return WhatsAppTrialSettings;
};