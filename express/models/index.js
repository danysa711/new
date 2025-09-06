// express/models/index.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { Sequelize } = require("sequelize");

// Define User Model
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
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    backend_url: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    timestamps: true,
  }
);

// Define Subscription Model
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
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "SubscriptionPlans",
        key: "id",
      }
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
      type: DataTypes.ENUM("active", "pending", "expired", "canceled"),
      defaultValue: "pending",
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
    tripay_merchant_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    timestamps: true,
  }
);

// Define SubscriptionPlan Model
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

// Define Software Model
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

// Define SoftwareVersion Model
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

// Define License Model
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

// Define Order Model
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

// Define OrderLicense Model
const OrderLicense = sequelize.define(
  "OrderLicense",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Order, key: "id" } },
    license_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: License, key: "id" } },
  },
  { timestamps: true }
);

// Define Settings Model
const Settings = sequelize.define(
  "Settings",
  {
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "settings",
  }
);

// Define WhatsAppTrialSettings Model
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

// Define PaymentSettings Model
const PaymentSettings = sequelize.define(
  "PaymentSettings",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payment_expiry_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24, // Default 24 jam
    },
    qris_image: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
    qris_image_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    verification_message_template: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: `*VERIFIKASI PEMBAYARAN BARU KE GRUP*
    
Nama: {username}
Email: {email}
ID Transaksi: {transaction_id}
Paket: {plan_name}
Durasi: {duration} hari
Nominal: Rp {price}
Waktu: {datetime}

Balas pesan ini dengan angka:
*1* untuk *VERIFIKASI*
*2* untuk *TOLAK*`,
    },
    whatsapp_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    max_pending_orders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3, // Batasi 3 pesanan menunggu
    }
  },
  {
    timestamps: true,
    tableName: "payment_settings",
  }
);

// Set up database object
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
  Settings,
  PaymentSettings
};

// Define associations
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

Subscription.belongsTo(SubscriptionPlan, { foreignKey: "plan_id" });
SubscriptionPlan.hasMany(Subscription, { foreignKey: "plan_id" });

// User associations
User.hasMany(Software, { foreignKey: "user_id" });
Software.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(SoftwareVersion, { foreignKey: "user_id" });
SoftwareVersion.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(License, { foreignKey: "user_id" });
License.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Order, { foreignKey: "user_id" });
Order.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  User,
  Software,
  SoftwareVersion,
  License,
  Order,
  OrderLicense,
  Subscription,
  SubscriptionPlan,
  WhatsAppTrialSettings,
  Settings,
  PaymentSettings,
  db
};