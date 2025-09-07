// Tambahkan model baru ke dalam index.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { Sequelize } = require("sequelize");
const Setting = require('./setting')(sequelize, Sequelize.DataTypes);
const WhatsAppSetting = require('./WhatsAppSetting')(sequelize, Sequelize.DataTypes);

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
      allowNull: false,
    },
    url_slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = sequelize.define(
  "Subscription",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "canceled"),
      defaultValue: "active",
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionPlan = sequelize.define(
  "SubscriptionPlan",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

const Software = sequelize.define(
  "Software",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    requires_license: { type: DataTypes.BOOLEAN, defaultValue: false },
    search_by_version: { type: DataTypes.BOOLEAN, defaultValue: false },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id"
      }
    }
  },
  { timestamps: true }
);

const SoftwareVersion = sequelize.define(
  "SoftwareVersion",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    software_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Software, key: "id" } },
    version: { type: DataTypes.STRING(50), allowNull: false },
    os: { type: DataTypes.STRING(50), allowNull: false },
    download_link: { type: DataTypes.TEXT, allowNull: false },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id"
      }
    }
  },
  { timestamps: true }
);

const License = sequelize.define(
  "License",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    software_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Software, key: "id" },
    },
    software_version_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: SoftwareVersion, key: "id" },
    },
    license_key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id"
      }
    }
  },
  { timestamps: true }
);

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    item_name: { type: DataTypes.STRING(255), allowNull: false },
    os: { type: DataTypes.STRING(50), allowNull: true },
    version: { type: DataTypes.STRING(50), allowNull: true },
    license_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: { type: DataTypes.ENUM("pending", "processed"), defaultValue: "pending" },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id"
      }
    }
  },
  { timestamps: true }
);

const OrderLicense = sequelize.define(
  "OrderLicense",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Order, key: "id" } },
    license_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: License, key: "id" } },
  },
  { timestamps: true }
);

const WhatsAppTrialSettings = sequelize.define(
  "WhatsAppTrialSettings",
  {
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
    }
  },
  {
    tableName: 'whatsapp_trial_settings',
    timestamps: true
  }
);

const db = {
  sequelize,
  Sequelize,
  User,
  Software,
  SoftwareVersion,
  License,
  Order,
  OrderLicense,
  Subscription,
  SubscriptionPlan,
  WhatsAppTrialSettings,
  Setting,
  WhatsAppSetting
};

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

Software.hasMany(SoftwareVersion, { foreignKey: "software_id" });
SoftwareVersion.belongsTo(Software, { foreignKey: "software_id" });

Software.hasMany(License, { foreignKey: "software_id" });
License.belongsTo(Software, { foreignKey: "software_id" });

Software.hasMany(Order, { foreignKey: "software_id" });
Order.belongsTo(Software, { foreignKey: "software_id" });

SoftwareVersion.hasMany(License, { foreignKey: "software_version_id" });
License.belongsTo(SoftwareVersion, { foreignKey: "software_version_id" });

Order.belongsToMany(License, { through: OrderLicense, foreignKey: "order_id" });
License.belongsToMany(Order, { through: OrderLicense, foreignKey: "license_id" });

User.hasMany(Subscription, { foreignKey: "user_id" });
Subscription.belongsTo(User, { foreignKey: "user_id" });

// Tambahkan asosiasi baru sesuai Langkah 10
User.hasMany(Software, { foreignKey: "user_id" });
Software.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(SoftwareVersion, { foreignKey: "user_id" });
SoftwareVersion.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(License, { foreignKey: "user_id" });
License.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Order, { foreignKey: "user_id" });
Order.belongsTo(User, { foreignKey: "user_id" });

module.exports = { User, Software, SoftwareVersion, License, Order, OrderLicense, Subscription, SubscriptionPlan, WhatsAppTrialSettings, Setting, WhatsAppSetting, db };