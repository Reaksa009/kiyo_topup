import React, { useEffect, useMemo, useState } from 'react';
import type { PublicBannerDTO } from '../types/catalog';
import { resolveBannerImages } from '../utils/bannerPresentation';

const fallbackBanners: PublicBannerDTO[] = [
  { _id: 'fallback-1', title: 'Kiyo Topup gaming promotion', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=82&fm=webp' },
  { _id: 'fallback-2', title: 'Kiyo Topup gaming promotion', imageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1600&q=82&fm=webp' }
];

interface HeroBannerProps {
  banners?: PublicBannerDTO[];
  loading?: boolean;
  hasError?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ banners = [], loading = false, hasError = false }) => {
  const displayBanners = useMemo(() => banners.filter((banner) => banner.mobileImageUrl || banner.desktopImageUrl || banner.imageUrl).length ? banners.filter((banner) => banner.mobileImageUrl || banner.desktopImageUrl || banner.imageUrl) : fallbackBanners, [banners]);
  const [current, setCurrent] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setCurrent(0);
    setImageFailed(false);
  }, [displayBanners.length]);

  useEffect(() => {
    if (displayBanners.length < 2) return;
    const timer = setInterval(() => setCurrent((previous) => (previous + 1) % displayBanners.length), 6500);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const banner = displayBanners[Math.min(current, displayBanners.length - 1)];
  const { desktop: desktopImage, mobile: mobileImage } = resolveBannerImages(banner, fallbackBanners[0].imageUrl!);
  const content = (
    <>
      {loading ? <div className="absolute inset-0 animate-pulse bg-white/[0.06]" aria-label="Loading featured banners" /> : (
        <picture><source media="(max-width: 639px)" srcSet={imageFailed ? fallbackBanners[0].imageUrl : mobileImage} /><img
          src={imageFailed ? fallbackBanners[0].imageUrl : desktopImage}
          alt={banner.title || 'Kiyo Topup gaming promotion'} fetchPriority={current === 0 ? 'high' : 'auto'} decoding="async"
          width="1600" height="610" loading={current === 0 ? 'eager' : 'lazy'}
          onError={() => setImageFailed(true)} className="h-full w-full object-cover"
        /></picture>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06132b]/35 via-transparent to-[#06132b]/20" />
      {(banner.subtitle || banner.buttonText) && <div className="pointer-events-none absolute bottom-5 left-5 max-w-[70%] text-white sm:bottom-8 sm:left-8"><p className="text-base font-black sm:text-2xl">{banner.title}</p>{banner.subtitle && <p className="mt-1 text-xs text-slate-200 sm:text-sm">{banner.subtitle}</p>}{banner.buttonText && <span className="mt-3 inline-block rounded-lg bg-cyan-200 px-3 py-1.5 text-[10px] font-black text-[#06132b]">{banner.buttonText}</span>}</div>}
      {hasError && <p className="absolute bottom-3 left-4 rounded-lg bg-[#06132b]/85 px-2 py-1 text-[10px] font-bold text-slate-300">Showing featured games</p>}
    </>
  );

  return (
    <section aria-label="Featured gaming banner" className="relative mt-3 min-h-[190px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#08142d] shadow-[0_22px_60px_rgba(0,0,0,0.35)] sm:mt-5 sm:aspect-[21/8] sm:min-h-0 sm:rounded-3xl">
      <div key={banner._id || banner.imageUrl} className="hero-fade absolute inset-0">
        {banner.buttonUrl && !loading ? <a href={banner.buttonUrl} aria-label={banner.title || 'Open featured promotion'} className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-200">{content}</a> : content}
      </div>
      {!loading && displayBanners.length > 1 && <div className="absolute bottom-3 right-4 z-20 flex gap-1.5" aria-label="Banner slides">{displayBanners.map((item, index) => <button key={item._id || item.desktopImageUrl || item.imageUrl} type="button" aria-label={`Show banner ${index + 1}`} aria-current={index === current} onClick={() => { setCurrent(index); setImageFailed(false); }} className={`h-1.5 rounded-full transition ${index === current ? 'w-5 bg-cyan-200' : 'w-1.5 bg-white/50 hover:bg-white'}`} />)}</div>}
    </section>
  );
};
