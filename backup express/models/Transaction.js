// models/Transaction.js
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    merchant_ref: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payment_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payment_type: {
      type: DataTypes.ENUM('tripay', 'manual'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('UNPAID', 'PAID', 'EXPIRED', 'FAILED'),
      allowNull: false,
      defaultValue: 'UNPAID'
    },
    payment_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    account_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    qr_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customer_phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    plan_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  Transaction.associate = function(models) {
    Transaction.belongsTo(models.User, { foreignKey: 'user_id' });
    if (models.Subscription) {
      Transaction.belongsTo(models.Subscription, { foreignKey: 'subscription_id' });
    }
    if (models.SubscriptionPlan) {
      Transaction.belongsTo(models.SubscriptionPlan, { foreignKey: 'plan_id' });
    }
  };

  return Transaction;
};