// models/WhatsAppSetting.js
module.exports = (sequelize, DataTypes) => {
  const WhatsAppSetting = sequelize.define('WhatsAppSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    whatsapp_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '6281284712684'
    },
    trial_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    trial_template: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}'
    },
    support_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'whatsapp_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return WhatsAppSetting;
};