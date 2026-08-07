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

type PackageFilter = 'all' | 'popular' | 'standard';

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

  if (
    combined.includes('event') ||
    combined.includes('pass') ||
    combined.includes('weekly') ||
    combined.includes('monthly') ||
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
  { id: 'all', label: 'ទាំងអស់ / All', shortLabel: 'All', icon: Layers3 },
  { id: 'popular', label: 'លក់ដាច់បំផុត / Best Selling', shortLabel: 'Best Selling', icon: Flame },
  { id: 'standard', label: 'ធម្មតា / Normal', shortLabel: 'Normal', icon: PackageOpen }
];

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
    const result = { all: packages.length, popular: 0, standard: 0 };
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

    if (cleanSlug.startsWith('mobile-legends')) {
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
      <section className={`relative overflow-hidden border border-slate-200/80 bg-white shadow-sm ${compactJoined ? 'rounded-b-[24px] rounded-t-none border-t-0 md:rounded-2xl md:border-t' : 'rounded-2xl'}`} aria-labelledby="package-selector-title">
        
         <div className="relative flex items-center gap-2.5 bg-[#f8fafc] px-4 py-4 sm:px-5 border-b border-slate-200/60">
           {step && (
             <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white shadow-sm">
               {step}
             </span>
           )}
           <div className="min-w-0">
             <h2 id="package-selector-title" className="text-sm font-black text-slate-800 sm:text-base">សូមជ្រើសរើសកញ្ចប់ពេជ្រ / Select Top-Up Package</h2>
             <p className="mt-0.5 text-[10px] text-slate-500 font-bold">{packages.length} choices available</p>
           </div>
         </div>

        <div className="relative space-y-3.5 p-3.5 sm:p-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/60 bg-slate-100/60 p-1 sm:grid-cols-4">
            {filters.map(({ id, shortLabel, icon: Icon }) => {
              const active = activeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFilter(id)}
                  aria-pressed={active}
                  className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-[9px] font-black uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    active
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? id === 'popular' ? 'text-amber-500' : 'text-sky-500' : 'text-slate-400'}`} />
                  {shortLabel}
                  <span className="rounded-md bg-slate-200/80 px-1 py-0.5 text-[7px] text-slate-500">{counts[id]}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search diamonds or passes..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-[10px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
              aria-label="Search top-up packages"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600" aria-label="Clear package search">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {compactMobileLead && <div className="md:hidden">{compactMobileLead}</div>}

          {visiblePackages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
              {visiblePackages.map((pkg) => {
                const selected = selectedPackage?._id === pkg._id;
                return (
                  <button
                    key={pkg._id}
                    type="button"
                    onClick={() => onSelect(pkg)}
                    aria-pressed={selected}
                    className={`group relative flex min-h-[160px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl border p-3 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      selected
                        ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-500/5 scale-[1.02]'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute left-2 top-2 rounded bg-sky-500 px-1 py-0.5 text-[6px] font-bold uppercase tracking-wider text-white">
                        {pkg.badge}
                      </span>
                    )}
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow">
                        <Check className="h-3 w-3" strokeWidth={3.5} />
                      </span>
                    )}
                    <img
                      src={getPackageImage(pkg, gameSlug, sortedPackages)}
                      alt=""
                      width="56"
                      height="56"
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="mt-2.5 flex flex-col items-center">
                      <span className="text-sm font-extrabold tracking-tight text-sky-600">${pkg.price.toFixed(2)}</span>
                      <span className="text-[7.5px] font-bold text-slate-400">KHR {formatKhr(pkg.price).toLocaleString('en-US')}</span>
                    </div>
                    <h3 className={`mt-1.5 text-[10px] font-bold leading-snug ${selected ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                      {pkg.title}
                    </h3>
                    {pkg.supportsBoth && (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[6px] font-semibold uppercase tracking-wider text-sky-500">
                        <Globe2 className="h-1.5 w-1.5" /> Global & Regular
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
              <PackageOpen className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-2 text-[10px] font-black text-slate-600">No packages found</p>
              <button type="button" onClick={() => { setActiveFilter('all'); setQuery(''); }} className="mt-2 text-[8px] font-black text-sky-500 hover:underline">Show all packages</button>
            </div>
          )}

          {visiblePackages.length < filteredPackages.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + initialVisibleCount)}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-[8px] font-black uppercase text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Load more packages <span className="text-slate-400">({filteredPackages.length - visiblePackages.length})</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative overflow-hidden border border-slate-200/80 bg-white shadow-sm ${
        embedded ? 'rounded-[26px]' : 'rounded-3xl'
      }`}
      aria-labelledby="package-selector-title"
    >
      <div className="relative flex items-center gap-2.5 p-5 sm:p-6 border-b border-slate-200/60 bg-[#f8fafc]">
        {step && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white shadow-sm">
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h2 id="package-selector-title" className="text-sm font-black text-slate-800 sm:text-base">
            សូមជ្រើសរើសកញ្ចប់ពេជ្រ / Select Top-Up Package
          </h2>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Choose the best package for your account. Prices in USD & KHR.
          </p>
        </div>
      </div>

      <div className="relative space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid flex-1 grid-cols-2 gap-2 rounded-xl border border-slate-200/60 bg-slate-100/60 p-1 sm:grid-cols-4">
            {filters.map(({ id, label, shortLabel, icon: Icon }) => {
              const active = activeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFilter(id)}
                  className={`group flex min-h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-[10px] font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    active
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  aria-pressed={active}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? id === 'popular' ? 'text-amber-500' : 'text-sky-500' : 'text-slate-400'}`} />
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                  <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[8px] text-slate-500">{counts[id]}</span>
                </button>
              );
            })}
          </div>

          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search diamonds, passes..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
              aria-label="Search top-up packages"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:text-slate-600" aria-label="Clear package search">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {visiblePackages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
            {visiblePackages.map((pkg) => {
              const selected = selectedPackage?._id === pkg._id;
              const originalPrice = pkg.discountPercent && pkg.discountPercent > 0
                ? pkg.price / (1 - pkg.discountPercent / 100)
                : null;

              return (
                <button
                  key={pkg._id}
                  type="button"
                  onClick={() => onSelect(pkg)}
                  className={`group relative flex min-h-[175px] overflow-hidden rounded-3xl border p-4 flex-col items-center justify-center text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    selected
                      ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-500/5 scale-[1.02]'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={selected}
                >
                  {pkg.badge && (
                    <span className="absolute left-2.5 top-2.5 rounded bg-sky-500 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                      {pkg.badge}
                    </span>
                  )}
                  {selected && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                  )}
                  <img
                    src={getPackageImage(pkg, gameSlug, sortedPackages)}
                    alt=""
                    className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16"
                  />
                  <div className="mt-3 flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-extrabold tracking-tight text-sky-600 sm:text-[17px]">${pkg.price.toFixed(2)}</span>
                      {originalPrice && <span className="text-[8px] text-slate-400 line-through">${originalPrice.toFixed(2)}</span>}
                    </div>
                    <p className="text-[8.5px] font-semibold text-slate-400">KHR {formatKhr(pkg.price).toLocaleString('en-US')}</p>
                  </div>
                  <h3 className={`mt-2 text-xs font-bold leading-snug ${selected ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                    {pkg.title}
                  </h3>
                  {pkg.supportsBoth && (
                    <span className="mt-1 inline-flex items-center gap-0.5 text-[6.5px] font-bold uppercase tracking-wider text-sky-500">
                      <Globe2 className="h-2 w-2" /> Global & Regular
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
            <PackageOpen className="h-8 w-8 text-slate-400" />
            <p className="mt-3 text-sm font-black text-slate-600">No packages found</p>
            <p className="mt-1 text-[10px] text-slate-500">Try another package type or clear your search.</p>
            <button type="button" onClick={() => { setActiveFilter('all'); setQuery(''); }} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black text-sky-500 hover:bg-slate-100">
              Show all packages
            </button>
          </div>
        )}

        {visiblePackages.length < filteredPackages.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + initialVisibleCount)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:bg-slate-100"
          >
            Load more packages
            <span className="rounded-md bg-slate-200/85 px-2 py-0.5 text-[8px] text-slate-500">{filteredPackages.length - visiblePackages.length} remaining</span>
          </button>
        )}
      </div>
    </section>
  );
};
