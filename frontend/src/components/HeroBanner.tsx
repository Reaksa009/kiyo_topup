import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronRight, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const banners = [
  { id: 1, eyebrow: 'WELCOME TO KIYO TOPUP', title: 'Power your next win.', subtitle: 'Fast, secure top-ups for the games you love. Delivered in seconds, priced for every player.', bg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=85', link: '/game/mobile-legends' },
  { id: 2, eyebrow: 'LIMITED-TIME DROP', title: 'More credits. More play.', subtitle: 'Unlock bonus diamonds, UC, VP and more with weekly offers made for Cambodia gamers.', bg: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1600&q=85', link: '/promotions' }
];

export const HeroBanner: React.FC = () => {
  const [current, setCurrent] = useState(0);
  useEffect(() => { const timer = setInterval(() => setCurrent((prev) => (prev + 1) % banners.length), 6500); return () => clearInterval(timer); }, []);
  const banner = banners[current];

  return (
    <section className="relative mt-5 overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#0b1020] shadow-[0_30px_90px_rgba(0,0,0,0.38)] lg:mt-7">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />
      <AnimatePresence mode="wait">
        <motion.div key={banner.id} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${banner.bg})` }}>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#070a12_0%,rgba(7,10,18,.93)_36%,rgba(7,10,18,.48)_70%,rgba(7,10,18,.7)_100%)]" />
        </motion.div>
      </AnimatePresence>

      <div className="relative grid min-h-[510px] items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.15fr_.85fr] lg:px-16 lg:py-14">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" />{banner.eyebrow}</div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl">{banner.title.split(' ').map((word, index) => <React.Fragment key={`${word}-${index}`}>{index === 1 ? <span className="text-gradient">{word} </span> : `${word} `}</React.Fragment>)}</h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">{banner.subtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link to={banner.link} className="btn-primary"><Zap className="h-4 w-4" />Top Up Now<ArrowRight className="h-4 w-4" /></Link><Link to="/#games" className="btn-secondary">Explore Games<ChevronRight className="h-4 w-4" /></Link></div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-300"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />Instant delivery</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />Secure payments</span><span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-violet-300" />Best-value deals</span></div>
        </div>

        <div className="hidden justify-end lg:flex"><div className="w-[290px] rounded-3xl border border-white/10 bg-[#0b1020]/75 p-5 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><span className="eyebrow">LIVE STORE</span><span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" />Online now</span></div><div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><div className="flex items-center justify-between text-xs"><span className="text-slate-400">Average delivery</span><strong className="text-white">5–10 sec</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" /></div><div className="mt-5 grid grid-cols-2 gap-3"><div><p className="text-2xl font-black text-white">8</p><p className="text-[10px] text-slate-500">Games live</p></div><div><p className="text-2xl font-black text-white">24/7</p><p className="text-[10px] text-slate-500">Support</p></div></div></div><div className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-300/[0.08] p-3 text-[10px] font-semibold text-cyan-100"><ShieldCheck className="h-4 w-4 text-cyan-300" />Trusted checkout for Cambodian gamers</div></div></div>
      </div>

      <div className="absolute bottom-5 left-6 flex items-center gap-2 sm:left-10">{banners.map((item, index) => <button key={item.id} type="button" aria-label={`Show banner ${index + 1}`} onClick={() => setCurrent(index)} className={`h-1.5 rounded-full transition-all ${index === current ? 'w-10 bg-cyan-300' : 'w-2 bg-white/30 hover:bg-white/60'}`} />)}</div>
      <div className="absolute bottom-5 right-6 hidden items-center gap-2 text-[10px] font-bold text-slate-400 sm:flex"><Search className="h-3.5 w-3.5" />Search a game below</div>
    </section>
  );
};
