import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeroBanner } from '../components/HeroBanner';
import { GameCard } from '../components/GameCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Gamepad2, Flame, Zap, Search, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';

export const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';

  const [games, setGames] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gamesRes, catRes] = await Promise.all([
          apiClient.get('/games'),
          apiClient.get('/games/categories')
        ]);
        setGames(gamesRes.data.data || []);
        setCategories(catRes.data.data || []);
      } catch (err) {
        console.error('Error loading games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredGames = games.filter((g) => {
    const matchesSearch = !searchFilter || g.title.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.categoryId?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full space-y-12">
        {/* Hero Section */}
        <HeroBanner />

        {/* Categories Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-black shadow-lg glow-cyan'
                : 'glass-panel text-gray-300 hover:text-white'
            }`}
          >
            All Games
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-cyan-500 text-black shadow-lg glow-cyan'
                  : 'glass-panel text-gray-300 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Popular & Featured Games Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Flame className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-wider">AVAILABLE TOP-UP GAMES</h2>
                <p className="text-xs text-gray-400">Select your favorite game for instant 5-second delivery</p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400">{filteredGames.length} Games Available</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-gray-900 animate-pulse glass-panel"></div>
              ))}
            </div>
          ) : filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {filteredGames.map((game) => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center glass-panel rounded-3xl space-y-3">
              <Search className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Games Found</h3>
              <p className="text-xs text-gray-400">Try adjusting your search filter or category selection.</p>
            </div>
          )}
        </section>

        {/* Security & Reliability Banner */}
        <section className="glass-panel p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-900/20 via-[#111625] to-cyan-900/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center space-x-1.5 text-xs font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Guaranteed Official Top-Up</span>
            </span>
            <h3 className="text-2xl font-black text-white">Automated G2Bulk Provider Adapter & ABA PayWay KHQR</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Every package is fulfilled via direct automated provider APIs with signature validation. Your account is completely safe.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-5 py-3 rounded-2xl bg-cyan-500/20 text-cyan-300 font-extrabold text-sm border border-cyan-500/40">
              ⚡ 5-Second Processing
            </span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
