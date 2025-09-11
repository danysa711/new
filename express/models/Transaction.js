module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
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
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payment_name: {
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'UNPAID'
    },
    payment_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    qr_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    raw: {
      type: DataTypes.JSON,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'transactions', // PENTING: Lowercase sesuai database
    timestamps: false, // Karena menggunakan custom timestamps
    underscored: false
  });

  Transaction.associate = function(models) {
    Transaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    Transaction.belongsTo(models.SubscriptionPlan, {
      foreignKey: 'plan_id',
      as: 'plan'
    });
    
    // Association ke Subscription (one-to-one)
    Transaction.hasOne(models.Subscription, {
      foreignKey: 'transaction_id',
      as: 'subscription'
    });
  };

  return Transaction;
};