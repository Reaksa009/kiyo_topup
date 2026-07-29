import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Gamepad2,
  Cpu,
  Users,
  ShieldCheck,
  Tag,
  Settings,
  LogOut,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Games & Packages', path: '/admin/games', icon: Gamepad2 },
    { label: 'Provider & Logs', path: '/admin/providers', icon: Cpu },
    { label: 'Customers & Wallets', path: '/admin/customers', icon: Users },
    { label: 'RBAC Roles', path: '/admin/rbac', icon: ShieldCheck },
    { label: 'Promotions & Coupons', path: '/admin/promotions', icon: Tag },
    { label: 'System Settings', path: '/admin/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#05070C] text-gray-100 flex">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800/80 bg-[#080B11] flex flex-col justify-between hidden md:flex">
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-gray-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black glow-purple">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-white">ADMIN CONTROL</span>
              <span className="block text-[10px] font-semibold text-purple-400 uppercase">KIYO TOPUP</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 glow-purple'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Exit */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-gray-900 border border-gray-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-white leading-tight">{admin?.name || 'Administrator'}</p>
              <p className="text-[10px] text-purple-400 font-semibold">{admin?.roleName || 'Super Admin'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-800 bg-[#080B11]/80 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Admin Panel'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-white rounded-xl bg-gray-900 border border-gray-800">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            </button>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
