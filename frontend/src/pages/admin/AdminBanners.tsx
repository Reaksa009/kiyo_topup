import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit3, ImagePlus, Plus, Save, Smartphone, X } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { ImageUploader } from '../../components/ImageUploader';
import { apiClient } from '../../api/client';

type Placement = 'home' | 'game-detail';
interface Banner { _id: string; title: string; subtitle?: string; imageUrl?: string; desktopImageUrl?: string; mobileImageUrl?: string; buttonText?: string; buttonUrl?: string; placement: Placement; gameId?: string; enabled: boolean; sortOrder: number; startDate?: string; endDate?: string; }
interface Game { _id: string; title: string; }
const emptyBanner = (): Omit<Banner, '_id'> => ({ title: '', subtitle: '', imageUrl: '', desktopImageUrl: '', mobileImageUrl: '', buttonText: '', buttonUrl: '', placement: 'home', gameId: '', enabled: true, sortOrder: 0, startDate: '', endDate: '' });
const inputClass = 'w-full rounded-xl border border-gray-700 bg-[#080b12] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500';
const dateValue = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : '';

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState<Omit<Banner, '_id'>>(emptyBanner);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bannerResponse, gamesResponse] = await Promise.all([apiClient.get('/cms/banners/admin'), apiClient.get('/games')]);
      setBanners(bannerResponse.data.data || []);
      setGames(gamesResponse.data.data || []);
      setError('');
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to load banners.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const payload = useMemo(() => ({ ...form, gameId: form.placement === 'game-detail' ? form.gameId || undefined : undefined, startDate: form.startDate || undefined, endDate: form.endDate || undefined }), [form]);
  const edit = (banner: Banner) => { setEditingId(banner._id); setForm({ ...emptyBanner(), ...banner, gameId: banner.gameId || '', startDate: dateValue(banner.startDate), endDate: dateValue(banner.endDate) }); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (editingId) await apiClient.put(`/cms/banners/${editingId}`, payload);
      else await apiClient.post('/cms/banners', payload);
      setNotice(editingId ? 'Banner updated.' : 'Banner created.'); setForm(emptyBanner()); setEditingId(null); await load();
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to save banner.'); }
    finally { setSaving(false); }
  };
  const update = async (banner: Banner, changes: Partial<Banner>) => {
    try { await apiClient.put(`/cms/banners/${banner._id}`, changes); await load(); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to update banner.'); }
  };

  return <AdminLayout><div className="space-y-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">CMS</p><h1 className="mt-1 text-2xl font-black text-white">Responsive Banners</h1><p className="mt-2 text-sm text-gray-400">Schedule home and game-detail banners with separate desktop and mobile artwork.</p></div><button onClick={() => { setEditingId(null); setForm(emptyBanner()); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-[#06121d] hover:bg-cyan-400"><Plus className="h-4 w-4" />New banner</button></div>
    {notice && <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}{error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    <form onSubmit={save} className="glass-panel rounded-3xl border border-cyan-500/20 p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-black text-white">{editingId ? 'Edit banner' : 'Create banner'}</h2><p className="mt-1 text-xs text-gray-500">Paste approved image URLs; uploads remain managed by the existing media provider.</p></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyBanner()); }} aria-label="Cancel banner editing" className="rounded-lg p-2 text-gray-400 hover:bg-gray-800"><X className="h-4 w-4" /></button>}</div>
      <div className="grid gap-4 lg:grid-cols-2"><label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Title</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></label><label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Subtitle</span><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputClass} /></label><ImageUploader label="Desktop image" value={form.desktopImageUrl || ''} onChange={(val) => setForm({ ...form, desktopImageUrl: val })} maxWidth={1600} maxHeight={610} /><ImageUploader label="Mobile image" value={form.mobileImageUrl || ''} onChange={(val) => setForm({ ...form, mobileImageUrl: val })} maxWidth={600} maxHeight={800} /><ImageUploader label="Legacy fallback image" value={form.imageUrl || ''} onChange={(val) => setForm({ ...form, imageUrl: val })} maxWidth={1200} maxHeight={450} /><label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Placement</span><select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as Placement, gameId: e.target.value === 'home' ? '' : form.gameId })} className={inputClass}><option value="home">Home</option><option value="game-detail">Game detail</option></select></label>{form.placement === 'game-detail' && <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Game</span><select required value={form.gameId} onChange={(e) => setForm({ ...form, gameId: e.target.value })} className={inputClass}><option value="">Select a game</option>{games.map((game) => <option value={game._id} key={game._id}>{game.title}</option>)}</select></label>}<label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Button text</span><input value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} className={inputClass} /></label><label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Button URL</span><input type="url" value={form.buttonUrl} onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })} placeholder="https://…" className={inputClass} /></label><label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Start date</span><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} /></label><label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">End date</span><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} /></label></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-950"><p className="border-b border-gray-800 px-3 py-2 text-[10px] font-black uppercase text-gray-500">Desktop preview</p><img src={form.desktopImageUrl || form.imageUrl || 'https://placehold.co/1200x450/111827/94a3b8?text=Desktop+banner'} alt="Desktop banner preview" className="aspect-[21/8] w-full object-cover" /></div><div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-gray-700 bg-gray-950"><p className="border-b border-gray-800 px-3 py-2 text-[10px] font-black uppercase text-gray-500">Mobile preview</p><img src={form.mobileImageUrl || form.desktopImageUrl || form.imageUrl || 'https://placehold.co/600x800/111827/94a3b8?text=Mobile+banner'} alt="Mobile banner preview" className="aspect-[3/2] w-full object-cover" /></div></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />Enabled</label><label className="flex items-center gap-2 text-sm text-gray-300">Sort order<input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-20 rounded-lg border border-gray-700 bg-[#080b12] px-2 py-1 text-white" /></label><button disabled={saving} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-[#06121d] disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save banner'}</button></div>
    </form>
    <section className="overflow-hidden rounded-3xl border border-gray-800 bg-[#090d15]"><div className="border-b border-gray-800 px-5 py-4"><h2 className="font-black text-white">Banners ({banners.length})</h2></div>{loading ? <div className="p-10 text-center text-gray-500">Loading banners…</div> : <div className="grid gap-4 p-4 lg:grid-cols-2">{banners.map((banner) => <article key={banner._id} className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/50"><img src={banner.desktopImageUrl || banner.imageUrl || banner.mobileImageUrl} alt="" className="aspect-[21/8] w-full object-cover" /><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase text-cyan-300">{banner.placement}</p><h3 className="mt-1 font-black text-white">{banner.title}</h3><p className="mt-1 text-xs text-gray-500">#{banner.sortOrder} · {banner.enabled ? 'Enabled' : 'Disabled'}</p></div><button onClick={() => edit(banner)} aria-label={`Edit ${banner.title}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Edit3 className="h-4 w-4" /></button></div><div className="mt-4 flex gap-2"><button onClick={() => update(banner, { enabled: !banner.enabled })} className={`rounded-lg px-3 py-2 text-[10px] font-black ${banner.enabled ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{banner.enabled ? 'Disable' : 'Enable'}</button><button onClick={() => update(banner, { sortOrder: Math.max(0, banner.sortOrder - 1) })} aria-label={`Move ${banner.title} up`} className="rounded-lg bg-gray-800 p-2 text-gray-300"><ArrowUp className="h-3.5 w-3.5" /></button><button onClick={() => update(banner, { sortOrder: banner.sortOrder + 1 })} aria-label={`Move ${banner.title} down`} className="rounded-lg bg-gray-800 p-2 text-gray-300"><ArrowDown className="h-3.5 w-3.5" /></button></div></div></article>)}{banners.length === 0 && <div className="col-span-full py-12 text-center text-gray-500"><ImagePlus className="mx-auto h-8 w-8" /><p className="mt-3">No banners yet.</p></div>}</div>}</section>
  </div></AdminLayout>;
};
