import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { Users, Wallet, Plus, Minus } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5.0);

  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get('/customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdjustBalance = async (action: 'add' | 'subtract') => {
    if (!selectedCust?._id) return;
    try {
      await apiClient.put(`/customers/${selectedCust._id}/balance`, {
        amount: adjustAmount,
        action
      });
      alert(`Customer balance ${action === 'add' ? 'increased' : 'decreased'} by $${adjustAmount}`);
      fetchCustomers();
      setSelectedCust(null);
    } catch (err: any) {
      alert('Error updating balance');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Registered Customer Accounts</h2>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 bg-[#0B0F19]">
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Referral Code</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-800/40">
                    <td className="py-3.5 px-4 font-bold text-white">{c.name}</td>
                    <td className="py-3.5 px-4 text-gray-300">{c.email}</td>
                    <td className="py-3.5 px-4 font-bold text-cyan-400">${c.walletBalance.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-purple-400">{c.referralCode}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCust(c)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold rounded-lg"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adjust Balance Modal */}
        {selectedCust && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md p-6 glass-panel rounded-3xl border border-cyan-500/30 space-y-4">
              <h3 className="text-lg font-black text-white">Adjust Wallet: {selectedCust.name}</h3>
              <p className="text-xs text-gray-400">Current Balance: <strong className="text-cyan-400">${selectedCust.walletBalance.toFixed(2)}</strong></p>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300">Amount (USD)</label>
                <input
                  type="number"
                  step="0.1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => handleAdjustBalance('add')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Balance</span>
                </button>
                <button
                  onClick={() => handleAdjustBalance('subtract')}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                >
                  <Minus className="w-4 h-4" />
                  <span>Deduct Balance</span>
                </button>
              </div>
              <button onClick={() => setSelectedCust(null)} className="w-full text-center text-xs text-gray-400 pt-2">
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
