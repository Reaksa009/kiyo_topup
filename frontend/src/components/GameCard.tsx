import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, LockKeyhole } from 'lucide-react';

interface GameCardProps {
  game: {
    _id?: string;
    title: string;
    slug: string;
    publisher?: string;
    thumbnail: string;
    categoryId?: any;
    isPopular?: boolean;
    isFlashSale?: boolean;
    startingPrice?: number;
    discount?: string;
    comingSoon?: boolean;
  };
}

const fallbackPrices: Record<string, number> = {
  'mobile-legends': 1.25,
  'free-fire': 0.99,
  'pubg-mobile': 0.99,
  'honor-of-kings': 0.99,
  valorant: 4.8,
  'genshin-impact': 0.99,
  roblox: 4.99,
  'steam-wallet': 5
};

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const categoryName = typeof game.categoryId === 'object'
    ? game.categoryId?.name
    : (game.categoryId || 'Game');
  const startPrice = game.startingPrice ?? fallbackPrices[game.slug] ?? 0.99;
  const khrPrice = Math.round((startPrice * 4100) / 100) * 100;
  const image = game.thumbnail || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80';

  return (
    <article
      className={`group relative overflow-hidden rounded-[20px] border bg-[#0e1420] shadow-[0_14px_36px_rgba(0,0,0,0.18)] transition duration-300 sm:rounded-[22px] ${
        game.comingSoon
          ? 'border-white/[0.06] opacity-75'
          : 'border-white/[0.09] hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_18px_44px_rgba(4,20,34,0.38)]'
      }`}
    >
      {!game.comingSoon && (
        <Link
          to={`/game/${game.slug}`}
          aria-label={`Top up ${game.title}`}
          className="absolute inset-0 z-20 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:rounded-[22px]"
        >
          <span className="sr-only">Top up {game.title}</span>
        </Link>
      )}

      <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1420] via-transparent to-black/10" />

        {game.discount && (
          <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-lg border border-emerald-200/20 bg-emerald-300/90 px-2 py-1 text-[7px] font-black uppercase tracking-wide text-emerald-950 shadow-lg backdrop-blur sm:left-2.5 sm:top-2.5 sm:text-[8px]">
            {game.discount}
          </span>
        )}

        {(game.isPopular || game.isFlashSale) && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-violet-500/90 px-2 py-1 text-[7px] font-black uppercase tracking-wide text-white shadow-lg sm:bottom-2.5 sm:left-2.5 sm:text-[8px]">
            <Flame className="h-2.5 w-2.5 text-amber-200" />
            {game.isFlashSale ? 'Deal' : 'Popular'}
          </span>
        )}
      </div>

      <div className="p-3 sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-300/80 sm:text-[9px]">
            {game.publisher || 'Kiyo Store'}
          </p>
          <span className="max-w-[45%] truncate text-[7px] font-bold uppercase tracking-wider text-slate-600 sm:text-[8px]">
            {categoryName}
          </span>
        </div>

        <h3 className="mt-1 truncate text-xs font-black leading-5 text-white sm:text-sm">
          {game.title}
        </h3>

        <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-white/[0.07] pt-2.5 sm:mt-3 sm:pt-3">
          <div className="min-w-0">
            <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-600 sm:text-[8px]">
              From
            </p>
            <p className="mt-0.5 whitespace-nowrap text-sm font-black tracking-tight text-white sm:text-base">
              ${startPrice.toFixed(2)}
            </p>
            <p className="mt-0.5 hidden whitespace-nowrap text-[7px] font-semibold text-slate-600 min-[370px]:block sm:text-[8px]">
              KHR {khrPrice.toLocaleString('en-US')}
            </p>
          </div>

          {game.comingSoon ? (
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 px-2 text-slate-500" title="Coming soon">
              <LockKeyhole className="h-3.5 w-3.5" />
              <span className="ml-1.5 hidden text-[8px] font-black uppercase min-[480px]:inline">Soon</span>
            </span>
          ) : (
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-cyan-300 px-2 text-slate-950 shadow-lg shadow-cyan-950/30 transition group-hover:bg-cyan-200 sm:px-2.5">
              <span className="hidden text-[8px] font-black uppercase tracking-wide min-[480px]:inline">Top Up</span>
              <ArrowUpRight className="h-3.5 w-3.5 min-[480px]:ml-1" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
