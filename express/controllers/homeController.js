// File: controllers/homeController.js

/**
 * Controller untuk halaman utama API Server
 */
const { db } = require('../models');

// Menampilkan halaman utama dengan informasi status server
const getHomePage = (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Kinterstore API Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          .status { padding: 10px; background: #e7f7e7; border-left: 4px solid #28a745; margin: 20px 0; }
          .endpoints { background: #f8f9fa; padding: 20px; border-radius: 5px; }
          .endpoint { margin-bottom: 10px; }
          .url { font-family: monospace; background: #f1f1f1; padding: 2px 5px; }
          .method { font-size: 0.85em; color: #fff; padding: 2px 6px; border-radius: 3px; margin-left: 5px; }
          .get { background-color: #28a745; }
          .post { background-color: #007bff; }
          .debug { margin-top: 30px; color: #6c757d; font-size: 0.9em; }
          .debug code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>Kinterstore API Server</h1>
        <div class="status">
          <strong>Status:</strong> Running
          <br>
          <strong>Server Time:</strong> ${new Date().toISOString()}
          <br>
          <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}
        </div>

        <div>
          <p>
            <strong>Database Status:</strong> 
            <span id="dbStatus">Checking...</span>
          </p>
          <script>
            // Script sederhana untuk memeriksa koneksi database
            fetch('/api/test')
              .then(response => response.json())
              .then(data => {
                document.getElementById('dbStatus').innerHTML = 'Connected';
                document.getElementById('dbStatus').style.color = '#28a745';
              })
              .catch(error => {
                document.getElementById('dbStatus').innerHTML = 'Error connecting';
                document.getElementById('dbStatus').style.color = '#dc3545';
              });
          </script>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Kinterstore API Server - &copy; ${new Date().getFullYear()}</p>
          <p><small>Gunakan endpoint ini melalui aplikasi frontend atau API client.</small></p>
        </div>
      </body>
    </html>
  `);
};

// Endpoint API sederhana untuk memeriksa status database
const testDbConnection = async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ status: 'success', message: 'Database connected' });
  } catch (error) {
    console.error('Error saat memeriksa koneksi database:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
};

module.exports = {
  getHomePage,
  testDbConnection
};