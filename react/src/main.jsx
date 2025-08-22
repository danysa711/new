// File: src/main.jsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "antd/dist/reset.css";
import App from './app.jsx';

// Menambahkan fungsi global untuk memperbarui status langganan
window.updateUserSubscriptionStatus = (hasActiveSubscription) => {
  // Fungsi ini akan diisi oleh AuthContext
  console.log('Status langganan diperbarui:', hasActiveSubscription);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)