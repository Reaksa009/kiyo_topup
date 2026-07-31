import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gamepad2,
  Layers3,
  PackageCheck,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  TrendingUp,
  X
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';

interface Category {
  _id?: string;
  name: string;
  slug: string;
}

interface Game {
  _id: string;
  title: string;
  slug: string;
  publisher: string;
  thumbnail: string;
  bannerUrl?: string;
  categoryId?: Category | string;
  status: 'active' | 'maintenance' | 'inactive';
  inputFields?: Array<{ name: string; label: string }>;
}

interface GamePackage {
  _id: string;
  title: string;
  description?: string;
  price: number;
  costPrice: number;
  badge?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  providerType: string;
  providerProductId?: string;
  supplierId?: string;
}

type PackageStatusFilter = 'all' | 'active' | 'inactive';
type BadgeFilter = 'all' | 'bestseller' | 'event' | 'normal';
type SortMode = 'price-asc' | 'price-desc' | 'margin-desc' | 'name';

const PACKAGES_PER_PAGE = 24;

const categoryName = (game: Game) => typeof game.categoryId === 'object'
  ? game.categoryId?.name || 'Game'
  : 'Game';

const categorySlug = (game: Game) => typeof game.categoryId === 'object'
  ? game.categoryId?.slug || ''
  : String(game.categoryId || '');

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;
const signedMoney = (value: number) => `${value >= 0 ? '+' : '-'}$${Math.abs(Number(value || 0)).toFixed(2)}`;

const packageMargin = (pkg: GamePackage) => pkg.price - pkg.costPrice;

const packageMarginPercent = (pkg: GamePackage) => pkg.costPrice > 0
  ? (packageMargin(pkg) / pkg.costPrice) * 100
  : 0;

const badgeTone = (badge?: string) => {
  if (badge === 'BEST SELLER') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (badge === 'EVENT / PASS') return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
  if (badge === 'BEST VALUE') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  return 'border-gray-700 bg-gray-800/70 text-gray-400';
};

const PackageSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="animate-pulse rounded-2xl border border-gray-800 bg-[#0d111a] p-4">
        <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-gray-800" /><div className="flex-1"><div className="h-3 w-48 rounded bg-gray-800" /><div className="mt-2 h-2 w-32 rounded bg-gray-900" /></div><div className="h-8 w-24 rounded-lg bg-gray-800" /></div>
      </div>
    ))}
  </div>
);

