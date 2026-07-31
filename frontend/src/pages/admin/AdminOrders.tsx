import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { Search, RefreshCw } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [paymentFilter, setPaymentFilter] = useState(() => searchParams.get('paymentStatus') || 'all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/orders', {
        params: {
          search,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined
        }
      });
      setOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchOrders, 350);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter, paymentFilter]);

  const handleRetry = async (orderId: string) => {
    if (!window.confirm('Re-send this verified paid order to G2Bulk? Check the provider first to avoid a duplicate top-up.')) return;
    try {
      await apiClient.post(`/orders/${orderId}/retry`);
      setMessage('Order safely re-queued for provider fulfillment.');
      setError('');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error retrying order');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Order Number, Game, Customer Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111625] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#111625] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-[#111625] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">All Payments</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Payment Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button onClick={fetchOrders} className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 bg-[#0B0F19]">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Game & Package</th>
                  <th className="py-3.5 px-4">Player Info</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Gateway</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-gray-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{ord.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{ord.gameTitle}</p>
                      <p className="text-[10px] text-gray-400">{ord.packageTitle}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {JSON.stringify(ord.playerFields)}
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
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold rounded-lg"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-lg p-6 glass-panel rounded-3xl border border-cyan-500/30 space-y-4">
              <h3 className="text-xl font-black text-white">Order #{selectedOrder.orderNumber}</h3>
              <div className="space-y-2 text-xs text-gray-300 bg-[#111625] p-4 rounded-2xl border border-gray-800">
                <p><strong className="text-white">Game:</strong> {selectedOrder.gameTitle}</p>
                <p><strong className="text-white">Package:</strong> {selectedOrder.packageTitle}</p>
                <p><strong className="text-white">Selling Price:</strong> ${selectedOrder.amount.toFixed(2)}</p>
                <p><strong className="text-white">Provider Cost:</strong> ${selectedOrder.costPrice.toFixed(2)}</p>
                <p><strong className="text-white">Profit:</strong> ${selectedOrder.profit.toFixed(2)}</p>
                <p><strong className="text-white">Failure Reason:</strong> {selectedOrder.failureReason || 'N/A'}</p>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleRetry(selectedOrder._id)}
                  disabled={selectedOrder.paymentStatus !== 'paid' || selectedOrder.overallStatus === 'completed'}
                  title={selectedOrder.paymentStatus !== 'paid' ? 'Payment must be verified as paid before retrying.' : ''}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Re-send Paid Order to Provider
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
