// debug.js - Jalankan dengan: node debug.js
// Script untuk mengidentifikasi masalah database dan konfigurasi

const path = require('path');
require('dotenv').config();

async function runDebug() {
  console.log("=== DEBUGGING SUBSCRIPTION SYSTEM ===\n");
  
  try {
    // 1. Check environment variables
    console.log("1. ENVIRONMENT VARIABLES:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("TRIPAY_API_KEY exists:", !!process.env.TRIPAY_API_KEY);
    console.log("TRIPAY_PRIVATE_KEY exists:", !!process.env.TRIPAY_PRIVATE_KEY);
    console.log("TRIPAY_MERCHANT_CODE exists:", !!process.env.TRIPAY_MERCHANT_CODE);
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log();
    
    // 2. Test database connection
    console.log("2. DATABASE CONNECTION:");
    try {
      const { db } = require('./models');
      await db.sequelize.authenticate();
      console.log("Database connection: SUCCESS");
      
      // Check table structures
      const [subscriptionCols] = await db.sequelize.query("DESCRIBE subscriptions");
      const [userCols] = await db.sequelize.query("DESCRIBE Users");
      
      console.log("Subscriptions table columns:", subscriptionCols.map(col => col.Field));
      console.log("Users table columns:", userCols.map(col => col.Field));
      
      // Check if transactions table exists
      try {
        const [transactionCols] = await db.sequelize.query("DESCRIBE transactions");
        console.log("Transactions table columns:", transactionCols.map(col => col.Field));
      } catch (e) {
        console.log("Transactions table: DOES NOT EXIST");
      }
      
    } catch (dbError) {
      console.log("Database connection: FAILED");
      console.log("Error:", dbError.message);
    }
    console.log();
    
    // 3. Test model loading
    console.log("3. MODEL LOADING:");
    try {
      const { User, Subscription, SubscriptionPlan, Transaction } = require('./models');
      console.log("User model:", !!User);
      console.log("Subscription model:", !!Subscription);
      console.log("SubscriptionPlan model:", !!SubscriptionPlan);
      console.log("Transaction model:", !!Transaction);
      
      // Test associations
      if (Subscription && Subscription.associations) {
        console.log("Subscription associations:", Object.keys(Subscription.associations));
      }
    } catch (modelError) {
      console.log("Model loading: FAILED");
      console.log("Error:", modelError.message);
    }
    console.log();
    
    // 4. Test basic queries
    console.log("4. BASIC QUERIES:");
    try {
      const { User, Subscription, SubscriptionPlan } = require('./models');
      
      const userCount = await User.count();
      const subscriptionCount = await Subscription.count();
      const planCount = await SubscriptionPlan.count();
      
      console.log("Total users:", userCount);
      console.log("Total subscriptions:", subscriptionCount);
      console.log("Total plans:", planCount);
      
      // Test getUserSubscriptions logic
      if (userCount > 0) {
        const firstUser = await User.findOne();
        console.log("Testing with user ID:", firstUser.id);
        
        const userSubs = await Subscription.findAll({
          where: { user_id: firstUser.id }
        });
        console.log("User subscriptions:", userSubs.length);
      }
      
    } catch (queryError) {
      console.log("Basic queries: FAILED");
      console.log("Error:", queryError.message);
    }
    console.log();
    
    // 5. Test Tripay configuration
    console.log("5. TRIPAY CONFIGURATION:");
    try {
      const axios = require('axios');
      const crypto = require('crypto');
      
      const apiKey = process.env.TRIPAY_API_KEY;
      const proxyUrl = process.env.TRIPAY_PROXY_URL || "https://callback.kinterstore.com/api/tripay-proxy";
      
      if (apiKey) {
        console.log("Testing Tripay connection...");
        
        const testAxios = axios.create({
          baseURL: proxyUrl,
          timeout: 10000,
          headers: {
            'X-Tripay-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        });
        
        const response = await testAxios.get('/merchant/payment-channel');
        console.log("Tripay API: SUCCESS");
        console.log("Available channels:", response.data.data.length);
      } else {
        console.log("Tripay API: NO API KEY");
      }
    } catch (tripayError) {
      console.log("Tripay API: FAILED");
      console.log("Error:", tripayError.message);
    }
    console.log();
    
    console.log("=== DEBUG COMPLETED ===");
    
  } catch (error) {
    console.log("FATAL ERROR:", error.message);
    console.log(error.stack);
  }
  
  process.exit(0);
}

runDebug();