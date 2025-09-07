// utils/helpers.js
// Generate random string untuk order number
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Tambahkan ke exports
module.exports = { 
  generateRandomString
  // ... other helpers
};