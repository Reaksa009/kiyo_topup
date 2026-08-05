import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  ChevronRight,
  ClipboardList,
  Cpu,
  Gamepad2,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

const navItems = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { label: 'Operations Center', path: '/admin/operations', icon: Activity },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { label: 'Games & Packages', path: '/admin/games', icon: Gamepad2 },
  { label: 'Catalogue Sync', path: '/admin/catalogue-sync', icon: Activity },
  { label: 'Price Reviews', path: '/admin/price-reviews', icon: ClipboardList },
  { label: 'Provider & Logs', path: '/admin/providers', icon: Cpu },
  { label: 'Customers & Wallets', path: '/admin/customers', icon: Users },
  { label: 'RBAC Roles', path: '/admin/rbac', icon: ShieldCheck },
  { label: 'Promotions & Coupons', path: '/admin/promotions', icon: Tag },
  { label: 'Responsive Banners', path: '/admin/banners', icon: ImagePlus },
  { label: 'System Settings', path: '/admin/settings', icon: Settings }
];

interface AdminAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  href: string;
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/operations');
      setAlerts(response.data.data.alerts || []);
    } catch {
      // The page-level error state handles operational API failures. The bell
      // stays unobtrusive when the user lacks permission or is offline.
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const timer = window.setInterval(loadAlerts, 60_000);
    return () => window.clearInterval(timer);
  }, [loadAlerts]);

  useEffect(() => {
    document.body.classList.add('admin-active');
    return () => {
      document.body.classList.remove('admin-active');
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname, location.search]);

  const isActive = (path: string) => path === '/admin'
    ? location.pathname === path
    : location.pathname.startsWith(path);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-800 p-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 font-black text-white glow-purple"><ShieldCheck className="h-6 w-6" /></div>
            <div><span className="text-sm font-black tracking-wider text-white">ADMIN CONTROL</span><span className="block text-[10px] font-semibold uppercase text-purple-400">KIYO TOPUP</span></div>
          </div>
          {mobile && <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white" aria-label="Close admin menu"><X className="h-5 w-5" /></button>}
        </div>
        <nav className="space-y-1.5 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex items-center space-x-3 rounded-xl border px-4 py-3 text-xs font-bold transition-all ${active ? 'border-purple-500/40 bg-purple-600/20 text-purple-300 glow-purple' : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <Icon className="h-4 w-4" /><span>{item.label}</span>
                {item.path === '/admin/operations' && alerts.length > 0 && <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">{alerts.length}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="space-y-3 border-t border-gray-800 p-4">
        <button onClick={() => navigate('/')} className="flex w-full items-center space-x-2 rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /><span>Return to Storefront</span></button>
        <div className="flex items-center justify-between pt-2">
          <div className="min-w-0"><p className="truncate text-xs font-bold leading-tight text-white">{admin?.name || 'Administrator'}</p><p className="text-[10px] font-semibold text-purple-400">{admin?.roleName || 'Super Admin'}</p></div>
          <button onClick={() => { logout(); navigate('/admin/login'); }} className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400" title="Logout"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </>
  );

  const currentTitle = navItems.find((item) => isActive(item.path))?.label || 'Admin Panel';

  return (
    <div className="flex min-h-screen bg-[#05070C] text-gray-100">
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-gray-800/80 bg-[#080B11] md:flex"><SidebarContent /></aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close admin menu overlay" />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-gray-800 bg-[#080B11] shadow-2xl"><SidebarContent mobile /></aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-800 bg-[#080B11]/90 px-4 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-gray-800 bg-gray-900 p-2 text-gray-300 md:hidden" aria-label="Open admin menu"><Menu className="h-5 w-5" /></button>
            <h2 className="truncate text-sm font-black uppercase tracking-wider text-white sm:text-lg">{currentTitle}</h2>
          </div>
          <div className="relative">
            <button onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-xl border border-gray-800 bg-gray-900 p-2.5 text-gray-400 hover:text-white" aria-label={`${alerts.length} operations alerts`}>
              <Bell className="h-4 w-4" />
              {alerts.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-[#080B11]">{alerts.length > 9 ? '9+' : alerts.length}</span>}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-[min(90vw,380px)] overflow-hidden rounded-2xl border border-gray-700 bg-[#0b0f18] shadow-2xl shadow-black/60">
                <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3"><div><p className="text-sm font-black text-white">Operations alerts</p><p className="text-[10px] text-gray-500">Live platform checks</p></div><button onClick={loadAlerts} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300">Refresh</button></div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {alerts.length === 0 ? <div className="p-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-emerald-400" /><p className="mt-2 text-xs font-bold text-white">No active alerts</p></div> : alerts.slice(0, 6).map((alert) => (
                    <Link key={alert.id} to={alert.href} className="flex items-start gap-3 rounded-xl p-3 hover:bg-gray-800/70"><AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`} /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white">{alert.title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-gray-500">{alert.message}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-gray-700" /></Link>
                  ))}
                </div>
                <Link to="/admin/operations" className="block border-t border-gray-800 px-4 py-3 text-center text-xs font-bold text-purple-300 hover:bg-purple-500/10">Open Operations Center</Link>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
};
