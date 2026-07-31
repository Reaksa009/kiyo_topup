import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock3, Copy, Flame, Gift, Sparkles, TicketPercent, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const offers = [
  { title: 'Weekly Diamond Pass', game: 'Mobile Legends', tag: 'BEST VALUE', description: 'Get extra diamonds every week with our most popular pass.', accent: 'from-cyan-400/20 to-blue-600/5', link: '/game/mobile-legends', icon: Sparkles },
  { title: 'Weekend Gamer Deal', game: 'All games', tag: 'FLASH SALE', description: 'Take $1 off any order over $10 with the code PLAYMORE.', accent: 'from-violet-400/20 to-fuchsia-600/5', link: '#coupons', icon: Flame },
  { title: 'First top-up bonus', game: 'New players', tag: 'WELCOME', description: 'Create your Kiyo account and unlock a welcome voucher.', accent: 'from-amber-300/20 to-orange-600/5', link: '/register', icon: Gift }
];

export const Promotions: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 42, seconds: 18 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((current) => {
      const total = current.hours * 3600 + current.minutes * 60 + current.seconds - 1;
      const safeTotal = total < 0 ? 7 * 3600 + 42 * 60 + 18 : total;
      return { hours: Math.floor(safeTotal / 3600), minutes: Math.floor((safeTotal % 3600) / 60), seconds: safeTotal % 60 };
    }), 1000);
    return () => clearInterval(timer);
  }, []);

  const copyCoupon = () => { navigator.clipboard?.writeText('PLAYMORE'); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return <div className="min-h-screen bg-[#070a12] text-slate-100"><Navbar /><main><section className="section-shell py-14 sm:py-20"><div className="max-w-3xl"><span className="eyebrow">KIYO REWARDS</span><h1 className="display-title mt-3 text-5xl sm:text-6xl">More play. <span className="text-gradient">More value.</span></h1><p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">Fresh offers, bonus credits and exclusive coupons for the games you play every day.</p></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{offers.map(({ title, game, tag, description, accent, link, icon: Icon }) => <div key={title} className={`relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br ${accent} p-6`}><Icon className="absolute right-5 top-5 h-16 w-16 text-white/[0.08]" /><span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-black tracking-[0.16em] text-cyan-100">{tag}</span><p className="mt-8 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{game}</p><h2 className="mt-2 text-2xl font-black text-white">{title}</h2><p className="mt-3 min-h-10 text-xs leading-5 text-slate-300">{description}</p><Link to={link} className="mt-7 inline-flex items-center gap-1.5 text-xs font-black text-white hover:text-cyan-200">View offer<ArrowRight className="h-3.5 w-3.5" /></Link></div>)}</div></section>
<section className="border-y border-white/[0.08] bg-white/[0.018] py-14"><div className="section-shell"><div className="surface-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-300" /><span className="eyebrow text-amber-200">ENDS TODAY</span></div><h2 className="mt-3 text-2xl font-black text-white">Weekend gamer deal</h2><p className="mt-2 max-w-lg text-xs leading-5 text-slate-400">Use <strong className="text-white">PLAYMORE</strong> for $1 off orders over $10. No complicated terms.</p></div><div className="flex items-center gap-2"><div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center"><p className="text-xl font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</p><p className="text-[9px] uppercase text-slate-500">Hours</p></div><span className="text-slate-600">:</span><div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center"><p className="text-xl font-black text-white">{String(timeLeft.minutes).padStart(2, '0')}</p><p className="text-[9px] uppercase text-slate-500">Minutes</p></div><span className="text-slate-600">:</span><div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center"><p className="text-xl font-black text-white">{String(timeLeft.seconds).padStart(2, '0')}</p><p className="text-[9px] uppercase text-slate-500">Seconds</p></div></div></div></div></section>
<section id="coupons" className="section-shell py-14 sm:py-20"><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><div><span className="eyebrow">COUPON WALLET</span><h2 className="display-title mt-2 text-3xl">Save on your next top-up.</h2><p className="mt-4 text-sm leading-6 text-slate-400">Copy a code, apply it at checkout and keep more of your budget for the games you love.</p></div><div className="surface-card p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300/[0.1] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-200"><TicketPercent className="h-3 w-3" />Active coupon</span><h3 className="mt-4 text-2xl font-black text-white">PLAYMORE</h3><p className="mt-2 text-xs text-slate-400">$1 off orders over $10 · One use per customer</p></div><button type="button" onClick={copyCoupon} className="btn-secondary !px-3 !py-2">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}</button></div><div className="mt-7 grid gap-3 text-[11px] text-slate-400 sm:grid-cols-3"><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" />Instant discount</span><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" />All live games</span><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" />Secure checkout</span></div></div></div></section>
</main><Footer /></div>;
};
