// express/server.js
const express = require("express");
const cors = require("cors");
const { db } = require("./models");

const licenseRoutes = require("./routes/licenseRoutes");
const softwareRoutes = require("./routes/softwareRoutes");
const softwareVersionRoutes = require("./routes/softwareVersionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const tripayRoutes = require("./routes/tripayRoutes");

const app = express();
const PORT = process.env.PORT || 5002;

const allowedOrigins = ["https://kinterstore.my.id", "http://172.30.174.75:5200", "http://192.168.0.24:5200", "https://www.kinterstore.my.id"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Register routes
app.use("/api", licenseRoutes);
app.use("/api", softwareRoutes);
app.use("/api", softwareVersionRoutes);
app.use("/api", orderRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api", paymentRoutes);
app.use("/api", tripayRoutes);

// Middleware to handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, async () => {
  try {
    await db.sequelize.sync();
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Gagal menyambungkan database:", error);
  }
});