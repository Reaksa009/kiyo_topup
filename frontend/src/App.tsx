import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SeoMeta } from './components/SeoMeta';

import { Home } from './pages/Home';

const GameDetail = lazy(() => import('./pages/GameDetail').then((module) => ({ default: module.GameDetail })));
const OrderTracking = lazy(() => import('./pages/OrderTracking').then((module) => ({ default: module.OrderTracking })));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile').then((module) => ({ default: module.CustomerProfile })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })));
const BlogList = lazy(() => import('./pages/BlogList').then((module) => ({ default: module.BlogList })));
const BlogDetail = lazy(() => import('./pages/BlogDetail').then((module) => ({ default: module.BlogDetail })));
const SupportFAQ = lazy(() => import('./pages/SupportFAQ').then((module) => ({ default: module.SupportFAQ })));
const BulkTopup = lazy(() => import('./pages/BulkTopup').then((module) => ({ default: module.BulkTopup })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const Promotions = lazy(() => import('./pages/Promotions').then((module) => ({ default: module.Promotions })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then((module) => ({ default: module.AdminOrders })));
const AdminGames = lazy(() => import('./pages/admin/AdminGames').then((module) => ({ default: module.AdminGames })));
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders').then((module) => ({ default: module.AdminProviders })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then((module) => ({ default: module.AdminCustomers })));
const AdminRBAC = lazy(() => import('./pages/admin/AdminRBAC').then((module) => ({ default: module.AdminRBAC })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((module) => ({ default: module.AdminSettings })));
const AdminOperations = lazy(() => import('./pages/admin/AdminOperations').then((module) => ({ default: module.AdminOperations })));
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions').then((module) => ({ default: module.AdminPromotions })));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners').then((module) => ({ default: module.AdminBanners })));
const AdminCatalogueSync = lazy(() => import('./pages/admin/AdminCatalogueSync').then((module) => ({ default: module.AdminCatalogueSync })));
const AdminPriceReviews = lazy(() => import('./pages/admin/AdminPriceReviews').then((module) => ({ default: module.AdminPriceReviews })));

const RouteLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#070a12]" role="status" aria-label="Loading page">
    <span className="h-9 w-9 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-300" />
  </div>
);

const CustomerRouteMeta = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin') || pathname === '/' || pathname.startsWith('/game/')) return null;
  const metadata = pathname.startsWith('/tracking')
    ? { title: 'Track Order | Kiyo Topup', description: 'Check your Kiyo Topup order status.' }
    : pathname.startsWith('/profile') || pathname.startsWith('/history')
      ? { title: 'Profile & Order History | Kiyo Topup', description: 'Manage your Kiyo Topup profile and order history.' }
      : pathname.startsWith('/bulk-topup')
        ? { title: 'Checkout | Kiyo Topup', description: 'Complete your secure Kiyo Topup checkout.' }
        : { title: 'Kiyo Topup', description: 'Secure game top-ups for Cambodia.' };
  return <SeoMeta {...metadata} canonicalPath={pathname} />;
};

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
        <CustomerRouteMeta />
        <Suspense fallback={<RouteLoading />}>
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
            path="/admin/operations"
            element={
              <ProtectedAdminRoute>
                <AdminOperations />
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
          <Route path="/admin/catalogue-sync" element={<ProtectedAdminRoute><AdminCatalogueSync /></ProtectedAdminRoute>} />
          <Route path="/admin/price-reviews" element={<ProtectedAdminRoute><AdminPriceReviews /></ProtectedAdminRoute>} />
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
            path="/admin/promotions"
            element={
              <ProtectedAdminRoute>
                <AdminPromotions />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/admin/banners" element={<ProtectedAdminRoute><AdminBanners /></ProtectedAdminRoute>} />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
