import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Customer Pages
import { Home } from './pages/Home';
import { GameDetail } from './pages/GameDetail';
import { OrderTracking } from './pages/OrderTracking';
import { CustomerProfile } from './pages/CustomerProfile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { BlogList } from './pages/BlogList';
import { BlogDetail } from './pages/BlogDetail';
import { SupportFAQ } from './pages/SupportFAQ';
import { BulkTopup } from './pages/BulkTopup';
import { Contact } from './pages/Contact';
import { Promotions } from './pages/Promotions';

// Admin Pages
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminGames } from './pages/admin/AdminGames';
import { AdminProviders } from './pages/admin/AdminProviders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminRBAC } from './pages/admin/AdminRBAC';
import { AdminSettings } from './pages/admin/AdminSettings';

const ProtectedUserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#080B11]" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#080B11]" />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/game/:slug" element={<GameDetail />} />
          <Route path="/bulk-topup" element={<BulkTopup />} />
          <Route path="/tracking" element={<OrderTracking />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/support" element={<SupportFAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedUserRoute>
                <CustomerProfile />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedUserRoute>
                <CustomerProfile />
              </ProtectedUserRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedAdminRoute>
                <AdminOrders />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/games"
            element={
              <ProtectedAdminRoute>
                <AdminGames />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/providers"
            element={
              <ProtectedAdminRoute>
                <AdminProviders />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedAdminRoute>
                <AdminCustomers />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/rbac"
            element={
              <ProtectedAdminRoute>
                <AdminRBAC />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedAdminRoute>
                <AdminSettings />
              </ProtectedAdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
