import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { Gamepad2, Layers, Search, Filter, ShieldCheck, Tag, TrendingUp, RefreshCw } from 'lucide-react';

export const AdminGames: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Package control states
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editBadge, setEditBadge] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchGamesAndCategories = async () => {
    try {
      setLoading(true);
      const [gamesRes, catsRes] = await Promise.all([
        apiClient.get('/games'),
        apiClient.get('/games/categories')
      ]);
      const loadedGames = gamesRes.data.data || [];
      setGames(loadedGames);
      setCategories(catsRes.data.data || []);

      if (loadedGames.length > 0 && !selectedGame) {
        setSelectedGame(loadedGames[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (pkg: any) => {
    try {
      const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
      await apiClient.put(`/packages/${pkg._id}`, { status: newStatus });
      setPackages(prev => prev.map(p => p._id === pkg._id ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error('Failed to toggle package status:', err);
    }
  };

  const startEditing = (pkg: any) => {
    setEditingPkgId(pkg._id);
    setEditPrice(pkg.price);
    setEditBadge(pkg.badge || '');
  };

  const handleSaveEdits = async (pkg: any) => {
    try {
      setSaving(true);
      await apiClient.put(`/packages/${pkg._id}`, { price: editPrice, badge: editBadge });
      setPackages(prev => prev.map(p => p._id === pkg._id ? { ...p, price: editPrice, badge: editBadge } : p));
      setEditingPkgId(null);
    } catch (err) {
      console.error('Failed to save package updates:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchGamesAndCategories();
  }, []);

  useEffect(() => {
    if (!selectedGame?._id) return;
    const fetchPkgs = async () => {
      try {
        const res = await apiClient.get(`/packages/game/${selectedGame._id}`);
        setPackages(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPkgs();
  }, [selectedGame?._id]);

  const filteredGames = games.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.publisher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || (g.categoryId?.slug || g.categoryId) === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide flex items-center space-x-2">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
              <span>Game Packages & Category Catalog</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Synchronized from G2Bulk API with automated cheapest regional pricing & category tags.
            </p>
          </div>

          <button
            onClick={fetchGamesAndCategories}
            className="self-start md:self-auto flex items-center space-x-2 text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Catalog</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-gray-800">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-cyan-500 text-black shadow-lg glow-cyan'
                : 'bg-[#111625] text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            ALL CATEGORIES ({games.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id || cat.slug}
              onClick={() => setSelectedCategory(cat.slug.toUpperCase())}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.slug.toUpperCase()
                  ? 'bg-cyan-500 text-black shadow-lg glow-cyan'
                  : 'bg-[#111625] text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {cat.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Games Sidebar */}
          <div className="glass-panel p-4 rounded-3xl space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111625] border border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredGames.map((g) => (
                <button
                  key={g._id}
                  onClick={() => setSelectedGame(g)}
                  className={`w-full p-3 rounded-2xl flex items-center space-x-3 transition-all text-left ${
                    selectedGame?._id === g._id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/50 glow-cyan'
                      : 'bg-[#111625] hover:bg-gray-800/80 border border-transparent'
                  }`}
                >
                  <img src={g.thumbnail} alt={g.title} className="w-11 h-11 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate">{g.title}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{g.publisher}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[9px] font-bold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                        {typeof g.categoryId === 'object' ? g.categoryId?.name : (g.categoryId || 'GAME')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Package Catalog Details Panel */}
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
            {selectedGame ? (
              <>
                {/* Game Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-5 gap-4">
                  <div className="flex items-center space-x-4">
                    <img src={selectedGame.thumbnail} alt={selectedGame.title} className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/30" />
                    <div>
                      <h3 className="text-lg font-black text-white">{selectedGame.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Publisher: <span className="text-cyan-400 font-semibold">{selectedGame.publisher}</span></p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-500/30">
                          Category: {typeof selectedGame.categoryId === 'object' ? selectedGame.categoryId?.name : 'GAME'}
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                          {packages.length} Live Packages
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Fields Info */}
                <div className="p-3.5 rounded-2xl bg-[#111625] border border-gray-800/80 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Customer Verification Fields:</span>
                  <span className="text-xs font-bold text-cyan-400">
                    {selectedGame.inputFields?.map((f: any) => f.label).join(' + ') || 'User ID / Account Tag'}
                  </span>
                </div>

                {/* Packages Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                      <Tag className="w-4 h-4" />
                      <span>Configured Store Packages</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {packages.map((pkg) => {
                      const margin = pkg.price - pkg.costPrice;
                      const marginPercent = pkg.costPrice > 0 ? ((margin / pkg.costPrice) * 100).toFixed(1) : '18.0';

                      return (
                        <div key={pkg._id} className={`p-4 rounded-2xl bg-[#111625] border transition-all space-y-3 ${
                          pkg.status === 'active' ? 'border-gray-800/90 hover:border-gray-700' : 'border-red-950/60 opacity-70'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-white truncate pr-2 flex-1">{pkg.title}</h5>
                            
                            <div className="flex items-center space-x-1.5 flex-shrink-0">
                              {/* Status Toggle Badge */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(pkg)}
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded transition ${
                                  pkg.status === 'active' 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}
                              >
                                {pkg.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                              </button>

                              {pkg.badge && editingPkgId !== pkg._id && (
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                                  pkg.badge === 'BEST SELLER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  pkg.badge === 'EVENT / PASS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                  pkg.badge === 'BEST VALUE' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                                  'bg-gray-800 text-gray-400'
                                }`}>
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          {editingPkgId === pkg._id ? (
                            // Edit Form Fields
                            <div className="space-y-2 pt-1.5 border-t border-gray-800/80">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400">Retail Price ($)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-[#0d111b] border border-gray-800 rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                  {editPrice < pkg.costPrice && (
                                    <p className="text-[9px] text-red-400 font-extrabold mt-1">Price is below cost!</p>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400">Badge Text</label>
                                  <input
                                    type="text"
                                    value={editBadge}
                                    onChange={(e) => setEditBadge(e.target.value.toUpperCase())}
                                    className="w-full bg-[#0d111b] border border-gray-800 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-700"
                                    placeholder="e.g. BEST SELLER"
                                  />
                                </div>
                              </div>
                              <div className="flex space-x-2 pt-1.5">
                                <button
                                  type="button"
                                  disabled={saving || editPrice < pkg.costPrice}
                                  onClick={() => handleSaveEdits(pkg)}
                                  className="flex-1 py-1 rounded-lg bg-cyan-500 text-black text-[10px] font-black uppercase hover:opacity-90 transition disabled:opacity-50"
                                >
                                  {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPkgId(null)}
                                  className="px-3 py-1 rounded-lg bg-gray-800 text-gray-300 text-[10px] font-bold uppercase hover:bg-gray-700 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Standard Pricing & Action Display
                            <>
                              <p className="text-[10px] text-gray-400 line-clamp-1">{pkg.description || 'Fast Automated Fulfillment'}</p>

                              <div className="pt-2 border-t border-gray-800 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">Customer Price:</span>
                                  <strong className="text-white font-bold">${pkg.price.toFixed(2)}</strong>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">G2Bulk Wholesale Cost:</span>
                                  <strong className="text-amber-400 font-semibold">${pkg.costPrice.toFixed(2)}</strong>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800/50">
                                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>Profit Margin (+{marginPercent}%):</span>
                                  </span>
                                  <strong className="text-emerald-400 font-bold">+${margin.toFixed(2)}</strong>
                                </div>
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditing(pkg)}
                                    className="px-3 py-1 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 text-[10px] font-black uppercase border border-gray-800 transition"
                                  >
                                    Edit Settings
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                Select a game from the left sidebar to view categorized packages.
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
