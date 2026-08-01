import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const banners = [
  { id: 1, eyebrow: 'WELCOME TO KIYO TOPUP', title: 'Power your next win.', subtitle: 'Fast, secure top-ups for the games you love. Delivered in seconds, priced for every player.', bg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=76', link: '/game/mobile-legends' },
  { id: 2, eyebrow: 'LIMITED-TIME DROP', title: 'More credits. More play.', subtitle: 'Unlock bonus diamonds, UC, VP and more with weekly offers made for Cambodia gamers.', bg: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1400&q=76', link: '/promotions' }
];

export const HeroBanner: React.FC = () => {
  const [current, setCurrent] = useState(0);
  useEffect(() => { const timer = setInterval(() => setCurrent((prev) => (prev + 1) % banners.length), 6500); return () => clearInterval(timer); }, []);
  const banner = banners[current];

  return (
    <section className="relative mt-4 min-w-0 overflow-hidden rounded-[22px] border border-white/[0.1] bg-[#0b1020] shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:mt-5 sm:rounded-[28px] lg:mt-7">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />
      <div key={banner.id} className="hero-fade absolute inset-0">
        <img src={banner.bg} alt="" aria-hidden="true" fetchPriority={current === 0 ? 'high' : 'auto'} decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070a12_0%,rgba(7,10,18,.93)_36%,rgba(7,10,18,.48)_70%,rgba(7,10,18,.7)_100%)]" />
      </div>

      <div className="relative grid min-h-[590px] min-w-0 items-center gap-8 px-5 pb-16 pt-10 min-[400px]:min-h-[520px] sm:min-h-[510px] sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_.85fr] lg:px-16">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:text-[10px] sm:tracking-[0.2em]"><Sparkles className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{banner.eyebrow}</span></div>
          <h1 className="max-w-full break-words text-[2.15rem] font-black leading-[1.05] tracking-[-0.045em] text-white min-[400px]:text-4xl sm:max-w-xl sm:text-5xl lg:text-7xl">{banner.title.split(' ').map((word, index) => <React.Fragment key={`${word}-${index}`}>{index === 1 ? <span className="text-gradient">{word} </span> : `${word} `}</React.Fragment>)}</h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">{banner.subtitle}</p>
          <div className="mt-7 grid grid-cols-1 gap-3 min-[400px]:flex min-[400px]:flex-wrap"><Link to={banner.link} className="btn-primary w-full justify-center min-[400px]:w-auto"><Zap className="h-4 w-4" />Top Up Now<ArrowRight className="h-4 w-4" /></Link><Link to="/#games" className="btn-secondary w-full justify-center min-[400px]:w-auto">Explore Games<ChevronRight className="h-4 w-4" /></Link></div>
          <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-300 sm:mt-8 sm:gap-x-5 sm:text-[11px]"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />Instant delivery</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />Secure payments</span><span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-violet-300" />Best-value deals</span></div>
        </div>

        <div className="hidden justify-end lg:flex"><div className="w-[290px] rounded-3xl border border-white/10 bg-[#0b1020]/75 p-5 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><span className="eyebrow">LIVE STORE</span><span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" />Online now</span></div><div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><div className="flex items-center justify-between text-xs"><span className="text-slate-400">Average delivery</span><strong className="text-white">5–10 sec</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" /></div><div className="mt-5 grid grid-cols-2 gap-3"><div><p className="text-2xl font-black text-white">8</p><p className="text-[10px] text-slate-500">Games live</p></div><div><p className="text-2xl font-black text-white">24/7</p><p className="text-[10px] text-slate-500">Support</p></div></div></div><div className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-300/[0.08] p-3 text-[10px] font-semibold text-cyan-100"><ShieldCheck className="h-4 w-4 text-cyan-300" />Trusted checkout for Cambodian gamers</div></div></div>
      </div>

      <div className="absolute bottom-5 left-6 flex items-center gap-2 sm:left-10">{banners.map((item, index) => <button key={item.id} type="button" aria-label={`Show banner ${index + 1}`} onClick={() => setCurrent(index)} className={`h-1.5 rounded-full transition-all ${index === current ? 'w-10 bg-cyan-300' : 'w-2 bg-white/30 hover:bg-white/60'}`} />)}</div>
      <div className="absolute bottom-5 right-6 hidden items-center gap-2 text-[10px] font-bold text-slate-400 sm:flex"><Search className="h-3.5 w-3.5" />Search a game below</div>
    </section>
  );
};
