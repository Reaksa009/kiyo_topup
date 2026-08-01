import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const banners = [
  {
    id: 1,
    eyebrow: 'FAST. SAFE. EASY.',
    title: 'Power your next win.',
    subtitle: 'Game credits delivered in seconds with secure local payments.',
    bg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=82',
    link: '/game/mobile-legends'
  },
  {
    id: 2,
    eyebrow: 'WEEKLY VALUE DROP',
    title: 'More credits. Less waiting.',
    subtitle: 'Discover competitive packages for Cambodia players.',
    bg: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1600&q=82',
    link: '/promotions'
  }
];

export const HeroBanner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((previous) => (previous + 1) % banners.length), 6500);
    return () => clearInterval(timer);
  }, []);

  const banner = banners[current];

  return (
    <section className="relative mt-3 min-h-[190px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#08142d] shadow-[0_22px_60px_rgba(0,0,0,0.35)] sm:mt-5 sm:aspect-[21/8] sm:min-h-0 sm:rounded-3xl">
      <div key={banner.id} className="hero-fade absolute inset-0">
        <img
          src={banner.bg}
          alt=""
          aria-hidden="true"
          fetchPriority={current === 0 ? 'high' : 'auto'}
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,9,23,.98)_0%,rgba(3,9,23,.9)_42%,rgba(3,9,23,.28)_75%,rgba(3,9,23,.48)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071024]/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex h-full min-h-[190px] max-w-3xl flex-col justify-center px-5 py-7 sm:min-h-0 sm:px-10 lg:px-14">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/[0.09] px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-cyan-200 backdrop-blur sm:px-3 sm:py-1.5 sm:text-[9px]">
          <Sparkles className="h-3 w-3" /> {banner.eyebrow}
        </div>
        <h1 className="mt-3 max-w-[15rem] text-2xl font-black leading-[1.04] tracking-[-0.045em] text-white min-[380px]:max-w-xs min-[380px]:text-3xl sm:mt-4 sm:max-w-xl sm:text-5xl lg:text-6xl">
          {banner.title}
        </h1>
        <p className="mt-3 hidden max-w-md text-xs leading-5 text-slate-300 min-[430px]:block sm:text-sm sm:leading-6">
          {banner.subtitle}
        </p>
        <div className="mt-4 flex items-center gap-2.5 sm:mt-6">
          <Link to={banner.link} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-300 to-violet-500 px-3.5 text-[9px] font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 sm:h-11 sm:px-5 sm:text-[10px]">
            <Zap className="h-3.5 w-3.5" /> Top Up Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link to="/#games" className="hidden h-9 items-center justify-center gap-1 rounded-xl border border-white/15 bg-black/20 px-3.5 text-[9px] font-black uppercase text-white backdrop-blur transition hover:border-cyan-300/40 min-[380px]:inline-flex sm:h-11 sm:px-5 sm:text-[10px]">
            Games <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 hidden items-center gap-4 text-[9px] font-bold text-slate-300 sm:flex">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-300" />Instant delivery</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-cyan-300" />Secure checkout</span>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur sm:bottom-4">
        {banners.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show banner ${index + 1}`}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all ${index === current ? 'w-6 bg-cyan-300' : 'w-1.5 bg-white/35 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </section>
  );
};
