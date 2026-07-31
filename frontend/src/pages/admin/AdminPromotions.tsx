import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Copy, Plus, Sparkles, Tag, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  minOrderAmount: number;
  usedCount: number;
  expiryDate: string;
  active: boolean;
}

interface Promotion {
  _id: string;
  title: string;
  bannerUrl: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

const inputClass = 'w-full rounded-xl border border-gray-700 bg-[#080b12] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500';
const localDate = (daysFromNow: number) => {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const today = () => localDate(0);
const nextMonth = () => localDate(30);

export const AdminPromotions: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [tab, setTab] = useState<'coupons' | 'promotions'>('coupons');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: 10, maxUses: 100, minOrderAmount: 0, expiryDate: nextMonth() });
  const [promotionForm, setPromotionForm] = useState({ title: '', bannerUrl: '', discountType: 'percentage', discountValue: 10, startDate: today(), endDate: nextMonth() });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [couponResponse, promotionResponse] = await Promise.all([
        apiClient.get('/cms/coupons'),
        apiClient.get('/cms/promotions')
      ]);
      setCoupons(couponResponse.data.data || []);
      setPromotions(promotionResponse.data.data || []);
      setError('');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load promotion data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (tab === 'coupons') {
        await apiClient.post('/cms/coupons', couponForm);
        setCouponForm({ code: '', discountType: 'percentage', discountValue: 10, maxUses: 100, minOrderAmount: 0, expiryDate: nextMonth() });
        setNotice('Coupon created successfully.');
      } else {
        await apiClient.post('/cms/promotions', { ...promotionForm, targetGameIds: [] });
        setPromotionForm({ title: '', bannerUrl: '', discountType: 'percentage', discountValue: 10, startDate: today(), endDate: nextMonth() });
        setNotice('Promotion created successfully.');
      }
      setShowForm(false);
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to save this item.');
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = async (item: Coupon | Promotion, type: 'coupon' | 'promotion') => {
    try {
      await apiClient.put(`/cms/${type === 'coupon' ? 'coupons' : 'promotions'}/${item._id}`, { active: !item.active });
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to update status.');
    }
  };

  const deleteItem = async (item: Coupon | Promotion, type: 'coupon' | 'promotion') => {
    const name = type === 'coupon' ? (item as Coupon).code : (item as Promotion).title;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/cms/${type === 'coupon' ? 'coupons' : 'promotions'}/${item._id}`);
      setNotice(`${type === 'coupon' ? 'Coupon' : 'Promotion'} deleted.`);
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to delete this item.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Growth tools</p><h1 className="mt-1 text-2xl font-black text-white">Promotions & Coupons</h1><p className="mt-2 text-sm text-gray-400">Launch offers and control discount availability without a deployment.</p></div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white hover:bg-purple-500"><Plus className="h-4 w-4" /> Create {tab === 'coupons' ? 'Coupon' : 'Promotion'}</button>
        </div>

        {notice && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="inline-flex rounded-xl border border-gray-800 bg-gray-950 p-1">
          <button onClick={() => { setTab('coupons'); setShowForm(false); }} className={`rounded-lg px-5 py-2 text-xs font-bold transition ${tab === 'coupons' ? 'bg-cyan-500/15 text-cyan-300' : 'text-gray-500 hover:text-white'}`}><Tag className="mr-2 inline h-3.5 w-3.5" />Coupons ({coupons.length})</button>
          <button onClick={() => { setTab('promotions'); setShowForm(false); }} className={`rounded-lg px-5 py-2 text-xs font-bold transition ${tab === 'promotions' ? 'bg-purple-500/15 text-purple-300' : 'text-gray-500 hover:text-white'}`}><Sparkles className="mr-2 inline h-3.5 w-3.5" />Promotions ({promotions.length})</button>
        </div>

        {showForm && (
          <form onSubmit={createItem} className="glass-panel rounded-3xl border border-purple-500/25 p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-black text-white">New {tab === 'coupons' ? 'coupon' : 'promotion'}</h2><p className="mt-1 text-xs text-gray-500">All required fields are validated before activation.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"><X className="h-4 w-4" /></button></div>
            {tab === 'coupons' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <label className="xl:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Coupon code</span><input required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="KIYO10" className={inputClass} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Discount type</span><select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} className={inputClass}><option value="percentage">Percentage</option><option value="fixed">Fixed USD</option></select></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Discount</span><input required min="0.01" step="0.01" type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} className={inputClass} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Maximum uses</span><input required min="1" type="number" value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })} className={inputClass} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Minimum order</span><input required min="0" step="0.01" type="number" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })} className={inputClass} /></label>
                <label className="xl:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Expiry date</span><input required type="date" value={couponForm.expiryDate} onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })} className={inputClass} /></label>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <label className="xl:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Promotion title</span><input required value={promotionForm.title} onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })} placeholder="Weekend Diamond Bonus" className={inputClass} /></label>
                <label className="xl:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Banner URL</span><input required type="url" value={promotionForm.bannerUrl} onChange={(e) => setPromotionForm({ ...promotionForm, bannerUrl: e.target.value })} placeholder="https://…" className={inputClass} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Discount type</span><select value={promotionForm.discountType} onChange={(e) => setPromotionForm({ ...promotionForm, discountType: e.target.value })} className={inputClass}><option value="percentage">Percentage</option><option value="fixed">Fixed USD</option></select></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Discount</span><input required min="0.01" step="0.01" type="number" value={promotionForm.discountValue} onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: Number(e.target.value) })} className={inputClass} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">Start date</span><input required type="date" value={promotionForm.startDate} onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })} className={inputClass} /></label>
                <label><span className="mb-1.5 block text-[11px] font-bold uppercase text-gray-500">End date</span><input required type="date" value={promotionForm.endDate} onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })} className={inputClass} /></label>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-gray-700 px-4 py-2.5 text-xs font-bold text-gray-300">Cancel</button><button disabled={saving} className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-50">{saving ? 'Saving…' : 'Create & activate'}</button></div>
          </form>
        )}

        <section className="glass-panel overflow-hidden rounded-3xl border border-gray-800">
          {loading ? <div className="p-12 text-center text-sm text-gray-500">Loading…</div> : tab === 'coupons' ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-gray-800 bg-gray-950/50 text-[10px] uppercase tracking-wider text-gray-500"><tr><th className="px-6 py-4">Code</th><th className="px-4 py-4">Discount</th><th className="px-4 py-4">Usage</th><th className="px-4 py-4">Minimum</th><th className="px-4 py-4">Expires</th><th className="px-4 py-4">Status</th><th className="px-6 py-4"></th></tr></thead><tbody className="divide-y divide-gray-800/70">
              {coupons.map((coupon) => <tr key={coupon._id} className="hover:bg-gray-800/30"><td className="px-6 py-4"><button onClick={() => navigator.clipboard?.writeText(coupon.code)} className="inline-flex items-center gap-2 font-mono text-sm font-black text-cyan-300">{coupon.code}<Copy className="h-3 w-3 text-gray-600" /></button></td><td className="px-4 py-4 font-bold text-white">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`}</td><td className="px-4 py-4 text-gray-300">{coupon.usedCount} / {coupon.maxUses}</td><td className="px-4 py-4 text-gray-300">${coupon.minOrderAmount.toFixed(2)}</td><td className="px-4 py-4 text-gray-400">{new Date(coupon.expiryDate).toLocaleDateString()}</td><td className="px-4 py-4"><button onClick={() => toggleItem(coupon, 'coupon')} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${coupon.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-800 text-gray-500'}`}>{coupon.active ? 'Active' : 'Disabled'}</button></td><td className="px-6 py-4 text-right"><button onClick={() => deleteItem(coupon, 'coupon')} className="rounded-lg p-2 text-gray-600 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></td></tr>)}
              {coupons.length === 0 && <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500">No coupons yet. Create the first customer offer.</td></tr>}
            </tbody></table></div>
          ) : (
            <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((promotion) => <article key={promotion._id} className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/50"><div className="aspect-[2.4/1] bg-gray-900"><img src={promotion.bannerUrl} alt="" className="h-full w-full object-cover" /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{promotion.title}</h3><p className="mt-1 text-sm font-bold text-purple-300">{promotion.discountType === 'percentage' ? `${promotion.discountValue}% off` : `$${promotion.discountValue.toFixed(2)} off`}</p></div><button onClick={() => deleteItem(promotion, 'promotion')} className="rounded-lg p-2 text-gray-600 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></div><div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500"><CalendarDays className="h-3.5 w-3.5" />{new Date(promotion.startDate).toLocaleDateString()} – {new Date(promotion.endDate).toLocaleDateString()}</div><button onClick={() => toggleItem(promotion, 'promotion')} className={`mt-4 w-full rounded-xl py-2 text-[10px] font-black uppercase ${promotion.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-800 text-gray-500'}`}>{promotion.active ? 'Active — click to disable' : 'Disabled — click to activate'}</button></div></article>)}
              {promotions.length === 0 && <div className="col-span-full py-14 text-center text-gray-500">No promotions yet. Create a campaign with a banner and schedule.</div>}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};
