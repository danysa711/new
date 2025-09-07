// File: src/app.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ConnectionProvider } from "./context/ConnectionContext"; // Import ConnectionProvider
import MainLayout from "./components/layouts/MainLayout";
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import ProtectedRoute from "./components/layouts/ProtectedRoute";
import ConnectionSettings from "./pages/ConnectionSettings"; // Halaman untuk pengaturan koneksi
import { useContext, useEffect } from "react";
import OrderSearch from './components/OrderSearch';
import React from "react";
import { detectDomainAndGenerateBackendUrl } from "./utils/domainUtils";

// Komponen pengalihan beranda
const HomeRedirect = () => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" />;
  }
  
  return <Navigate to={`/user/page/${user.url_slug}`} />;
};

const App = () => {
  // Efek untuk mendeteksi domain dan memperbarui URL backend
  useEffect(() => {
    // Mendapatkan URL backend berdasarkan domain saat ini
    const domainBasedBackendUrl = detectDomainAndGenerateBackendUrl();
    
    // Mendapatkan URL backend yang tersimpan
    const savedBackendUrl = localStorage.getItem('backendUrl');
    
    // Jika URL backend belum diatur atau berbeda dengan domain saat ini
    if (!savedBackendUrl) {
      console.log('Mengatur URL backend berdasarkan domain:', domainBasedBackendUrl);
      localStorage.setItem('backendUrl', domainBasedBackendUrl);
    } else {
      // Bandingkan domain URL yang tersimpan dengan domain saat ini
      const savedDomain = new URL(savedBackendUrl).hostname;
      const currentDomain = window.location.hostname;
      
      // Jika domain berubah, perbarui URL backend
      if (savedDomain.includes('kinterstore.my.id') && currentDomain.includes('kinterstore.com')) {
        console.log('Domain berubah dari my.id ke com, memperbarui URL backend');
        localStorage.setItem('backendUrl', domainBasedBackendUrl);
      } 
      else if (savedDomain.includes('kinterstore.com') && currentDomain.includes('kinterstore.my.id')) {
        console.log('Domain berubah dari com ke my.id, memperbarui URL backend');
        localStorage.setItem('backendUrl', domainBasedBackendUrl);
      }
    }
    
    // Periksa juga user data jika ada backend_url
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        // Jika backend_url dalam user data berbeda dengan domain saat ini, perbarui
        if (userData.backend_url) {
          const userDomain = new URL(userData.backend_url).hostname;
          const currentDomain = window.location.hostname;
          
          // Jika domain berubah, tandai untuk diperbarui pada login berikutnya
          if ((userDomain.includes('kinterstore.my.id') && currentDomain.includes('kinterstore.com')) ||
              (userDomain.includes('kinterstore.com') && currentDomain.includes('kinterstore.my.id'))) {
            console.log('Domain user berbeda dengan domain saat ini, menandai untuk pembaruan');
            localStorage.setItem('domain_changed', 'true');
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Lakukan hal yang sama untuk sessionStorage
    const sessionUserStr = sessionStorage.getItem('user');
    if (sessionUserStr) {
      try {
        const userData = JSON.parse(sessionUserStr);
        if (userData.backend_url) {
          const userDomain = new URL(userData.backend_url).hostname;
          const currentDomain = window.location.hostname;
          
          if ((userDomain.includes('kinterstore.my.id') && currentDomain.includes('kinterstore.com')) ||
              (userDomain.includes('kinterstore.com') && currentDomain.includes('kinterstore.my.id'))) {
            sessionStorage.setItem('domain_changed', 'true');
          }
        }
      } catch (e) {
        console.error('Error parsing user data from sessionStorage:', e);
      }
    }
  }, []);

  return (
    <AuthProvider>
      <ConnectionProvider> {/* Tambahkan ConnectionProvider */}
        <Router>
          <Routes>
            {/* Rute publik */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/connection-settings" element={<ConnectionSettings />} /> {/* Rute untuk pengaturan koneksi */}
            
            {/* Rute akar mengarahkan berdasarkan peran pengguna */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Rute pengguna */}
            <Route path="/user/page/:slug/*" element={<UserLayout />} />
            
            {/* Rute admin */}
            <Route path="/admin/*" element={<AdminLayout />} />
            
            {/* Rute yang Dilindungi Lama */}
            <Route element={<ProtectedRoute />}>
              <Route path="/legacy/*" element={<MainLayout />} />
            </Route>
            
            {/* Rute penangkap semua */}
            <Route path="*" element={<Navigate to="/" replace />} />

            <Route path="/user/page/:slug/orders/search" element={<OrderSearch />} />
          </Routes>
        </Router>
      </ConnectionProvider>
    </AuthProvider>
  );
};

export default App;