module.exports = (sequelize, DataTypes) => {
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

  return PaymentSettings;
};