import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  ExternalLink,
  PackageCheck,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';

interface SyncReport {
  syncStarted: string;
  syncFinished: string;
  status: 'SUCCESS' | 'FAILED';
  oldPackagesDeleted: number;
  newPackagesImported: number;
  duplicatePackagesRemoved: number;
  missingPackages: number;
  extraPackages: number;
  finalDatabaseCount: number;
  latestCatalogCount: number;
  validation: 'PASSED' | 'FAILED';
  transaction: 'COMMITTED' | 'ROLLED BACK';
  reason?: string;
}

interface OperationsData {
  generatedAt: string;
  counts: {
    failedOrders: number;
    stuckOrders: number;
    pendingPayments: number;
    activePackages: number;
    totalPackages: number;
  };
  provider: { balance: number | null; online: boolean; error: string };
  sync: {
    isSyncing: boolean;
    status: 'idle' | 'running' | 'success' | 'failed';
    startedAt: string | null;
    finishedAt: string | null;
    lastReport: SyncReport | null;
    lastError: string;
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    href: string;
    count?: number;
  }>;
  actionableOrders: Array<{
    _id: string;
    orderNumber: string;
    gameTitle: string;
    packageTitle: string;
    amount: number;
    paymentStatus: string;
    providerStatus: string;
    overallStatus: string;
    failureReason?: string;
    updatedAt: string;
  }>;
}

const formatDate = (value?: string | null) => value
  ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  : 'Not available';

const statusTone: Record<string, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  running: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  failed: 'border-red-500/30 bg-red-500/10 text-red-300',
  idle: 'border-gray-700 bg-gray-800/60 text-gray-300'
};

