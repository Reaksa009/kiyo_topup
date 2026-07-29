import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Wallet, History, UserCheck, Share2, Copy, Check, ShieldCheck, Gamepad2 } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get('/orders/my-orders');
        setOrders(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const copyReferral = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(`https://kiyotopup.com/register?ref=${user.referralCode}`);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-10 space-y-8">
        
        {/* Profile Card Header */}
        <div className="glass-panel p-8 rounded-3xl border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-1 glow-cyan">
              <div className="w-full h-full bg-[#0B0F19] rounded-xl flex items-center justify-center font-black text-2xl text-cyan-400">
                {user?.name?.substring(0, 2).toUpperCase() || 'CU'}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full mt-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Customer</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-2xl bg-[#111625] border border-gray-800 text-center min-w-[140px]">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Wallet Balance</span>
              <p className="text-2xl font-black text-cyan-400">${user?.walletBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Saved Player Accounts & Referral Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Saved Player IDs */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Saved Game Accounts</h3>
            </div>
            {user?.savedPlayerIds && user.savedPlayerIds.length > 0 ? (
              <div className="space-y-2">
                {user.savedPlayerIds.map((acc: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#111625] border border-gray-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{acc.label || acc.gameSlug}</p>
                      <p className="text-gray-400 font-mono">ID: {acc.playerId} {acc.zoneId ? `(${acc.zoneId})` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No saved game accounts yet. Accounts will be saved automatically when you complete a top-up.</p>
            )}
          </div>

          {/* Referral & Affiliate Link */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
              <Share2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Referral & Affiliate Link</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Share your unique referral link to earn top-up commissions and extra bonus vouchers.
            </p>
            <div className="flex space-x-2 pt-2">
              <input
                type="text"
                readOnly
                value={`https://kiyotopup.com/register?ref=${user?.referralCode || 'KIYO'}`}
                className="flex-1 bg-[#111625] border border-gray-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono"
              />
              <button
                onClick={copyReferral}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Order History */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-black text-white">Order History</h3>
            </div>
            <span className="text-xs font-bold text-gray-400">{orders.length} Total Orders</span>
          </div>

          {loading ? (
            <p className="text-xs text-gray-400 py-4">Loading order history...</p>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Game & Package</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{ord.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{ord.gameTitle}</p>
                        <p className="text-[10px] text-gray-400">{ord.packageTitle}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">${ord.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4">{ord.paymentMethod}</td>
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
          ) : (
            <p className="text-xs text-gray-400 py-6 text-center">No orders found in your account history yet.</p>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
};
