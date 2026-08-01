import React, { useEffect, useState } from 'react';

const banners = [
  {
    id: 1,
    bg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=82'
  },
  {
    id: 2,
    bg: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1600&q=82'
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
    <section aria-label="Featured gaming banner" className="relative mt-3 min-h-[190px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#08142d] shadow-[0_22px_60px_rgba(0,0,0,0.35)] sm:mt-5 sm:aspect-[21/8] sm:min-h-0 sm:rounded-3xl">
      <div key={banner.id} className="hero-fade absolute inset-0">
        <img
          src={banner.bg}
          alt="Kiyo Topup gaming promotion"
          fetchPriority={current === 0 ? 'high' : 'auto'}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
};
