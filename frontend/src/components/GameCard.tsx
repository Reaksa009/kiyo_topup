import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Flame, ShieldAlert, Swords, Target, Crosshair } from 'lucide-react';

interface GameCardProps {
  game: {
    _id: string;
    title: string;
    slug: string;
    publisher: string;
    thumbnail: string;
    categoryId?: any;
    isPopular?: boolean;
    isFlashSale?: boolean;
    status?: string;
  };
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const categoryName = typeof game.categoryId === 'object' ? game.categoryId?.name : (game.categoryId || 'GAME');

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative rounded-2xl overflow-hidden glass-panel glass-panel-hover border border-gray-800 flex flex-col h-full"
    >
      {/* Thumbnail Header */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111625] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="inline-flex items-center space-x-1 text-[9px] font-black uppercase bg-cyan-500/90 text-black px-2.5 py-1 rounded-lg glow-cyan backdrop-blur-md">
            <span>{categoryName}</span>
          </span>
          {game.isPopular && (
            <span className="inline-flex items-center space-x-1 text-[9px] font-black uppercase bg-purple-600/90 text-white px-2 py-1 rounded-lg glow-purple backdrop-blur-md">
              <Flame className="w-3 h-3 text-amber-300" />
              <span>POPULAR</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
            {game.publisher}
          </span>
          <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mt-0.5">
            {game.title}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Instant Top-Up</span>
          <Link
            to={`/game/${game.slug}`}
            className="text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 px-3.5 py-1.5 rounded-xl transition-all shadow-md group-hover:glow-cyan"
          >
            TOP UP
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
