// File: src/app.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ConnectionProvider } from "./context/ConnectionContext"; 
import MainLayout from "./components/layouts/MainLayout";
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import ProtectedRoute from "./components/layouts/ProtectedRoute";
import ConnectionSettings from "./pages/ConnectionSettings"; // Uncomment this line
import { useContext } from "react";

// Home redirect component
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
      <ConnectionProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Add connection settings route */}
            <Route path="/connection-settings" element={<ConnectionSettings />} />
            
            {/* Root route redirects based on user role */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* User routes */}
            <Route path="/user/page/:slug/*" element={<UserLayout />} />
            
            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminLayout />} />
            
            {/* Legacy Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/legacy/*" element={<MainLayout />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ConnectionProvider>
    </AuthProvider>
  );
};

export default App;