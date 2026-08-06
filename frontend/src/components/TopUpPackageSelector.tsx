import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgePercent,
  Check,
  Flame,
  Gem,
  Globe2,
  Layers3,
  PackageOpen,
  Search,
  Sparkles,
  X,
  Zap
} from 'lucide-react';

export interface TopUpPackage {
  _id: string;
  title: string;
  price: number;
  badge?: string;
  supportsBoth?: boolean;
  discountPercent?: number;
  isPurchasable?: boolean;
}

type PackageFilter = 'all' | 'popular' | 'event' | 'standard';

interface TopUpPackageSelectorProps {
  packages: TopUpPackage[];
  selectedPackage: TopUpPackage | null;
  onSelect: (pkg: TopUpPackage) => void;
  step?: string;
  embedded?: boolean;
  compact?: boolean;
  compactJoined?: boolean;
  compactMobileLead?: React.ReactNode;
  initialVisibleCount?: number;
  gameSlug?: string;
}

const formatKhr = (usd: number) => Math.round((usd * 4100) / 100) * 100;

const packageGroup = (pkg: TopUpPackage): Exclude<PackageFilter, 'all'> => {
  const badge = (pkg.badge || '').toLowerCase();
  const combined = `${badge} ${pkg.title}`.toLowerCase();

  if (combined.includes('event') || combined.includes('pass')) {
    return 'event';
  }

  if (
    combined.includes('best') ||
    combined.includes('seller') ||
    combined.includes('value') ||
    combined.includes('sale') ||
    combined.includes('deal') ||
    combined.includes('hot')
  ) {
    return 'popular';
  }

  return 'standard';
};

const filters: Array<{
  id: PackageFilter;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'all', label: 'All Packages', shortLabel: 'All', icon: Layers3 },
  { id: 'popular', label: 'Popular', shortLabel: 'Popular', icon: Flame },
  { id: 'event', label: 'Events & Passes', shortLabel: 'Events', icon: Sparkles },
  { id: 'standard', label: 'Standard', shortLabel: 'Standard', icon: PackageOpen }
];

const groupTone = {
  popular: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  event: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  standard: 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-200'
};

