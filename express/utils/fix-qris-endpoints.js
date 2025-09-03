// express/utils/fix-qris-endpoints.js
const { QrisSettings, QrisPayment, SubscriptionPlan } = require("../models");

const ensureQrisTables = async () => {
  try {
    // Coba akses tabel untuk memastikan sudah ada
    await QrisSettings.findOne();
    await QrisPayment.findOne();
    
    console.log("✅ Tabel QRIS sudah tersedia");
    return true;
  } catch (error) {
    console.error("❌ Error saat mengakses tabel QRIS:", error);
    
    // Coba buat QrisSettings default jika belum ada
    try {
      await QrisSettings.create({
        merchant_name: "Kinterstore",
        qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
        is_active: true,
        expiry_hours: 24,
        instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
      });
      
      console.log("✅ QrisSettings default berhasil dibuat");
    } catch (error) {
      console.error("❌ Gagal membuat QrisSettings default:", error);
    }
    
    return false;
  }
};

module.exports = { ensureQrisTables };