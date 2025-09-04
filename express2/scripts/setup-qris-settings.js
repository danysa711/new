// express/scripts/setup-qris-settings.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupQrisSettings() {
  console.log("Setting up QrisSettings...");
  
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Danysa711@@@',
      database: process.env.DB_NAME || 'db_shopee_bot'
    });

    // Check if table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'QrisSettings'"
    );

    // Create table if it doesn't exist
    if (tables.length === 0) {
      console.log("Creating QrisSettings table...");
      
      await connection.execute(`
        CREATE TABLE QrisSettings (
          id int(11) NOT NULL AUTO_INCREMENT,
          merchant_name varchar(255) NOT NULL DEFAULT 'Kinterstore',
          qris_image longtext,
          is_active tinyint(1) DEFAULT 1,
          expiry_hours int(11) DEFAULT 24,
          instructions text,
          createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    // Check if data exists
    const [data] = await connection.execute(
      "SELECT COUNT(*) as count FROM QrisSettings"
    );

    if (data[0].count === 0) {
      console.log("Inserting default QrisSettings data...");
      
      await connection.execute(`
        INSERT INTO QrisSettings 
        (merchant_name, qris_image, is_active, expiry_hours, instructions, createdAt, updatedAt) 
        VALUES 
        (
          'Kinterstore', 
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC', 
          1, 
          24, 
          'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.', 
          NOW(), 
          NOW()
        )
      `);
    } else {
      console.log("QrisSettings data already exists.");
    }

    await connection.end();
    console.log("QrisSettings setup completed successfully!");
    return true;
    
  } catch (error) {
    console.error("Error setting up QrisSettings:", error);
    return false;
  }
}

setupQrisSettings()
  .then(result => {
    if (result) {
      console.log("Setup successful!");
    } else {
      console.log("Setup failed.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });