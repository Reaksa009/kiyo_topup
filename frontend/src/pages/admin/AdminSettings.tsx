import React, { useEffect, useState } from 'react';
import { ExternalLink, Save, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';

interface StorefrontSettings { platformName: string; logoUrl: string; contactEmail: string; contactTelegram: string; maintenanceMode: boolean; }
const defaults: StorefrontSettings = { platformName: 'KIYO TOPUP', logoUrl: '/logo.png', contactEmail: 'support@kiyotopup.com', contactTelegram: '@kiyotopup_support', maintenanceMode: false };
const inputClass = 'w-full rounded-xl border border-gray-700 bg-[#111625] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400';

export const AdminSettings: React.FC = () => {
  const [form, setForm] = useState<StorefrontSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { apiClient.get('/settings').then((res) => setForm({ ...defaults, ...res.data.data })).catch(() => setError('Unable to load platform settings.')); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await apiClient.put('/settings', form); setNotice('Platform settings updated.'); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to update platform settings.'); }
    finally { setSaving(false); }
  };

  return <AdminLayout><div className="mx-auto max-w-3xl space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Platform</p><h1 className="mt-1 text-2xl font-black text-white">Storefront Settings</h1><p className="mt-2 text-sm text-gray-400">Customer-facing branding, support, and maintenance controls.</p></div>
    <div className="flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs leading-5 text-amber-100"><ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" /><p>Payment, provider, webhook, and notification credentials are managed only through Vercel environment variables. They cannot be viewed or edited in this dashboard.</p></div>
    {notice && <div role="status" className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}{error && <div role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    <form onSubmit={submit} className="glass-panel space-y-5 rounded-3xl border border-gray-800 p-6"><label className="block"><span className="mb-1.5 block text-xs font-bold text-gray-300">Platform name</span><input required value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} className={inputClass} /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-gray-300">Logo URL</span><input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className={inputClass} /></label><div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-gray-300">Support email</span><input required type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} /></label><label><span className="mb-1.5 block text-xs font-bold text-gray-300">Telegram contact</span><input value={form.contactTelegram} onChange={(e) => setForm({ ...form, contactTelegram: e.target.value })} className={inputClass} /></label></div><label className="flex items-center gap-3 rounded-xl border border-gray-700 p-3 text-sm text-gray-200"><input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })} />Enable maintenance mode</label><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-black text-[#07111d] disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save storefront settings'}</button></form>
    <a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200">Manage production credentials in Vercel <ExternalLink className="h-3.5 w-3.5" /></a>
  </div></AdminLayout>;
};
