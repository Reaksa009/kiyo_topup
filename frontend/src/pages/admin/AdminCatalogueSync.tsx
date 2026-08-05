import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

type SyncLog = { _id: string; syncType: string; status: string; errorCode?: string; errorSummary?: string; startedAt: string; completedAt?: string };
const can = (permissions: string[] | undefined, permission: string) => Boolean(permissions?.includes('*') || permissions?.includes(permission));

export const AdminCatalogueSync: React.FC = () => {
  const { admin } = useAuth();
  const [history, setHistory] = useState<SyncLog[]>([]); const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const permitted = can(admin?.permissions, 'catalogue.sync');
  const readPermitted = can(admin?.permissions, 'sync_logs.read');
  const load = useCallback(async () => {
    if (!readPermitted) { setLoading(false); return; }
    setLoading(true); try { const response = await apiClient.get('/admin/providers/g2bulk/sync/history'); setHistory(response.data.data || []); setError(''); }
    catch (e: any) { setError(e.response?.data?.error?.message || e.response?.data?.message || 'Unable to load sync history.'); }
    finally { setLoading(false); }
  }, [readPermitted]);
  useEffect(() => { load(); }, [load]);
  const sync = async (kind: 'games' | 'packages' | 'full') => {
    if (!permitted || submitting) return; setSubmitting(kind); setError(''); setNotice('');
    try { await apiClient.post(`/admin/providers/g2bulk/sync/${kind}`); setNotice('Catalogue synchronization started.'); }
    catch (e: any) {
      const code = e.response?.data?.error?.code;
      setError(code === 'G2BULK_DOCUMENTATION_REQUIRED' ? 'G2Bulk documentation is required before a real catalogue sync can run.' : e.response?.data?.error?.message || 'Unable to start catalogue synchronization.');
    } finally { setSubmitting(null); await load(); }
  };
  return <AdminLayout><div className="space-y-6">
    <header className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-[#0b1019] p-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Provider catalogue</p><h1 className="mt-2 text-2xl font-black text-white">Catalogue Sync</h1><p className="mt-2 text-sm text-gray-400">Manual sync controls are server-authorized. No provider credentials or raw responses are shown here.</p></header>
    {!permitted && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Permission denied: catalogue sync requires <code>catalogue.sync</code>.</div>}
    {notice && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</div>}
    {error && <div className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
    <section className="grid gap-3 md:grid-cols-3">{(['games', 'packages', 'full'] as const).map((kind) => <button key={kind} onClick={() => sync(kind)} disabled={!permitted || Boolean(submitting)} className="rounded-2xl border border-gray-800 bg-[#0b1019] p-5 text-left transition hover:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"><Database className={`h-5 w-5 text-cyan-300 ${submitting === kind ? 'animate-pulse' : ''}`} /><p className="mt-3 font-black capitalize text-white">Sync {kind}</p><p className="mt-1 text-xs text-gray-500">{submitting === kind ? 'Submitting…' : 'Server-authorized manual request'}</p></button>)}</section>
    <section className="overflow-hidden rounded-3xl border border-gray-800 bg-[#0b1019]"><div className="flex items-center justify-between border-b border-gray-800 p-5"><div><h2 className="font-black text-white">Sync history</h2><p className="mt-1 text-xs text-gray-500">Safe summaries only</p></div><button onClick={load} disabled={loading} className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-500/10"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>{loading ? <p className="p-8 text-sm text-gray-500">Loading sync history…</p> : !readPermitted ? <p className="p-8 text-sm text-amber-200">Permission denied: sync history requires <code>sync_logs.read</code>.</p> : history.length === 0 ? <p className="p-8 text-sm text-gray-500">No provider sync attempts recorded.</p> : <div className="divide-y divide-gray-800">{history.map((item) => <div key={item._id} className="flex flex-wrap items-center gap-3 p-4 text-sm"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.status === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{item.status}</span><span className="font-bold capitalize text-white">{item.syncType}</span><span className="text-gray-500">{new Date(item.startedAt).toLocaleString()}</span>{item.errorCode && <span className="ml-auto text-xs text-amber-300">{item.errorCode}</span>}<span className="w-full text-xs text-gray-500">{item.errorSummary}</span></div>)}</div>}</section>
  </div></AdminLayout>;
};
