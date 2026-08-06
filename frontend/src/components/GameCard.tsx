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
    isPurchasable?: boolean;
    status?: 'active' | 'maintenance' | 'inactive';
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
  const isPurchasable = game.isPurchasable !== false && !game.comingSoon;
  const startPrice = game.startingPrice ?? fallbackPrices[game.slug] ?? 0.99;
  const image = game.thumbnail || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80';

  return (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-xl border bg-[#0d1a36] shadow-[0_10px_28px_rgba(0,0,0,0.2)] transition duration-300 sm:rounded-2xl ${
        game.comingSoon
          ? 'border-white/[0.06] opacity-70'
          : 'border-[#1c4773]/80 hover:-translate-y-1 hover:border-cyan-300/45 hover:shadow-[0_15px_34px_rgba(5,30,56,0.45)]'
      }`}
    >
      {isPurchasable && (
        <Link
          to={`/game/${game.slug}`}
          aria-label={`Top up ${game.title}`}
          className="absolute inset-0 z-20 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:rounded-2xl"
        >
          <span className="sr-only">Top up {game.title}</span>
        </Link>
      )}

      <div className="relative aspect-square overflow-hidden bg-[#071024] p-1 sm:p-1.5">
        <img
          src={image}
          alt={`${game.title} game artwork`}
          loading="lazy"
          decoding="async"
          width="300"
          height="300"
          sizes="(max-width: 639px) 33vw, (max-width: 1023px) 25vw, 16vw"
          className="h-full w-full rounded-lg object-cover transition duration-500 motion-safe:group-hover:scale-[1.04] sm:rounded-xl"
        />
        <div className="pointer-events-none absolute inset-1 rounded-lg bg-gradient-to-t from-[#071024]/65 via-transparent to-transparent sm:inset-1.5 sm:rounded-xl" />

        {game.discount && (
          <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-md bg-emerald-300 px-1.5 py-0.5 text-[5px] font-black uppercase tracking-wide text-emerald-950 shadow sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[7px]">
            {game.discount}
          </span>
        )}

        {(game.isPopular || game.isFlashSale) && (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-md bg-violet-500/95 px-1.5 py-0.5 text-[5px] font-black uppercase text-white sm:bottom-2 sm:left-2 sm:text-[7px]">
            <Flame className="h-2 w-2 text-amber-200" /> {game.isFlashSale ? 'Deal' : 'Popular'}
          </span>
        )}
      </div>

      <div className="p-1.5 sm:p-2.5">
        <p className="truncate text-[6px] font-bold uppercase tracking-[0.1em] text-cyan-300/70 sm:text-[8px]">
          {game.publisher || 'Kiyo Store'}
        </p>
        <h3 className="mt-0.5 line-clamp-2 min-h-7 text-[9px] font-black leading-3.5 text-white sm:mt-1 sm:min-h-9 sm:text-xs sm:leading-[1.15rem]">
          {game.title}
        </h3>

        <div className="mt-1.5 flex items-center justify-between border-t border-white/[0.07] pt-1.5 sm:mt-2 sm:pt-2">
          <div className="min-w-0">
            <span className="block text-[5px] font-bold uppercase text-slate-600 sm:text-[7px]">From</span>
            <span className="block text-[10px] font-black text-white sm:text-sm">${startPrice.toFixed(2)}</span>
          </div>
          {!isPurchasable ? (
            game.status === 'maintenance' || game.comingSoon ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 sm:h-8 sm:w-8" title="Maintenance">
                <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
              </span>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 sm:h-8 sm:w-8" title="Inactive">
                <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
              </span>
            )
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-500 text-[#03101d] shadow-md shadow-cyan-950/30 sm:h-8 sm:w-auto sm:px-2.5">
              <span className="hidden text-[8px] font-black uppercase sm:inline">Top Up</span>
              <ArrowUpRight className="h-3 w-3 sm:ml-1" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