export const TopUpPackageSelector: React.FC<TopUpPackageSelectorProps> = ({
  packages,
  selectedPackage,
  onSelect,
  step,
  embedded = false,
  compact = false,
  compactJoined = false,
  compactMobileLead,
  initialVisibleCount = 24,
  gameSlug = 'mobile-legends'
}) => {
  const [activeFilter, setActiveFilter] = useState<PackageFilter>('all');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  useEffect(() => {
    setActiveFilter('all');
    setQuery('');
    setVisibleCount(initialVisibleCount);
  }, [packages, initialVisibleCount]);

  useEffect(() => {
    setVisibleCount(initialVisibleCount);
  }, [activeFilter, query, initialVisibleCount]);

  const counts = useMemo(() => {
    const result = { all: packages.length, popular: 0, event: 0, standard: 0 };
    packages.forEach((pkg) => {
      result[packageGroup(pkg)] += 1;
    });
    return result;
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return packages.filter((pkg) => {
      const matchesFilter = activeFilter === 'all' || packageGroup(pkg) === activeFilter;
      const matchesQuery = !normalizedQuery || `${pkg.title} ${pkg.badge || ''}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, packages, query]);

  const visiblePackages = filteredPackages.slice(0, visibleCount);

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => a.price - b.price);
  }, [packages]);

  const getPackageImage = (pkg: TopUpPackage, slug: string, sortedList: TopUpPackage[]) => {
    const title = pkg.title.toLowerCase();
    const cleanSlug = slug.toLowerCase();

    if (cleanSlug === 'mobile-legends') {
      if (title.includes('weekly')) return '/images/daimond/weekly.png';
      if (title.includes('monthly')) return '/images/daimond/monthly.png';
      
      const diamondPkgs = sortedList.filter(p => !p.title.toLowerCase().includes('pass') && !p.title.toLowerCase().includes('weekly') && !p.title.toLowerCase().includes('monthly'));
      const index = diamondPkgs.findIndex(p => p._id === pkg._id);
      
      if (index === 0) return '/images/daimond/mlbbdm.png';
      if (index === 1) return '/images/daimond/mlbb0.png';
      if (index === 2) return '/images/daimond/mlbb1.jpg';
      if (index === 3) return '/images/daimond/mlbb2.jpg';
      if (index === 4) return '/images/daimond/mlbb3.jpg';
      if (index === 5) return '/images/daimond/mlbb4.png';
      if (index === 6) return '/images/daimond/mlbb5.jpg';
      if (index === 7) return '/images/daimond/mlbb6.png';
      return '/images/daimond/mlbb7.png';
    }

    if (cleanSlug === 'free-fire') {
      if (title.includes('weekly') || title.includes('lite') || title.includes('membership')) {
        return '/images/daimond/ff1.png';
      }
      const diamondPkgs = sortedList.filter(p => !p.title.toLowerCase().includes('membership') && !p.title.toLowerCase().includes('weekly') && !p.title.toLowerCase().includes('lite'));
      const index = diamondPkgs.findIndex(p => p._id === pkg._id);
      if (index <= 1) return '/images/daimond/ff2.png';
      if (index <= 3) return '/images/daimond/ff3.png';
      return '/images/daimond/ff4.png';
    }

    if (cleanSlug === 'pubg-mobile') {
      const ucMatch = title.match(/(\d+)\s*uc/);
      const ucCount = ucMatch ? parseInt(ucMatch[1], 10) : 0;
      if (ucCount <= 325) return '/images/daimond/uc2.png';
      return '/images/daimond/uc1.png';
    }

    if (cleanSlug === 'valorant') {
      return '/images/daimond/val1.png';
    }

    if (cleanSlug === 'honor-of-kings') {
      const index = sortedList.findIndex(p => p._id === pkg._id);
      if (index === 0) return '/images/daimond/hok1.png';
      if (index === 1) return '/images/daimond/hok2.png';
      if (index === 2) return '/images/daimond/hok3.png';
      if (index === 3) return '/images/daimond/hok4.png';
      if (index === 4) return '/images/daimond/hok5.png';
      if (index === 5) return '/images/daimond/hok6.png';
      return '/images/daimond/hok7.png';
    }

    return '/images/daimond/mlbbdm.png';
  };

  if (compact) {
    return (
      <section className={`relative overflow-hidden border border-white/[0.08] bg-[#081325]/95 shadow-2xl backdrop-blur-md ${compactJoined ? 'rounded-b-[24px] rounded-t-none border-t-0 md:rounded-2xl md:border-t' : 'rounded-2xl'}`} aria-labelledby="package-selector-title">
        <div className="absolute -right-16 -top-16 pointer-events-none h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="absolute -left-16 bottom-0 pointer-events-none h-32 w-32 rounded-full bg-violet-500/5 blur-2xl" />

         <div className="relative flex flex-col items-center text-center gap-3 border-b border-white/[0.06] bg-[#0c1c33]/80 px-4 py-5 sm:px-5">
           {step && (
             <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 text-base font-black text-white shadow-lg shadow-rose-300/30 sm:h-14 sm:w-14 sm:text-lg animate-bounce-subtle">
               {step}
             </span>
           )}
           <div className="min-w-0">
             <h2 id="package-selector-title" className="text-lg font-black tracking-tight text-white sm:text-2xl">Select Top-Up Package</h2>
             <p className="mt-1 text-[11px] font-bold text-rose-400 sm:text-sm">{packages.length} choices available</p>
           </div>
           <div className={`mt-1 min-w-0 rounded-xl border px-4 py-1 text-center ${compactMobileLead ? 'hidden md:block' : ''} ${selectedPackage ? 'border-cyan-300/30 bg-cyan-300/[0.08]' : 'border-white/[0.06] bg-black/20'}`}>
             <p className="max-w-[180px] truncate text-[9px] font-bold text-slate-500">{selectedPackage?.title || 'No package selected'}</p>
             {selectedPackage && <p className="mt-0.5 text-xs font-black text-cyan-200">${selectedPackage.price.toFixed(2)}</p>}
           </div>
         </div>

        <div className="relative space-y-3.5 p-3.5 sm:p-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.05] bg-black/15 p-1 sm:grid-cols-4">
            {filters.map(({ id, shortLabel, icon: Icon }) => {
              const active = activeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFilter(id)}
                  aria-pressed={active}
                  className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-[9px] font-black uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    active
                      ? 'bg-white/[0.08] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? id === 'popular' ? 'text-amber-300' : id === 'event' ? 'text-violet-300' : 'text-cyan-300' : 'text-slate-600'}`} />
                  {shortLabel}
                  <span className="rounded-md bg-black/20 px-1 py-0.5 text-[7px] text-slate-400">{counts[id]}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-600" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search diamonds or passes..."
              className="h-9 w-full rounded-xl border border-white/[0.07] bg-black/20 pl-9 pr-9 text-[10px] text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              aria-label="Search top-up packages"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-2.5 text-slate-600 hover:text-white" aria-label="Clear package search">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {compactMobileLead && <div className="md:hidden">{compactMobileLead}</div>}

          {visiblePackages.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-3">
              {visiblePackages.map((pkg) => {
                const selected = selectedPackage?._id === pkg._id;
                const group = packageGroup(pkg);
                const isPass = group === 'event';
                return (
                  <button
                    key={pkg._id}
                    type="button"
                    onClick={() => onSelect(pkg)}
                    aria-pressed={selected}
                    className={`group relative flex min-h-[110px] min-w-0 flex-col justify-between overflow-hidden rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                      selected
                        ? 'border-cyan-300/60 bg-gradient-to-br from-cyan-300/[0.12] via-[#091729] to-[#040e1b] shadow-lg shadow-cyan-950/30'
                        : 'border-white/[0.06] bg-[#0c1626]/80 hover:border-white/[0.12] hover:bg-[#0f1d31]'
                    }`}
                  >
                    <div className="p-2.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <img
                          src={getPackageImage(pkg, gameSlug, sortedPackages)}
                          alt=""
                          width="48"
                          height="48"
                          loading="lazy"
                          decoding="async"
                          className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                        />
                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-200 text-[#04101d] shadow-md shadow-cyan-950/40">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <h3 className={`mt-2 line-clamp-2 min-h-6 text-[9px] font-black leading-[1.3] ${selected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {pkg.title}
                      </h3>
                      {pkg.supportsBoth && (
                        <span className="mt-1 inline-flex items-center gap-0.5 rounded border border-cyan-300/10 bg-cyan-300/[0.04] px-1 py-0.5 text-[6px] font-black uppercase text-cyan-300/85">
                          <Globe2 className="h-2 w-2" /> Global & Regular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-white/[0.04] px-2.5 py-1.5 bg-black/10">
                      <p className="text-[7px] font-bold text-slate-500">KHR {formatKhr(pkg.price).toLocaleString('en-US')}</p>
                      <span className={`text-[10px] font-black ${selected ? 'text-cyan-200' : 'text-white'}`}>${pkg.price.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/[0.09] bg-black/15 py-8 text-center">
              <PackageOpen className="mx-auto h-6 w-6 text-slate-700" />
              <p className="mt-2 text-[10px] font-black text-slate-300">No packages found</p>
              <button type="button" onClick={() => { setActiveFilter('all'); setQuery(''); }} className="mt-2 text-[8px] font-black text-cyan-300">Show all packages</button>
            </div>
          )}

          {visiblePackages.length < filteredPackages.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + initialVisibleCount)}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] text-[8px] font-black uppercase text-slate-400 hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] hover:text-cyan-200"
            >
              Load more packages <span className="text-slate-600">({filteredPackages.length - visiblePackages.length})</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative overflow-hidden border border-white/[0.08] bg-[#0b1019]/95 shadow-2xl shadow-black/20 ${
        embedded ? 'rounded-[26px]' : 'glass-panel rounded-3xl'
      }`}
      aria-labelledby="package-selector-title"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-24 h-44 w-44 rounded-full bg-cyan-400/[0.07] blur-3xl" />

      <div className="relative flex flex-col items-center text-center gap-3.5 p-5 sm:p-6 border-b border-white/[0.07] bg-gradient-to-b from-cyan-400/[0.05] to-transparent">
        {step && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 text-lg font-black text-white shadow-lg shadow-rose-300/30 sm:h-14 sm:w-14 sm:text-xl animate-bounce-subtle">
            {step}
          </span>
        )}
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            <Zap className="h-3.5 w-3.5 text-amber-300 animate-pulse" /> Instant digital delivery
          </div>
          <h2 id="package-selector-title" className="text-xl font-black tracking-tight text-white sm:text-3xl">
            Select Top-Up Package
          </h2>
          <p className="text-[11px] leading-5 text-slate-400 sm:text-sm">
            Choose the best value for your account. Prices are shown in USD and Khmer Riel.
          </p>
        </div>

        <div className={`mt-2 min-w-0 rounded-2xl border px-5 py-2.5 w-full max-w-xs ${selectedPackage ? 'border-emerald-400/25 bg-emerald-400/[0.08]' : 'border-white/[0.07] bg-black/20'}`}>
          <div className="flex items-center justify-center gap-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${selectedPackage ? 'bg-emerald-300 text-[#06120e]' : 'bg-white/[0.05] text-slate-600'}`}>
              {selectedPackage ? <Check className="h-4 w-4" strokeWidth={3} /> : <Gem className="h-4 w-4" />}
            </span>
            <div className="min-w-0 text-left">
              <p className="text-[7px] font-black uppercase tracking-[0.18em] text-slate-500">{selectedPackage ? 'Selected package' : 'Nothing selected'}</p>
              <p className={`mt-0.5 truncate text-[10px] font-black ${selectedPackage ? 'text-white' : 'text-slate-500'}`}>
                {selectedPackage?.title || 'Tap a package below'}
              </p>
            </div>
            {selectedPackage && <span className="ml-auto shrink-0 text-xs font-black text-emerald-300">${selectedPackage.price.toFixed(2)}</span>}
          </div>
        </div>
      </div>

      <div className="relative space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid flex-1 grid-cols-2 gap-2 rounded-2xl border border-white/[0.07] bg-black/20 p-1.5 sm:grid-cols-4">
            {filters.map(({ id, label, shortLabel, icon: Icon }) => {
              const active = activeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFilter(id)}
                  className={`group flex min-h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-[10px] font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    active
                      ? 'bg-white/[0.09] text-white shadow-md ring-1 ring-white/[0.09]'
                      : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                  aria-pressed={active}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? id === 'popular' ? 'text-amber-300' : id === 'event' ? 'text-violet-300' : 'text-cyan-300' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                  <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-[8px] text-slate-400">{counts[id]}</span>
                </button>
              );
            })}
          </div>

          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search diamonds, passes..."
              className="h-11 w-full rounded-2xl border border-white/[0.08] bg-black/25 pl-10 pr-10 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/10"
              aria-label="Search top-up packages"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-3 rounded-lg p-1 text-slate-600 hover:bg-white/[0.05] hover:text-white" aria-label="Clear package search">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {visiblePackages.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
            {visiblePackages.map((pkg) => {
              const selected = selectedPackage?._id === pkg._id;
              const group = packageGroup(pkg);
              const originalPrice = pkg.discountPercent && pkg.discountPercent > 0
                ? pkg.price / (1 - pkg.discountPercent / 100)
                : null;

              return (
                <button
                  key={pkg._id}
                  type="button"
                  onClick={() => onSelect(pkg)}
                  className={`group relative min-h-[168px] overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-4 ${
                    selected
                      ? 'border-cyan-300/65 bg-gradient-to-br from-cyan-300/[0.14] via-[#101827] to-violet-500/[0.14] shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-300/20'
                      : 'border-white/[0.07] bg-[#10151f] hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#121a27] hover:shadow-lg hover:shadow-black/20'
                  }`}
                  aria-pressed={selected}
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${selected ? 'via-cyan-200/80' : 'via-white/10'} to-transparent`} />
                  <div className="flex items-start justify-between gap-2">
                    <img
                      src={getPackageImage(pkg, gameSlug, sortedPackages)}
                      alt=""
                      className="h-14 w-14 object-contain sm:h-16 sm:w-16"
                    />
                    {selected ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-200 text-[#061017] shadow-lg shadow-cyan-950/40">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    ) : pkg.badge ? (
                      <span className={`max-w-[96px] truncate rounded-full border px-2 py-1 text-[7px] font-black uppercase tracking-wider ${groupTone[group]}`} title={pkg.badge}>
                        {pkg.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 min-h-[42px]">
                    <h3 className={`text-[11px] font-black leading-[1.35] sm:text-xs ${selected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {pkg.title}
                    </h3>
                    {pkg.supportsBoth && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-cyan-300/15 bg-cyan-300/[0.06] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-cyan-300/80">
                        <Globe2 className="h-2.5 w-2.5" /> Global & Regular
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2 border-t border-white/[0.06] pt-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-base font-black tracking-tight sm:text-lg ${selected ? 'text-cyan-200' : 'text-white'}`}>${pkg.price.toFixed(2)}</span>
                        {originalPrice && <span className="text-[8px] text-slate-600 line-through">${originalPrice.toFixed(2)}</span>}
                      </div>
                      <p className="mt-0.5 text-[8px] font-semibold text-slate-600">KHR {formatKhr(pkg.price).toLocaleString('en-US')}</p>
                    </div>
                    {pkg.discountPercent && pkg.discountPercent > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-300/10 px-1.5 py-1 text-[8px] font-black text-emerald-300">
                        <BadgePercent className="h-3 w-3" /> -{pkg.discountPercent}%
                      </span>
                    ) : (
                      <span className="text-[7px] font-black uppercase tracking-wider text-slate-700">Instant</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.09] bg-black/15 px-6 text-center">
            <PackageOpen className="h-8 w-8 text-slate-700" />
            <p className="mt-3 text-sm font-black text-slate-300">No packages found</p>
            <p className="mt-1 text-[10px] text-slate-600">Try another package type or clear your search.</p>
            <button type="button" onClick={() => { setActiveFilter('all'); setQuery(''); }} className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-[10px] font-black text-cyan-300 hover:bg-cyan-300/[0.1]">
              Show all packages
            </button>
          </div>
        )}

        {visiblePackages.length < filteredPackages.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + initialVisibleCount)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] hover:text-cyan-200"
          >
            Load more packages
            <span className="rounded-md bg-black/30 px-2 py-0.5 text-[8px] text-slate-500">{filteredPackages.length - visiblePackages.length} remaining</span>
          </button>
        )}
      </div>
    </section>
  );
};
