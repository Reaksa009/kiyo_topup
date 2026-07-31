import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock3, Copy, Gift, Sparkles, TicketPercent } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiClient } from '../api/client';

interface ActivePromotion {
  _id: string;
  title: string;
  bannerUrl: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  endDate: string;
}

interface ActiveCoupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
}

const defaultOffers = [
  { title: 'Weekly Diamond Pass', game: 'Mobile Legends', tag: 'BEST VALUE', description: 'Get extra diamonds every week with our most popular pass.', link: '/game/mobile-legends', icon: Sparkles },
  { title: 'First top-up bonus', game: 'New players', tag: 'WELCOME', description: 'Create your Kiyo account and stay ready for member-only offers.', link: '/register', icon: Gift }
];

const formatRemaining = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
};

export const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [copiedCode, setCopiedCode] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    Promise.allSettled([
      apiClient.get('/cms/promotions/active'),
      apiClient.get('/cms/coupons/active')
    ]).then(([promotionResult, couponResult]) => {
      if (promotionResult.status === 'fulfilled') setPromotions(promotionResult.value.data.data || []);
      if (couponResult.status === 'fulfilled') setCoupons(couponResult.value.data.data || []);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nextPromotion = promotions[0];
  const timeLeft = useMemo(
    () => nextPromotion ? formatRemaining(new Date(nextPromotion.endDate).getTime() - now) : null,
    [nextPromotion, now]
  );

  const copyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(''), 1800);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100">
      <Navbar />
      <main>
        <section className="section-shell py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="eyebrow">KIYO REWARDS</span>
            <h1 className="display-title mt-3 text-5xl sm:text-6xl">More play. <span className="text-gradient">More value.</span></h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">Live offers, bonus credits and verified coupons for the games you play every day.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {promotions.length > 0 ? promotions.map((promotion) => (
              <article key={promotion._id} className="group relative min-h-72 overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0d1220] p-6">
                <img src={promotion.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 transition duration-500 group-hover:scale-105 group-hover:opacity-35" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090c14] via-[#090c14]/70 to-transparent" />
                <div className="relative flex h-full flex-col justify-end">
                  <span className="w-fit rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-black tracking-[0.16em] text-cyan-100">LIVE OFFER</span>
                  <h2 className="mt-4 text-2xl font-black text-white">{promotion.title}</h2>
                  <p className="mt-2 text-sm font-bold text-cyan-200">{promotion.discountType === 'percentage' ? `${promotion.discountValue}% off` : `$${promotion.discountValue.toFixed(2)} off`}</p>
                  <Link to="/#games" className="mt-6 inline-flex items-center gap-1.5 text-xs font-black text-white hover:text-cyan-200">Choose a game <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </article>
            )) : defaultOffers.map(({ title, game, tag, description, link, icon: Icon }) => (
              <article key={title} className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-cyan-400/[0.12] to-purple-600/[0.05] p-6">
                <Icon className="absolute right-5 top-5 h-16 w-16 text-white/[0.08]" />
                <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-black tracking-[0.16em] text-cyan-100">{tag}</span>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{game}</p>
                <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
                <p className="mt-3 min-h-10 text-xs leading-5 text-slate-300">{description}</p>
                <Link to={link} className="mt-7 inline-flex items-center gap-1.5 text-xs font-black text-white hover:text-cyan-200">View offer <ArrowRight className="h-3.5 w-3.5" /></Link>
              </article>
            ))}
          </div>
        </section>

        {nextPromotion && timeLeft && (
          <section className="border-y border-white/[0.08] bg-white/[0.018] py-14">
            <div className="section-shell">
              <div className="surface-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-300" /><span className="eyebrow text-amber-200">LIMITED TIME</span></div><h2 className="mt-3 text-2xl font-black text-white">{nextPromotion.title}</h2><p className="mt-2 text-xs leading-5 text-slate-400">This verified offer ends automatically when the countdown reaches zero.</p></div>
                <div className="flex items-center gap-2">
                  {Object.entries(timeLeft).map(([label, value]) => <React.Fragment key={label}><div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center"><p className="text-xl font-black text-white">{String(value).padStart(2, '0')}</p><p className="text-[9px] uppercase text-slate-500">{label}</p></div>{label !== 'seconds' && <span className="text-slate-600">:</span>}</React.Fragment>)}
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="coupons" className="section-shell py-14 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
            <div><span className="eyebrow">COUPON WALLET</span><h2 className="display-title mt-2 text-3xl">Save on your next top-up.</h2><p className="mt-4 text-sm leading-6 text-slate-400">Only active, unexpired coupon codes from Kiyo Topup appear here.</p></div>
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="surface-card p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div><span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300/[0.1] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-200"><TicketPercent className="h-3 w-3" />Active coupon</span><h3 className="mt-4 text-2xl font-black text-white">{coupon.code}</h3><p className="mt-2 text-xs text-slate-400">{coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `$${coupon.discountValue.toFixed(2)} off`} orders over ${`$${coupon.minOrderAmount.toFixed(2)}`} · Expires {new Date(coupon.expiryDate).toLocaleDateString()}</p></div>
                    <button type="button" onClick={() => copyCoupon(coupon.code)} className="btn-secondary !px-3 !py-2">{copiedCode === coupon.code ? <><Check className="h-3.5 w-3.5 text-emerald-300" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}</button>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && <div className="surface-card p-8 text-center"><TicketPercent className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 text-sm font-bold text-white">No public coupons right now</p><p className="mt-1 text-xs text-slate-500">Check back soon for the next verified offer.</p></div>}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
