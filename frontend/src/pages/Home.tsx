import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { HeroBanner } from '../components/HeroBanner';
import { GameCard } from '../components/GameCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiClient } from '../api/client';
import { SeoMeta } from '../components/SeoMeta';
import type { PublicBannerDTO, PublicGameDTO } from '../types/catalog';
import { useTranslation } from 'react-i18next';

const curatedGames: Array<PublicGameDTO & { discount?: string; comingSoon?: boolean }> = [
  { slug: 'mobile-legends', title: 'Mobile Legends', publisher: 'Moonton', thumbnail: '/images/mlbb-card.png', categoryId: { name: 'MOBA', slug: 'moba' }, discount: 'Up to 15% off' },
  { slug: 'free-fire', title: 'Free Fire', publisher: 'Garena', thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=640&q=78', categoryId: { name: 'Battle Royale', slug: 'battle-royale' }, discount: 'Bonus diamonds' },
  { slug: 'pubg-mobile', title: 'PUBG Mobile', publisher: 'Tencent Games', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&q=78', categoryId: { name: 'Battle Royale', slug: 'battle-royale' }, discount: 'Best value' },
  { slug: 'honor-of-kings', title: 'Honor of Kings', publisher: 'Level Infinite', thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=640&q=78', categoryId: { name: 'MOBA', slug: 'moba' }, discount: 'New' },
  { slug: 'genshin-impact', title: 'Genshin Impact', publisher: 'HoYoverse', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=640&q=78', categoryId: { name: 'RPG', slug: 'rpg' }, discount: 'Coming soon', comingSoon: true },
  { slug: 'valorant', title: 'Valorant', publisher: 'Riot Games', thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=640&q=78', categoryId: { name: 'Shooter', slug: 'shooter' }, discount: 'Popular' },
  { slug: 'roblox', title: 'Roblox', publisher: 'Roblox Corporation', thumbnail: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&w=640&q=78', categoryId: { name: 'Entertainment', slug: 'entertainment' }, discount: 'Coming soon', comingSoon: true },
  { slug: 'steam-wallet', title: 'Steam Wallet', publisher: 'Steam', thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=640&q=78', categoryId: { name: 'Gift Cards', slug: 'gift-cards' }, discount: 'Coming soon', comingSoon: true }
].map((game) => ({ ...game, isPurchasable: false }));

const HOME_GAMES_CACHE_KEY = 'kiyo-home-games-v1';

const readCachedGames = (): any[] => {
  try {
    const cached = sessionStorage.getItem(HOME_GAMES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const getCategoriesFromGames = (games: any[]) => Array.from(
  new Map(
    games
      .map((game) => game.categoryId)
      .filter((category) => category && typeof category === 'object' && category.slug)
      .map((category) => [category.slug, category])
  ).values()
);

const highlights = [
  { icon: CheckCircle2, title: '12K+ Players', text: 'Trusted in Cambodia', tone: 'text-emerald-300 bg-emerald-300/[0.1]' },
  { icon: Clock3, title: 'Under 10 Sec', text: 'Average delivery', tone: 'text-cyan-200 bg-cyan-300/[0.1]' },
  { icon: ShieldCheck, title: 'Secure Pay', text: 'KHQR and local banks', tone: 'text-violet-200 bg-violet-300/[0.1]' }
];

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState<PublicGameDTO[]>(readCachedGames);
  const [banners, setBanners] = useState<PublicBannerDTO[]>([]);
  const [catalogueError, setCatalogueError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(() => readCachedGames().length === 0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchGames = async () => {
      try {
        const [gamesResponse, bannersResponse] = await Promise.allSettled([
          apiClient.get('/games', { signal: controller.signal }),
          apiClient.get('/cms/banners', { signal: controller.signal })
        ]);
        if (gamesResponse.status !== 'fulfilled') throw gamesResponse.reason;
        const freshGames: PublicGameDTO[] = gamesResponse.value.data.data || [];
        setGames(freshGames);
        sessionStorage.setItem(HOME_GAMES_CACHE_KEY, JSON.stringify(freshGames));
        if (bannersResponse.status === 'fulfilled') setBanners(bannersResponse.value.data.data || []);
        else setBannerError(true);
      } catch (error: any) {
        if (error?.name !== 'CanceledError') setCatalogueError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchGames();
    return () => controller.abort();
  }, []);

  const catalog = useMemo(() => curatedGames.map((curated) => {
    const liveGame = games.find((game) => game.slug === curated.slug);
    return {
      ...curated,
      ...(liveGame || {}),
      categoryId: liveGame && typeof liveGame.categoryId === 'object' ? liveGame.categoryId : curated.categoryId,
      comingSoon: curated.comingSoon && !liveGame
    };
  }), [games]);

  const categories = useMemo(() => getCategoriesFromGames(catalog), [catalog]);
  const filteredGames = catalog.filter((game) => {
    const matchesSearch = !search || game.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (typeof game.categoryId === 'object' && game.categoryId?.slug === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#071024] text-slate-100">
      <SeoMeta title="Kiyo Topup | Instant Game Top-Up" description="Secure game top-ups for Cambodia." canonicalPath="/" />
      <Navbar />
      <main>
        <div className="section-shell !px-2 sm:!px-6 lg:!px-8"><HeroBanner banners={banners} loading={loading && banners.length === 0} hasError={bannerError} /></div>

        <section className="section-shell mt-3">
          <div className="grid grid-cols-3 divide-x divide-white/[0.08] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1730] shadow-lg shadow-black/15">
            {highlights.map(({ icon: Icon, title, text, tone }) => (
              <div key={title} className="flex min-w-0 items-center justify-center gap-1.5 px-1.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${tone}`}><Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></span>
                <div className="min-w-0"><p className="truncate text-[7px] font-black text-white sm:text-[10px]">{title}</p><p className="mt-0.5 hidden truncate text-[8px] text-slate-600 sm:block">{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="games" className="section-shell scroll-mt-20 py-10 sm:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">{t('customer.gameCatalog')}</span>
              <div className="mt-1.5 flex items-center gap-2"><h2 className="text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">{t('customer.popularGames')}</h2><ArrowRight className="h-5 w-5 text-cyan-300" /></div>
              <p className="mt-2 max-w-lg text-[11px] leading-5 text-slate-500 sm:text-xs">{t('customer.chooseGame')}</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-600" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('customer.searchGames')} aria-label={t('customer.searchGames')} className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#0a1730] pl-9 pr-3 text-[10px] text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50" />
            </div>
          </div>

          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-5">
            {[{ slug: 'all', name: t('customer.allGames') }, ...categories].map((category: any) => (
              <button key={category.slug} type="button" onClick={() => setSelectedCategory(category.slug)} className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-[8px] font-black transition sm:text-[9px] ${selectedCategory === category.slug ? 'border-cyan-300/50 bg-cyan-300/[0.12] text-cyan-100' : 'border-white/[0.08] bg-white/[0.025] text-slate-500 hover:text-white'}`}>{category.name}</button>
            ))}
          </div>

          {loading ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 xl:grid-cols-8">
              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[.58/1] animate-pulse rounded-xl bg-white/[0.04] sm:rounded-2xl" />)}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 xl:grid-cols-8">
              {filteredGames.map((game) => <GameCard key={game.slug} game={game} />)}
            </div>
          )}

          {catalogueError && <div role="status" className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-3 py-2 text-xs text-amber-100">{t('customer.catalogueUnavailable')}</div>}

          {!loading && filteredGames.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.025] py-10 text-center"><Search className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-2 text-xs font-bold text-white">{t('customer.noGames')}</p><button type="button" onClick={() => { setSearch(''); setSelectedCategory('all'); }} className="mt-3 text-[10px] font-black text-cyan-200">{t('customer.clearFilters')}</button></div>
          )}
        </section>

        <section className="border-y border-white/[0.07] bg-[#09152d] py-9 sm:py-12">
          <div className="section-shell">
            <div className="flex items-end justify-between gap-4"><div><span className="eyebrow">UPDATES & EVENTS</span><p className="mt-1 text-[10px] text-slate-600">Fresh value for your favorite games</p></div><Link to="/promotions" className="text-[9px] font-black uppercase text-cyan-200">View all</Link></div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4">
              <Link to="/game/mobile-legends" className="group relative aspect-[2.25/1] overflow-hidden rounded-xl border border-cyan-300/20 sm:rounded-2xl">
                <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=78" alt="Mobile Legends event" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#06132b]/95 via-[#06132b]/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-2.5 sm:p-5"><span className="text-[5px] font-black uppercase tracking-widest text-cyan-300 sm:text-[8px]">Mobile Legends</span><h3 className="mt-1 max-w-[8rem] text-[9px] font-black leading-3 text-white sm:max-w-xs sm:text-lg sm:leading-6">Weekly pass value drop</h3></div>
              </Link>
              <Link to="/promotions" className="group relative aspect-[2.25/1] overflow-hidden rounded-xl border border-violet-300/20 sm:rounded-2xl">
                <img src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=900&q=78" alt="Weekend game promotion" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#150b2b]/95 via-[#150b2b]/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-2.5 sm:p-5"><span className="text-[5px] font-black uppercase tracking-widest text-violet-300 sm:text-[8px]">Weekend Event</span><h3 className="mt-1 max-w-[8rem] text-[9px] font-black leading-3 text-white sm:max-w-xs sm:text-lg sm:leading-6">Bonus credits are live</h3></div>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <div className="fixed bottom-4 right-3 z-40 flex flex-col gap-2 sm:right-5">
        <a href="https://t.me/VReaksa" target="_blank" rel="noreferrer" aria-label="Chat on Telegram" className="floating-support flex h-11 w-11 items-center justify-center rounded-full bg-[#229ED9] text-white transition hover:scale-105"><Send className="h-4 w-4" /></a>
        <Link to="/contact" aria-label="Open customer support" className="floating-support flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 text-white transition hover:scale-105"><MessageCircle className="h-4 w-4" /></Link>
      </div>
      <Footer />
    </div>
  );
};