export const AdminGames: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [gameQuery, setGameQuery] = useState('');
  const [packageQuery, setPackageQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatusFilter>('all');
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('price-asc');
  const [packagePage, setPackagePage] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [packageLoading, setPackageLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GamePackage | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editBadge, setEditBadge] = useState('');
  const [editStatus, setEditStatus] = useState<GamePackage['status']>('active');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCatalog = async () => {
    setCatalogLoading(true);
    setError('');
    try {
      const [gamesResponse, categoriesResponse] = await Promise.all([
        apiClient.get('/games'),
        apiClient.get('/games/categories')
      ]);
      const loadedGames: Game[] = gamesResponse.data.data || [];
      setGames(loadedGames);
      setCategories(categoriesResponse.data.data || []);
      setSelectedGame((current) => loadedGames.find((game) => game._id === current?._id) || loadedGames[0] || null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load the game catalog.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadPackages = async (gameId: string, quiet = false) => {
    if (!quiet) setPackageLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/packages/admin/game/${gameId}`);
      setPackages(response.data.data || []);
    } catch (requestError: any) {
      setPackages([]);
      setError(requestError.response?.data?.message || 'Unable to load packages from MongoDB.');
    } finally {
      if (!quiet) setPackageLoading(false);
    }
  };

  useEffect(() => { loadCatalog(); }, []);

  useEffect(() => {
    if (!selectedGame?._id) return;
    setPackageQuery('');
    setStatusFilter('all');
    setBadgeFilter('all');
    setPackagePage(1);
    loadPackages(selectedGame._id);
  }, [selectedGame?._id]);

  useEffect(() => { setPackagePage(1); }, [packageQuery, statusFilter, badgeFilter, sortMode]);

  const filteredGames = useMemo(() => games.filter((game) => {
    const query = gameQuery.trim().toLowerCase();
    const matchesSearch = !query || game.title.toLowerCase().includes(query) || game.publisher.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'all' || categorySlug(game) === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [games, gameQuery, selectedCategory]);

  const filteredPackages = useMemo(() => {
    const query = packageQuery.trim().toLowerCase();
    return packages
      .filter((pkg) => {
        const matchesQuery = !query || [pkg.title, pkg.providerProductId, pkg.supplierId]
          .some((value) => String(value || '').toLowerCase().includes(query));
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? pkg.status === 'active' : pkg.status !== 'active');
        const badge = String(pkg.badge || '').toUpperCase();
        const matchesBadge = badgeFilter === 'all'
          || (badgeFilter === 'bestseller' && badge === 'BEST SELLER')
          || (badgeFilter === 'event' && badge === 'EVENT / PASS')
          || (badgeFilter === 'normal' && !['BEST SELLER', 'EVENT / PASS'].includes(badge));
        return matchesQuery && matchesStatus && matchesBadge;
      })
      .sort((a, b) => {
        if (sortMode === 'price-desc') return b.price - a.price;
        if (sortMode === 'margin-desc') return packageMargin(b) - packageMargin(a);
        if (sortMode === 'name') return a.title.localeCompare(b.title);
        return a.price - b.price;
      });
  }, [packages, packageQuery, statusFilter, badgeFilter, sortMode]);

  const activeCount = packages.filter((pkg) => pkg.status === 'active').length;
  const disabledCount = packages.length - activeCount;
  const averageMargin = activeCount > 0
    ? packages.filter((pkg) => pkg.status === 'active').reduce((sum, pkg) => sum + packageMarginPercent(pkg), 0) / activeCount
    : 0;
  const totalPackagePages = Math.max(1, Math.ceil(filteredPackages.length / PACKAGES_PER_PAGE));
  const visiblePackages = filteredPackages.slice((packagePage - 1) * PACKAGES_PER_PAGE, packagePage * PACKAGES_PER_PAGE);

  useEffect(() => {
    if (packagePage > totalPackagePages) setPackagePage(totalPackagePages);
  }, [packagePage, totalPackagePages]);

  const selectGame = (game: Game) => {
    if (game._id === selectedGame?._id) return;
    setSelectedGame(game);
    setNotice('');
    setEditingPackage(null);
  };

  const openEditor = (pkg: GamePackage) => {
    setEditingPackage(pkg);
    setEditPrice(pkg.price);
    setEditBadge(pkg.badge || '');
    setEditStatus(pkg.status);
    setError('');
  };

  const closeEditor = () => {
    if (saving) return;
    setEditingPackage(null);
  };

  const savePackage = async () => {
    if (!editingPackage || editPrice < editingPackage.costPrice) return;
    setSaving(true);
    setError('');
    try {
      const update = { price: editPrice, badge: editBadge, status: editStatus };
      await apiClient.put(`/packages/${editingPackage._id}`, update);
      setPackages((current) => current.map((pkg) => pkg._id === editingPackage._id ? { ...pkg, ...update } : pkg));
      setNotice(`${editingPackage.title} was updated successfully.`);
      setEditingPackage(null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to update this package.');
    } finally {
      setSaving(false);
    }
  };

  const togglePackageStatus = async (pkg: GamePackage) => {
    const nextStatus = pkg.status === 'active' ? 'inactive' : 'active';
    setTogglingId(pkg._id);
    setError('');
    try {
      await apiClient.put(`/packages/${pkg._id}`, { status: nextStatus });
      setPackages((current) => current.map((item) => item._id === pkg._id ? { ...item, status: nextStatus } : item));
      setNotice(`${pkg.title} is now ${nextStatus}.`);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to change package availability.');
    } finally {
      setTogglingId(null);
    }
  };

  const editedMargin = editingPackage ? editPrice - editingPackage.costPrice : 0;
  const editedMarginPercent = editingPackage && editingPackage.costPrice > 0
    ? (editedMargin / editingPackage.costPrice) * 100
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.09] via-[#0b101a] to-purple-500/[0.09] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><Layers3 className="h-4 w-4" /> Catalog workspace</div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Games & Packages</h1>
              <p className="mt-3 text-sm leading-6 text-gray-400">Browse every synced game, review supplier pricing, and keep customer packages clear and profitable.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/operations" className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-950/50 px-4 py-2.5 text-xs font-bold text-gray-300 transition hover:border-purple-500/50 hover:text-purple-300"><Activity className="h-4 w-4" /> Sync Center</Link>
              <button onClick={loadCatalog} disabled={catalogLoading} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-[#061017] transition hover:bg-cyan-300 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${catalogLoading ? 'animate-spin' : ''}`} /> Refresh catalog</button>
            </div>
          </div>
        </section>

        {notice && <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"><Check className="h-4 w-4 shrink-0" />{notice}<button onClick={() => setNotice('')} className="ml-auto text-emerald-400/60 hover:text-emerald-200" aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}
        {error && <div className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"><ShieldCheck className="h-4 w-4 shrink-0" />{error}<button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-200" aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button onClick={() => setSelectedCategory('all')} className={`shrink-0 rounded-xl border px-4 py-2 text-[11px] font-black transition ${selectedCategory === 'all' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200' : 'border-gray-800 bg-gray-950/60 text-gray-500 hover:border-gray-700 hover:text-gray-300'}`}>All games <span className="ml-1 text-[9px] opacity-70">{games.length}</span></button>
          {categories.map((category) => (
            <button key={category._id || category.slug} onClick={() => setSelectedCategory(category.slug)} className={`shrink-0 rounded-xl border px-4 py-2 text-[11px] font-black transition ${selectedCategory === category.slug ? 'border-purple-400/50 bg-purple-400/15 text-purple-200' : 'border-gray-800 bg-gray-950/60 text-gray-500 hover:border-gray-700 hover:text-gray-300'}`}>{category.name}</button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="glass-panel self-start rounded-3xl border border-gray-800/90 p-4 xl:sticky xl:top-24">
            <div className="flex items-center justify-between px-1"><div><h2 className="text-sm font-black text-white">Game library</h2><p className="mt-1 text-[10px] text-gray-500">{filteredGames.length} available</p></div><Gamepad2 className="h-5 w-5 text-cyan-400" /></div>
            <div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" /><input value={gameQuery} onChange={(event) => setGameQuery(event.target.value)} placeholder="Search title or publisher" className="w-full rounded-xl border border-gray-800 bg-[#090d15] py-2.5 pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500/60" /></div>
            <div className="mt-4 grid max-h-[620px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
              {catalogLoading && games.length === 0 ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-gray-900" />) : filteredGames.map((game) => {
                const selected = game._id === selectedGame?._id;
                return (
                  <button key={game._id} onClick={() => selectGame(game)} className={`group flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? 'border-cyan-400/40 bg-gradient-to-r from-cyan-400/[0.13] to-purple-500/[0.08] shadow-lg shadow-cyan-950/20' : 'border-transparent bg-[#0d121c] hover:border-gray-700 hover:bg-[#111824]'}`}>
                    <div className="relative shrink-0"><img src={game.thumbnail} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10" /><span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0d121c] ${game.status === 'active' ? 'bg-emerald-400' : game.status === 'maintenance' ? 'bg-amber-400' : 'bg-gray-600'}`} /></div>
                    <div className="min-w-0 flex-1"><p className={`truncate text-xs font-black ${selected ? 'text-white' : 'text-gray-200'}`}>{game.title}</p><p className="mt-1 truncate text-[10px] text-gray-500">{game.publisher}</p><p className={`mt-1.5 text-[9px] font-bold uppercase tracking-wider ${selected ? 'text-cyan-300' : 'text-gray-600'}`}>{categoryName(game)}</p></div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition ${selected ? 'text-cyan-300' : 'text-gray-700 group-hover:text-gray-400'}`} />
                  </button>
                );
              })}
              {!catalogLoading && filteredGames.length === 0 && <div className="py-10 text-center text-xs text-gray-600 sm:col-span-2 xl:col-span-1">No games match this filter.</div>}
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            {selectedGame ? (
              <>
                <section className="relative overflow-hidden rounded-3xl border border-gray-800 bg-[#0b1019]">
                  <div className="absolute inset-0"><img src={selectedGame.bannerUrl || selectedGame.thumbnail} alt="" className="h-full w-full object-cover opacity-20" /><div className="absolute inset-0 bg-gradient-to-r from-[#090d15] via-[#090d15]/95 to-[#090d15]/55" /></div>
                  <div className="relative p-5 sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4"><img src={selectedGame.thumbnail} alt={selectedGame.title} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-cyan-400/30 sm:h-20 sm:w-20" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-purple-400/25 bg-purple-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-purple-300">{categoryName(selectedGame)}</span><span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">{selectedGame.status}</span></div><h2 className="mt-2 truncate text-xl font-black text-white sm:text-2xl">{selectedGame.title}</h2><p className="mt-1 text-xs text-gray-400">{selectedGame.publisher}</p></div></div>
                      <div className="flex flex-wrap gap-2">{(selectedGame.inputFields || []).map((field) => <span key={field.name} className="rounded-xl border border-gray-700/80 bg-black/25 px-3 py-2 text-[10px] font-bold text-gray-300">{field.label}</span>)}{!selectedGame.inputFields?.length && <span className="rounded-xl border border-gray-700/80 bg-black/25 px-3 py-2 text-[10px] font-bold text-gray-400">Player account ID</span>}</div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: 'Total packages', value: packages.length, icon: Boxes, tone: 'text-cyan-300', surface: 'border-cyan-500/15' },
                    { label: 'Available now', value: activeCount, icon: PackageCheck, tone: 'text-emerald-300', surface: 'border-emerald-500/15' },
                    { label: 'Unavailable', value: disabledCount, icon: Layers3, tone: 'text-gray-400', surface: 'border-gray-700' },
                    { label: 'Avg. margin', value: `${averageMargin.toFixed(1)}%`, icon: TrendingUp, tone: averageMargin >= 0 ? 'text-purple-300' : 'text-red-300', surface: 'border-purple-500/15' }
                  ].map(({ label, value, icon: Icon, tone, surface }) => <div key={label} className={`rounded-2xl border bg-[#0b1019] p-4 ${surface}`}><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-wider text-gray-600">{label}</p><Icon className={`h-4 w-4 ${tone}`} /></div><p className="mt-3 text-xl font-black text-white sm:text-2xl">{value}</p></div>)}
                </section>

                <section className="glass-panel rounded-3xl border border-gray-800/90">
                  <div className="border-b border-gray-800/80 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                      <div><div className="flex items-center gap-2"><Tag className="h-4 w-4 text-cyan-400" /><h3 className="text-sm font-black text-white">Package catalog</h3></div><p className="mt-1 text-[10px] text-gray-500">Edit storefront price, badge, and availability.</p></div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <div className="relative min-w-0 sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-600" /><input value={packageQuery} onChange={(event) => setPackageQuery(event.target.value)} placeholder="Package, product or supplier ID" className="w-full rounded-xl border border-gray-800 bg-[#090d15] py-2 pl-9 pr-8 text-xs text-white outline-none focus:border-cyan-500/60" />{packageQuery && <button onClick={() => setPackageQuery('')} className="absolute right-2.5 top-2.5 text-gray-600 hover:text-white" aria-label="Clear package search"><X className="h-4 w-4" /></button>}</div>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PackageStatusFilter)} className="rounded-xl border border-gray-800 bg-[#090d15] px-3 py-2 text-xs font-bold text-gray-300 outline-none focus:border-cyan-500/60"><option value="all">All status</option><option value="active">Available</option><option value="inactive">Unavailable</option></select>
                        <select value={badgeFilter} onChange={(event) => setBadgeFilter(event.target.value as BadgeFilter)} className="rounded-xl border border-gray-800 bg-[#090d15] px-3 py-2 text-xs font-bold text-gray-300 outline-none focus:border-cyan-500/60"><option value="all">All packages</option><option value="bestseller">Best sellers</option><option value="event">Events & passes</option><option value="normal">Normal</option></select>
                        <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="rounded-xl border border-gray-800 bg-[#090d15] px-3 py-2 text-xs font-bold text-gray-300 outline-none focus:border-cyan-500/60"><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="margin-desc">Highest profit</option><option value="name">Name A–Z</option></select>
                        <button onClick={() => loadPackages(selectedGame._id)} disabled={packageLoading} className="rounded-xl border border-gray-800 bg-[#090d15] p-2 text-gray-500 hover:border-gray-700 hover:text-white disabled:opacity-40" title="Refresh packages"><RefreshCw className={`h-4 w-4 ${packageLoading ? 'animate-spin' : ''}`} /></button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-5">
                    {packageLoading ? <PackageSkeleton /> : filteredPackages.length === 0 ? (
                      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 text-center"><SlidersHorizontal className="h-9 w-9 text-gray-700" /><p className="mt-3 text-sm font-bold text-gray-300">No packages found</p><p className="mt-1 max-w-sm text-xs text-gray-600">Try another search, status, or package type.</p><button onClick={() => { setPackageQuery(''); setStatusFilter('all'); setBadgeFilter('all'); }} className="mt-4 text-xs font-bold text-cyan-400 hover:text-cyan-300">Clear all filters</button></div>
                    ) : (
                      <div className="space-y-2">
                        <div className="hidden grid-cols-[minmax(220px,1.5fr)_100px_100px_110px_100px_76px] gap-4 px-4 pb-2 text-[9px] font-black uppercase tracking-[0.14em] text-gray-600 lg:grid"><span>Package</span><span>Retail</span><span>Cost</span><span>Profit</span><span>Status</span><span className="text-right">Edit</span></div>
                        {visiblePackages.map((pkg) => {
                          const margin = packageMargin(pkg);
                          const marginPercent = packageMarginPercent(pkg);
                          return (
                            <article key={pkg._id} className={`group rounded-2xl border bg-[#0b1019] p-4 transition hover:border-gray-700 hover:bg-[#0e1520] ${pkg.status === 'active' ? 'border-gray-800/90' : 'border-gray-800/60 opacity-75'}`}>
                              <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr)_100px_100px_110px_100px_76px] lg:items-center">
                                <div className="flex min-w-0 items-start gap-3"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${pkg.badge === 'EVENT / PASS' ? 'bg-purple-500/10 text-purple-300' : pkg.badge === 'BEST SELLER' ? 'bg-amber-500/10 text-amber-300' : 'bg-cyan-500/[0.08] text-cyan-400'}`}><Sparkles className="h-4 w-4" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="truncate text-xs font-black text-white">{pkg.title}</h4>{pkg.badge && <span className={`rounded-md border px-2 py-0.5 text-[8px] font-black uppercase ${badgeTone(pkg.badge)}`}>{pkg.badge}</span>}</div><p className="mt-1 truncate font-mono text-[9px] text-gray-600">{pkg.providerType} · {pkg.providerProductId || 'No product ID'}</p></div></div>
                                <div className="grid grid-cols-3 gap-3 lg:contents"><div><p className="text-[9px] uppercase text-gray-600 lg:hidden">Retail</p><p className="mt-1 text-sm font-black text-white lg:mt-0">{money(pkg.price)}</p></div><div><p className="text-[9px] uppercase text-gray-600 lg:hidden">Cost</p><p className="mt-1 text-sm font-bold text-amber-300 lg:mt-0">{money(pkg.costPrice)}</p></div><div><p className="text-[9px] uppercase text-gray-600 lg:hidden">Profit</p><p className={`mt-1 text-sm font-black lg:mt-0 ${margin >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{signedMoney(margin)} <span className="block text-[9px] font-bold opacity-60">{marginPercent.toFixed(1)}%</span></p></div></div>
                                <button onClick={() => togglePackageStatus(pkg)} disabled={togglingId === pkg._id} className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-black uppercase transition disabled:opacity-50 ${pkg.status === 'active' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:text-white'}`}>{togglingId === pkg._id ? 'Saving…' : pkg.status === 'active' ? 'Available' : pkg.status.replace(/_/g, ' ')}</button>
                                <button onClick={() => openEditor(pkg)} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-[10px] font-black text-gray-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 lg:w-auto"><PencilLine className="h-3.5 w-3.5" /> Edit</button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!packageLoading && filteredPackages.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-gray-800/80 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between"><p>Showing <span className="font-bold text-gray-300">{(packagePage - 1) * PACKAGES_PER_PAGE + 1}–{Math.min(packagePage * PACKAGES_PER_PAGE, filteredPackages.length)}</span> of <span className="font-bold text-gray-300">{filteredPackages.length}</span></p><div className="flex items-center gap-2"><button onClick={() => setPackagePage((page) => Math.max(1, page - 1))} disabled={packagePage === 1} className="rounded-xl border border-gray-800 p-2 text-gray-400 hover:border-gray-700 hover:text-white disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-24 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Page {packagePage} of {totalPackagePages}</span><button onClick={() => setPackagePage((page) => Math.min(totalPackagePages, page + 1))} disabled={packagePage === totalPackagePages} className="rounded-xl border border-gray-800 p-2 text-gray-400 hover:border-gray-700 hover:text-white disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div></div>
                  )}
                </section>
              </>
            ) : (
              <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-800 bg-[#090d15] text-center"><Gamepad2 className="h-12 w-12 text-gray-700" /><h2 className="mt-4 text-lg font-black text-white">Select a game</h2><p className="mt-2 text-sm text-gray-600">Choose a title from the game library to manage its packages.</p></div>
            )}
          </div>
        </div>
      </div>

      {editingPackage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="package-editor-title">
          <button className="absolute inset-0" onClick={closeEditor} aria-label="Close package editor" />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#0b1019] shadow-2xl shadow-black/70">
            <div className="border-b border-gray-800 bg-gradient-to-r from-cyan-500/[0.08] to-purple-500/[0.08] p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Package settings</p><h2 id="package-editor-title" className="mt-2 truncate text-xl font-black text-white">{editingPackage.title}</h2><p className="mt-1 truncate font-mono text-[10px] text-gray-500">{editingPackage.providerType} · {editingPackage.providerProductId || 'No product ID'}</p></div><button onClick={closeEditor} disabled={saving} className="rounded-xl border border-gray-700 bg-gray-900 p-2 text-gray-500 hover:text-white disabled:opacity-40" aria-label="Close"><X className="h-4 w-4" /></button></div></div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-3 gap-3"><div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-3"><p className="text-[9px] uppercase tracking-wider text-gray-600">Supplier cost</p><p className="mt-2 text-lg font-black text-amber-300">{money(editingPackage.costPrice)}</p></div><div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-3"><p className="text-[9px] uppercase tracking-wider text-gray-600">New profit</p><p className={`mt-2 text-lg font-black ${editedMargin >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{signedMoney(editedMargin)}</p></div><div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-3"><p className="text-[9px] uppercase tracking-wider text-gray-600">Margin</p><p className={`mt-2 text-lg font-black ${editedMargin >= 0 ? 'text-purple-300' : 'text-red-300'}`}>{editedMarginPercent.toFixed(1)}%</p></div></div>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400"><CircleDollarSign className="h-4 w-4 text-cyan-400" /> Customer price</span><div className="relative"><span className="absolute left-4 top-3 text-sm font-black text-gray-500">$</span><input type="number" min={editingPackage.costPrice} step="0.01" value={editPrice} onChange={(event) => setEditPrice(Number(event.target.value))} className={`w-full rounded-2xl border bg-[#080c13] py-3 pl-8 pr-4 text-lg font-black text-white outline-none ${editPrice < editingPackage.costPrice ? 'border-red-500/60' : 'border-gray-700 focus:border-cyan-500'}`} /></div>{editPrice < editingPackage.costPrice && <p className="mt-2 text-[10px] font-bold text-red-300">Customer price cannot be below the supplier cost of {money(editingPackage.costPrice)}.</p>}</label>
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400"><BadgeDollarSign className="h-4 w-4 text-purple-400" /> Store badge</span><select value={editBadge} onChange={(event) => setEditBadge(event.target.value)} className="w-full rounded-2xl border border-gray-700 bg-[#080c13] px-4 py-3 text-xs font-bold text-white outline-none focus:border-purple-500"><option value="">Normal package</option><option value="BEST SELLER">Best seller</option><option value="BEST VALUE">Best value</option><option value="EVENT / PASS">Event / Pass</option></select></label><label><span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400"><PackageCheck className="h-4 w-4 text-emerald-400" /> Availability</span><select value={editStatus} onChange={(event) => setEditStatus(event.target.value as GamePackage['status'])} className="w-full rounded-2xl border border-gray-700 bg-[#080c13] px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500"><option value="active">Available</option><option value="inactive">Inactive</option><option value="out_of_stock">Out of stock</option></select></label></div>
              <div className="flex flex-col-reverse gap-3 border-t border-gray-800 pt-5 sm:flex-row sm:justify-end"><button onClick={closeEditor} disabled={saving} className="rounded-xl border border-gray-700 px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-40">Cancel</button><button onClick={savePackage} disabled={saving || editPrice < editingPackage.costPrice} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? 'Saving package…' : 'Save changes'}</button></div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
