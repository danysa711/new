// express/controllers/testController.js

const testController = {
  // Endpoint test dasar
  testConnection: (req, res) => {
    return res.json({
      status: "success",
      message: "API is working",
      timestamp: new Date().toISOString()
    });
  },
  
  // Endpoint test untuk QRIS
  testQrisSettings: (req, res) => {
    return res.json({
      merchant_name: "Kinterstore (Test Mode)",
      qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
      is_active: true,
      expiry_hours: 24,
      instructions: "Ini adalah mode pengujian. Dalam produksi, silakan gunakan kode QRIS asli."
    });
  },
  
  // Endpoint test untuk data QRIS
  testQrisPayments: (req, res) => {
    return res.json([
      {
        id: 1,
        reference: "QRIS-TEST-1",
        user_id: 1,
        plan_id: 1,
        amount: 150000,
        unique_code: 123,
        total_amount: 150123,
        status: "UNPAID",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        expired_at: new Date(Date.now() + 82800000).toISOString(),
        User: {
          username: "testuser",
          email: "test@example.com"
        },
        SubscriptionPlan: {
          name: "Basic Plan",
          duration_days: 30,
          price: 150000
        }
      }
    ]);
  }
};

module.exports = testController;