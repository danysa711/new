// react/src/app.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { AdminProvider } from "./context/AdminContext";
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import ProtectedRoute from "./components/layouts/ProtectedRoute";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContext";

const AppContent = () => {
  const { user, token, loading } = useContext(AuthContext);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedRoute />}>
        {user?.role === "admin" ? (
          <Route path="/*" element={<AdminLayout />} />
        ) : (
          <Route path="/*" element={<UserLayout />} />
        )}
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AdminProvider>
          <Router>
            <AppContent />
          </Router>
        </AdminProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

export default App;