import React from 'react';
import { Link } from 'react-router-dom';

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

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const isPurchasable = game.isPurchasable !== false && !game.comingSoon && game.status === 'active';
  const image = game.thumbnail || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80';
  const isMaintenance = game.status === 'maintenance' || game.comingSoon;

  const cardContent = (
    <div className={`relative flex flex-col h-full rounded-2xl border p-2 bg-[#0d1a36] shadow-md transition-all duration-300 ${
      isPurchasable 
        ? 'border-[#1c4773]/60 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-950/20' 
        : 'border-white/[0.04] bg-[#0c1322]'
    }`}>
      {/* Thumbnail Container */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#071024]">
        <img
          src={image}
          alt={game.title}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
            !isPurchasable ? 'filter grayscale contrast-75 brightness-75' : ''
          }`}
        />
        
        {/* Diagonal Ribbon on top right if not purchasable */}
        {!isPurchasable && (
          <div className="absolute right-0 top-0 overflow-hidden w-14 h-14 pointer-events-none">
            <div className="absolute top-2.5 -right-5 w-[70px] rotate-45 bg-[#ff6a00] text-center text-[5px] font-black uppercase tracking-wider text-white py-0.5 shadow-sm">
              Soon
            </div>
          </div>
        )}

        {/* Discount Badge */}
        {isPurchasable && game.discount && (
          <span className="absolute left-1.5 top-1.5 rounded bg-emerald-300 px-1.5 py-0.5 text-[6px] font-black uppercase text-emerald-950 shadow">
            {game.discount}
          </span>
        )}
      </div>

      {/* Info Area */}
      <div className="flex flex-col flex-1 mt-2 text-center">
        <h3 className="line-clamp-2 min-h-[28px] text-[10px] font-black leading-tight text-slate-100 sm:text-xs">
          {game.title}
        </h3>
        
        <div className="mt-2.5">
          {isPurchasable ? (
            <span className="block w-full rounded-lg bg-[#ffcd45] py-1.5 text-center text-[10px] font-black uppercase tracking-wide text-black transition-colors duration-200 group-hover:bg-[#ffb700]">
              Top Up
            </span>
          ) : (
            <span className="block w-full py-1.5 text-center text-[10px] font-black uppercase tracking-wide text-slate-500">
              {isMaintenance ? 'maintenance' : 'inactive'}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isPurchasable) {
    return (
      <Link to={`/game/${game.slug}`} className="group cursor-pointer block h-full">
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="group block h-full">
      {cardContent}
    </div>
  );
};
