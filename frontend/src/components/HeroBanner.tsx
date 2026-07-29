import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const banners = [
  {
    id: 1,
    title: 'CYBER GAMING SUMMER TOP-UP SALE',
    subtitle: 'Up to 20% Extra Diamonds on Mobile Legends & Free Fire',
    badge: 'FLASH SALE',
    bg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
    link: '/game/mobile-legends'
  },
  {
    id: 2,
    title: 'VALORANT RADIANT POINTS DISCOUNT',
    subtitle: 'Instant Delivery via Automated G2Bulk Provider Adapter',
    badge: 'NEW DEAL',
    bg: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1400&q=80',
    link: '/game/valorant'
  }
];

export const HeroBanner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const banner = banners[current];

  return (
    <div className="relative w-full h-[380px] md:h-[460px] rounded-3xl overflow-hidden glass-panel border border-cyan-500/20 shadow-2xl my-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${banner.bg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#080B11] via-[#080B11]/80 to-transparent flex items-center px-8 md:px-16">
            <div className="max-w-xl space-y-4">
              <span className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 text-black px-3.5 py-1.5 rounded-full glow-cyan">
                <Zap className="w-3.5 h-3.5" />
                <span>{banner.badge}</span>
              </span>

              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-wide">
                {banner.title}
              </h1>

              <p className="text-sm md:text-base text-gray-300 font-medium">
                {banner.subtitle}
              </p>

              <div className="pt-2">
                <Link
                  to={banner.link}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black font-extrabold text-sm uppercase px-7 py-3 rounded-2xl shadow-xl glow-cyan transition-all transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Top-Up Now</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 right-8 flex space-x-2">
        {banners.map((b, idx) => (
          <button
            key={b.id}
            onClick={() => setCurrent(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === current ? 'bg-cyan-400 w-8 glow-cyan' : 'bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
