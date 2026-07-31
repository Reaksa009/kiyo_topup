import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, DollarSign, ShoppingBag, Users } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [metricsRes, reportRes] = await Promise.all([
          apiClient.get('/admin/metrics'),
          apiClient.get('/reports/revenue')
        ]);
        setMetrics(metricsRes.data.data.metrics);
        setRecentOrders(metricsRes.data.data.recentOrders || []);
        setRevenueChart(reportRes.data.data.chartData || []);
      } catch (err) {
        console.error(err);
        setError('Dashboard metrics could not be loaded. Open Operations Center for live diagnostics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-xs text-gray-400">Loading admin metrics...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-black text-white">Business overview</h1><p className="mt-1 text-sm text-gray-500">Revenue, customers, and the latest top-up activity.</p></div>
          <Link to="/admin/operations" className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-black text-purple-300 hover:bg-purple-500/20"><Activity className="h-4 w-4" /> Operations Center</Link>
        </div>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-panel p-6 rounded-3xl space-y-2 border border-purple-500/20">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Total Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">${metrics?.totalRevenue?.toFixed(2) || '0.00'}</p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center">
              <span>+Est. Profit: ${metrics?.totalProfit?.toFixed(2) || '0.00'}</span>
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-2 border border-cyan-500/20">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Today's Orders</span>
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white">{metrics?.todayOrders || 0}</p>
            <p className="text-[11px] text-cyan-400 font-semibold">Today's Revenue: ${metrics?.todayRevenue?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-2 border border-pink-500/20">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Registered Customers</span>
              <Users className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-3xl font-black text-white">{metrics?.totalUsers || 0}</p>
            <p className="text-[11px] text-gray-400 font-semibold">Total Orders: {metrics?.totalOrders || 0}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-2 border border-gold/20">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>G2Bulk API Balance</span>
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
            <p className={`text-3xl font-black ${metrics?.providerOnline ? 'text-amber-400' : 'text-red-400'}`}>{metrics?.providerBalance == null ? 'Unavailable' : `$${metrics.providerBalance.toFixed(2)}`}</p>
            <p className={`text-[11px] font-semibold ${metrics?.providerOnline ? 'text-emerald-400' : 'text-red-400'}`}>Automated Provider Status: {metrics?.providerOnline ? 'Online' : 'Unavailable'}</p>
          </div>

        </div>

        {/* Revenue Analytics Recharts Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Revenue & Profit Analytics</h3>
            <span className="text-xs text-gray-400">Past 30 Days</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232E48" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111625', borderColor: '#232E48', color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#00F0FF" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                <Area type="monotone" dataKey="profit" stroke="#8A2BE2" fillOpacity={1} fill="url(#colorProfit)" name="Profit ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Transactions Feed */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 border border-gray-800">
          <h3 className="text-base font-bold text-white">Recent Top-Up Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Game & Package</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Est. Profit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-gray-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{ord.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{ord.gameTitle}</p>
                      <p className="text-[10px] text-gray-400">{ord.packageTitle}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">${ord.amount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">+${ord.profit?.toFixed(2) || '0.00'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          ord.overallStatus === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ord.overallStatus === 'processing'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {ord.overallStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
