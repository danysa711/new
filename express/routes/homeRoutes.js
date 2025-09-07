// File: routes/homeRoutes.js

const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Route untuk halaman utama
router.get('/', homeController.getHomePage);

// Route untuk API test koneksi database
router.get('/api/test', homeController.testDbConnection);

module.exports = router;