export const AdminOperations: React.FC = () => {
  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadOperations = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await apiClient.get('/admin/operations');
      setData(response.data.data);
      setError('');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load operations health.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOperations();
    const timer = window.setInterval(() => loadOperations(true), 60_000);
    return () => window.clearInterval(timer);
  }, [loadOperations]);

  const runSync = async () => {
    if (!window.confirm('Replace the full G2Bulk catalog now? Listing and checkout will be locked until exact validation passes.')) return;
    setSyncing(true);
    setError('');
    setNotice('Catalog replacement is running. Customers are protected by the synchronization lock.');
    try {
      await apiClient.post('/admin/catalog-sync', {}, { timeout: 60_000 });
      setNotice('Catalog replaced and validated successfully. The transaction was committed.');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Catalog sync failed. The database transaction was rolled back.');
      setNotice('');
    } finally {
      setSyncing(false);
      await loadOperations(true);
    }
  };

  const report = data?.sync.lastReport;

  return (
    <AdminLayout>
      <div className="space-y-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Live platform health</p>
            <h1 className="mt-1 text-2xl font-black text-white">Operations Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">Review order exceptions, supplier health, package coverage, and transactional catalog replacements in one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadOperations()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-200 transition hover:border-gray-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={runSync}
              disabled={syncing || data?.sync.isSyncing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Database className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing || data?.sync.isSyncing ? 'Sync in progress…' : 'Run G2Bulk Sync'}
            </button>
          </div>
        </div>

        {notice && <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{notice}</div>}
        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {loading && !data ? (
          <div className="glass-panel rounded-3xl border border-gray-800 p-12 text-center text-sm text-gray-400">Loading operations health…</div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: 'Failed / 24h', value: data.counts.failedOrders, icon: XCircle, color: 'text-red-400' },
                { label: 'Stuck > 15m', value: data.counts.stuckOrders, icon: Clock3, color: 'text-amber-400' },
                { label: 'Pending Payments', value: data.counts.pendingPayments, icon: AlertTriangle, color: 'text-orange-400' },
                { label: 'Active Packages', value: `${data.counts.activePackages}/${data.counts.totalPackages}`, icon: PackageCheck, color: 'text-cyan-400' },
                { label: 'G2Bulk Balance', value: data.provider.balance === null ? 'Unavailable' : `$${data.provider.balance.toFixed(2)}`, icon: CircleDollarSign, color: data.provider.online ? 'text-emerald-400' : 'text-red-400' }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-panel rounded-2xl border border-gray-800 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
              <section className="glass-panel rounded-3xl border border-gray-800 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-black text-white"><ServerCog className="h-5 w-5 text-purple-400" /> Catalog Sync</h2>
                    <p className="mt-1 text-xs text-gray-500">Full replacement with exact per-package validation.</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusTone[data.sync.status]}`}>
                    {data.sync.status}
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-gray-950/60 p-3"><p className="text-gray-500">Last started</p><p className="mt-1 font-semibold text-gray-200">{formatDate(data.sync.startedAt)}</p></div>
                  <div className="rounded-xl bg-gray-950/60 p-3"><p className="text-gray-500">Last finished</p><p className="mt-1 font-semibold text-gray-200">{formatDate(data.sync.finishedAt)}</p></div>
                </div>
                {report ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ['Imported', report.newPackagesImported],
                      ['Old deleted', report.oldPackagesDeleted],
                      ['Duplicates', report.duplicatePackagesRemoved],
                      ['Missing', report.missingPackages],
                      ['Extra', report.extraPackages],
                      ['Final count', report.finalDatabaseCount]
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl border border-gray-800 bg-gray-900/70 p-3">
                        <p className="text-[10px] uppercase text-gray-500">{label}</p>
                        <p className="mt-1 text-lg font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-5 rounded-xl bg-gray-950/60 p-4 text-xs text-gray-500">No persisted sync report yet. The next run will appear here.</p>}
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Checkout remains locked until validation commits or rollback completes.
                </div>
              </section>

              <section className="glass-panel rounded-3xl border border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-white">Action Alerts</h2>
                    <p className="mt-1 text-xs text-gray-500">Generated from live platform state.</p>
                  </div>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-black text-gray-200">{data.alerts.length}</span>
                </div>
                <div className="mt-5 space-y-3">
                  {data.alerts.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <p className="mt-3 text-sm font-bold text-white">Everything looks healthy</p>
                      <p className="mt-1 text-xs text-gray-500">No operational action is required.</p>
                    </div>
                  ) : data.alerts.map((alert) => (
                    <Link key={alert.id} to={alert.href} className={`group flex items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${alert.severity === 'critical' ? 'border-red-500/25 bg-red-500/10' : alert.severity === 'warning' ? 'border-amber-500/25 bg-amber-500/10' : 'border-cyan-500/25 bg-cyan-500/10'}`}>
                      <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`} />
                      <div className="min-w-0 flex-1"><p className="text-sm font-bold text-white">{alert.title}</p><p className="mt-1 text-xs leading-relaxed text-gray-400">{alert.message}</p></div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-white" />
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <section className="glass-panel overflow-hidden rounded-3xl border border-gray-800">
              <div className="flex items-center justify-between border-b border-gray-800 p-6">
                <div><h2 className="text-base font-black text-white">Orders Requiring Review</h2><p className="mt-1 text-xs text-gray-500">Failed in the past 24 hours or processing for over 15 minutes.</p></div>
                <Link to="/admin/orders" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">View all orders</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-gray-950/50 text-[10px] uppercase tracking-wider text-gray-500"><tr><th className="px-6 py-3">Order</th><th className="px-4 py-3">Game</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Updated</th><th className="px-6 py-3"></th></tr></thead>
                  <tbody className="divide-y divide-gray-800/70">
                    {data.actionableOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-800/30">
                        <td className="px-6 py-4"><p className="font-mono font-bold text-cyan-400">{order.orderNumber}</p><p className="mt-1 max-w-56 truncate text-[10px] text-red-300">{order.failureReason || order.overallStatus}</p></td>
                        <td className="px-4 py-4"><p className="font-bold text-white">{order.gameTitle}</p><p className="text-[10px] text-gray-500">{order.packageTitle}</p></td>
                        <td className="px-4 py-4 font-bold text-white">${order.amount.toFixed(2)}</td>
                        <td className="px-4 py-4 text-gray-300">{order.paymentStatus}</td>
                        <td className="px-4 py-4 text-gray-300">{order.providerStatus}</td>
                        <td className="px-4 py-4 text-gray-500">{formatDate(order.updatedAt)}</td>
                        <td className="px-6 py-4 text-right"><Link to={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`} className="rounded-lg border border-gray-700 px-3 py-2 font-bold text-gray-200 hover:border-cyan-500 hover:text-cyan-300">Review</Link></td>
                      </tr>
                    ))}
                    {data.actionableOrders.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No failed or stuck orders.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};
