import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { Cpu, RefreshCw } from 'lucide-react';

export const AdminProviders: React.FC = () => {
  const [balance, setBalance] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerError, setProviderError] = useState('');

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      const [balanceResult, logsResult] = await Promise.allSettled([
        apiClient.get('/providers/balance/G2BULK'),
        apiClient.get('/providers/logs')
      ]);
      if (balanceResult.status === 'fulfilled') {
        setBalance(balanceResult.value.data.data);
        setProviderError('');
      } else {
        setBalance(null);
        setProviderError(balanceResult.reason?.response?.data?.message || 'G2Bulk balance is currently unavailable.');
      }
      if (logsResult.status === 'fulfilled') setLogs(logsResult.value.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {providerError && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{providerError}</div>}
        
        {/* Provider Status Header */}
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 glow-cyan">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Primary Top-Up Provider</span>
              <h2 className="text-2xl font-black text-white">G2Bulk Automated API</h2>
              <p className="text-xs text-gray-400">Service catalog and fulfillment API v2</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-400">Current Balance</span>
            <p className={`text-3xl font-black ${balance ? 'text-amber-400' : 'text-red-400'}`}>{balance ? `$${Number(balance.balance).toFixed(2)} ${balance.currency || 'USD'}` : 'Unavailable'}</p>
            <button
              onClick={fetchProviderData}
              disabled={loading}
              className="mt-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 justify-end disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Balance</span>
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800 space-y-4 p-6">
          <h3 className="text-base font-bold text-white">Provider Request & Execution Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">HTTP Status</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-800/40">
                    <td className="py-3.5 px-4 font-bold text-cyan-400">{log.providerType}</td>
                    <td className="py-3.5 px-4 text-gray-300">{log.endpoint}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.statusCode === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-amber-400">{log.executionTimeMs}ms</td>
                    <td className="py-3.5 px-4 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
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
