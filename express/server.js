// File: express/server.js

const express = require("express");
const cors = require("cors");
const { db } = require("./models");
const { authenticateUser, requireAdmin } = require("./middlewares/auth");
const userDataFilter = require("./middlewares/userDataFilter"); // Import middleware baru

const licenseRoutes = require("./routes/licenseRoutes");
const softwareRoutes = require("./routes/softwareRoutes");
const softwareVersionRoutes = require("./routes/softwareVersionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const tripayRoutes = require("./routes/tripayRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");

const app = express();
const PORT = process.env.PORT || 3500;

// Definisikan corsOptions dengan semua domain yang diizinkan
const corsOptions = {
  origin: [
    "*", // Izinkan semua origins
    "https://kinterstore.my.id",       // Tambahkan domain tanpa www
    "https://www.kinterstore.my.id", 
    "https://db.kinterstore.my.id",
    "http://localhost:3000",           // Untuk development
    "http://localhost:5173",           // Untuk Vite
    "http://localhost:5174"            // Untuk alternatif port Vite
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Gunakan CORS di seluruh aplikasi
app.use(cors(corsOptions));

// Tambahkan middleware khusus untuk preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tambahkan middleware untuk menangani CORS secara manual jika perlu
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Jika origin ada dalam daftar yang diizinkan
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request origin:', req.headers.origin);
  next();
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// Public routes - tidak memerlukan autentikasi
app.use("/api", authRoutes); // Login, register, dll
app.use("/api/public", publicApiRoutes);

// Routes yang memerlukan autentikasi
// Tambahkan userDataFilter middleware setelah authenticateUser untuk semua route yang perlu filtering
app.use("/api", authenticateUser);

// /api/orders/find adalah pengecualian khusus yang tidak perlu filtering user_id
app.post("/api/orders/find", (req, res, next) => {
  // Lanjutkan tanpa userDataFilter untuk endpoint ini
  orderRoutes.findOrder(req, res, next);
});

// Rute-rute yang memerlukan filtering berdasarkan user_id
const routesNeedFiltering = [
  { path: "/api/licenses", router: licenseRoutes },
  { path: "/api/software", router: softwareRoutes },
  { path: "/api/software-versions", router: softwareVersionRoutes },
  { path: "/api/orders", router: orderRoutes },
  { path: "/api/subscriptions", router: subscriptionRoutes },
];

// Terapkan middleware userDataFilter untuk rute-rute yang membutuhkan filtering
routesNeedFiltering.forEach(route => {
  app.use(route.path, userDataFilter, route.router);
});

// Rute admin yang tidak memerlukan filtering user_id
app.use("/api/users", requireAdmin, userRoutes);
app.use("/api/tripay", tripayRoutes);

// Start server
app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Gagal menyambungkan database:", error);
  }
});