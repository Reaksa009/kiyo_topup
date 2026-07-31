import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Flame, LockKeyhole, Sparkles } from 'lucide-react';

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

const fallbackPrices: Record<string, number> = { 'mobile-legends': 1.25, 'free-fire': 0.99, 'pubg-mobile': 0.99, 'honor-of-kings': 0.99, valorant: 4.8, 'genshin-impact': 0.99, roblox: 4.99, 'steam-wallet': 5 };

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const categoryName = typeof game.categoryId === 'object' ? game.categoryId?.name : (game.categoryId || 'GAME');
  const startPrice = game.startingPrice ?? fallbackPrices[game.slug] ?? 0.99;
  const khrPrice = Math.round(startPrice * 4100 / 100) * 100;
  const image = game.thumbnail || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80';

  return (
    <motion.article whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }} className="group relative overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.035] shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="relative aspect-[1.2/1] overflow-hidden bg-slate-900"><img src={image} alt={game.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-transparent to-transparent" /><div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><span className="rounded-lg border border-white/10 bg-[#0b1020]/70 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-100 backdrop-blur">{categoryName}</span>{game.discount && <span className="rounded-lg bg-emerald-300 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-950">{game.discount}</span>}</div>{(game.isPopular || game.isFlashSale) && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg bg-violet-500/90 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white"><Flame className="h-3 w-3 text-amber-200" />{game.isFlashSale ? 'Flash deal' : 'Popular'}</span>}</div>
      <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">{game.publisher || 'Kiyo Store'}</p><h3 className="mt-1 truncate text-base font-black text-white">{game.title}</h3></div><span className="rounded-xl bg-white/[0.06] p-2 text-slate-400 transition group-hover:bg-cyan-300/[0.12] group-hover:text-cyan-200"><Sparkles className="h-4 w-4" /></span></div><div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.08] pt-3"><div><p className="text-[10px] font-medium text-slate-500">Starting from</p><p className="mt-0.5 text-lg font-black text-white">${startPrice.toFixed(2)} <span className="text-[10px] font-bold text-slate-500">USD</span></p><p className="mt-0.5 text-[10px] font-semibold text-slate-500">≈ ៛{khrPrice.toLocaleString('en-US')}</p></div>{game.comingSoon ? <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase text-slate-500"><LockKeyhole className="h-3 w-3" />Soon</span> : <Link to={`/game/${game.slug}`} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-300 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-200">Top Up<ArrowUpRight className="h-3.5 w-3.5" /></Link>}</div></div>
    </motion.article>
  );
};
