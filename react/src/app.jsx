// File: react/src/app.jsx

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
import { useContext } from "react";
import OrderSearch from './components/OrderSearch';

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