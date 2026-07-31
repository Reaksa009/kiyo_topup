import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, CreditCard, Filter, Flame, Headphones, MessageCircle, Search, ShieldCheck, Sparkles, WalletCards, Zap } from 'lucide-react';
import { HeroBanner } from '../components/HeroBanner';
import { GameCard } from '../components/GameCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiClient } from '../api/client';

const curatedGames = [
  { slug: 'mobile-legends', title: 'Mobile Legends', publisher: 'Moonton', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'MOBA', slug: 'moba' }, discount: 'Up to 15% off' },
  { slug: 'free-fire', title: 'Free Fire', publisher: 'Garena', thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'Battle Royale', slug: 'battle-royale' }, discount: 'Bonus diamonds' },
  { slug: 'pubg-mobile', title: 'PUBG Mobile', publisher: 'Tencent Games', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'Battle Royale', slug: 'battle-royale' }, discount: 'Best value' },
  { slug: 'honor-of-kings', title: 'Honor of Kings', publisher: 'Level Infinite', thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'MOBA', slug: 'moba' }, discount: 'New' },
  { slug: 'genshin-impact', title: 'Genshin Impact', publisher: 'HoYoverse', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'RPG', slug: 'rpg' }, discount: 'Coming soon', comingSoon: true },
  { slug: 'valorant', title: 'Valorant', publisher: 'Riot Games', thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'Shooter', slug: 'shooter' }, discount: 'Popular' },
  { slug: 'roblox', title: 'Roblox', publisher: 'Roblox Corporation', thumbnail: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'Entertainment', slug: 'entertainment' }, discount: 'Coming soon', comingSoon: true },
  { slug: 'steam-wallet', title: 'Steam Wallet', publisher: 'Steam', thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=85', categoryId: { name: 'Gift Cards', slug: 'gift-cards' }, discount: 'Coming soon', comingSoon: true }
];

const processSteps = [
  { number: '01', title: 'Select your game', text: 'Choose from our growing catalog of popular games.', icon: Filter },
  { number: '02', title: 'Enter Player ID', text: 'We only need the ID used to deliver your credits.', icon: BadgeCheck },
  { number: '03', title: 'Pick a package', text: 'Compare bonuses and choose the best value.', icon: WalletCards },
  { number: '04', title: 'Pay securely', text: 'Confirm with KHQR, ABA or your favorite wallet.', icon: CreditCard }
];

export const Home: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, catRes] = await Promise.all([apiClient.get('/games'), apiClient.get('/games/categories')]);
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

  const catalog = useMemo(() => curatedGames.map((curated) => ({ ...curated, ...(games.find((game) => game.slug === curated.slug) || {}), comingSoon: curated.comingSoon && !games.some((game) => game.slug === curated.slug) })), [games]);
  const filteredGames = catalog.filter((game) => {
    const matchesSearch = !search || game.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || game.categoryId?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070a12] text-slate-100">
      <Navbar />
      <main>
        <div className="section-shell"><HeroBanner /></div>

        <section className="section-shell -mt-3 relative z-10"><div className="surface-card grid gap-4 p-4 sm:grid-cols-3 sm:p-5"><div className="flex items-center gap-3"><span className="rounded-2xl bg-emerald-300/[0.1] p-2.5 text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-xs font-black text-white">Trusted by 12,000+ players</p><p className="mt-0.5 text-[10px] text-slate-500">Real orders. Real support.</p></div></div><div className="flex items-center gap-3 border-white/[0.08] sm:border-l sm:pl-5"><span className="rounded-2xl bg-cyan-300/[0.1] p-2.5 text-cyan-200"><Clock3 className="h-5 w-5" /></span><div><p className="text-xs font-black text-white">Average delivery under 10 sec</p><p className="mt-0.5 text-[10px] text-slate-500">Automated provider fulfillment.</p></div></div><div className="flex items-center gap-3 border-white/[0.08] sm:border-l sm:pl-5"><span className="rounded-2xl bg-violet-300/[0.1] p-2.5 text-violet-200"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-xs font-black text-white">Secure payment options</p><p className="mt-0.5 text-[10px] text-slate-500">ABA, KHQR and local wallets.</p></div></div></div></section>

        <section id="games" className="section-shell scroll-mt-24 py-20"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><span className="eyebrow">TOP-UP, YOUR WAY</span><h2 className="display-title mt-2">Popular games</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Everything you need to keep playing. Browse curated offers, compare package value and top up in a few simple steps.</p></div><div className="relative w-full md:w-72"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search games" className="w-full rounded-2xl border bg-white/[0.04] py-3 pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50" /></div></div><div className="mt-8 flex gap-2 overflow-x-auto pb-1">{[{ slug: 'all', name: 'All games' }, ...categories].map((category) => <button key={category.slug} type="button" onClick={() => setSelectedCategory(category.slug)} className={`whitespace-nowrap rounded-xl border px-4 py-2 text-[11px] font-black transition ${selectedCategory === category.slug ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-100' : 'border-white/[0.08] bg-white/[0.025] text-slate-400 hover:text-white'}`}>{category.name}</button>)}</div>{loading ? <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-3xl bg-white/[0.04]" />)}</div> : <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{filteredGames.map((game) => <GameCard key={game.slug} game={game} />)}</div>}{!loading && filteredGames.length === 0 && <div className="surface-card mt-8 py-16 text-center"><Search className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-3 text-sm font-bold text-white">No games match your search</p><button type="button" onClick={() => { setSearch(''); setSelectedCategory('all'); }} className="mt-4 text-xs font-bold text-cyan-200 hover:text-white">Clear filters</button></div>}</section>

        <section className="border-y border-white/[0.07] bg-white/[0.018] py-20"><div className="section-shell"><div className="text-center"><span className="eyebrow">SIMPLE BY DESIGN</span><h2 className="display-title mt-2">Top up in four steps</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">No account passwords. No confusing forms. Just a secure player ID and a few taps.</p></div><div className="mt-10 grid gap-4 md:grid-cols-4">{processSteps.map(({ number, title, text, icon: Icon }) => <div key={number} className="surface-card relative p-5"><span className="text-[10px] font-black tracking-[0.18em] text-cyan-300">{number}</span><span className="mt-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/[0.16] to-violet-400/[0.12] text-cyan-200"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-sm font-black text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>{number !== '04' && <ArrowRight className="absolute right-4 top-1/2 hidden h-4 w-4 text-slate-600 md:block" />}</div>)}</div></div></section>

        <section className="section-shell py-16"><div className="surface-card flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between"><div><span className="eyebrow">PAY YOUR WAY</span><h2 className="mt-2 text-2xl font-black text-white">Local payment methods, one secure checkout.</h2><p className="mt-2 text-xs text-slate-500">Prices are shown in USD with an approximate Khmer Riel conversion.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{['ABA Pay', 'KHQR', 'Wing', 'TrueMoney', 'Pi Pay', 'Bank transfer', 'Crypto'].map((method) => <span key={method} className="flex min-h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-center text-[10px] font-black text-slate-300">{method}</span>)}</div></div></section>

        <section className="section-shell py-20"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="eyebrow">DON'T MISS OUT</span><h2 className="display-title mt-2">Weekly promotions</h2><p className="mt-3 text-sm text-slate-400">Limited-time value drops for your favorite games.</p></div><Link to="/promotions" className="btn-secondary self-start sm:self-auto">View all offers<ArrowRight className="h-4 w-4" /></Link></div><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 to-blue-600/5 p-6"><Sparkles className="absolute right-5 top-5 h-16 w-16 text-cyan-200/15" /><span className="eyebrow">MOBILE LEGENDS</span><h3 className="mt-5 max-w-[13rem] text-2xl font-black text-white">Extra diamonds on every pass</h3><p className="mt-3 text-xs leading-5 text-slate-300">Save up to 15% on selected weekly packages.</p><Link to="/game/mobile-legends" className="mt-6 inline-flex items-center gap-1 text-xs font-black text-cyan-200">Shop offer<ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="relative overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-400/15 to-fuchsia-600/5 p-6"><Flame className="absolute right-5 top-5 h-16 w-16 text-violet-200/15" /><span className="eyebrow text-violet-200">FLASH SALE</span><h3 className="mt-5 max-w-[13rem] text-2xl font-black text-white">Weekend gamer deal</h3><p className="mt-3 text-xs leading-5 text-slate-300">Use code <strong className="text-white">PLAYMORE</strong> for $1 off.</p><Link to="/promotions" className="mt-6 inline-flex items-center gap-1 text-xs font-black text-violet-200">Claim coupon<ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-300/15 to-orange-600/5 p-6"><Zap className="absolute right-5 top-5 h-16 w-16 text-amber-200/15" /><span className="eyebrow text-amber-200">LOYALTY REWARDS</span><h3 className="mt-5 max-w-[13rem] text-2xl font-black text-white">Play often, save more</h3><p className="mt-3 text-xs leading-5 text-slate-300">Earn wallet bonuses with every completed order.</p><Link to="/register" className="mt-6 inline-flex items-center gap-1 text-xs font-black text-amber-200">Join Kiyo<ArrowRight className="h-3.5 w-3.5" /></Link></div></div></section>

        <section className="section-shell pb-20"><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="surface-card p-7 sm:p-9"><span className="eyebrow">WHY KIYO</span><h2 className="display-title mt-2 max-w-lg">A store you can trust with your game time.</h2><div className="mt-8 grid gap-5 sm:grid-cols-2">{[{ icon: Zap, title: 'Fast delivery', text: 'Automated fulfillment gets credits moving in seconds.' }, { icon: ShieldCheck, title: 'Secure by default', text: 'We never ask for passwords or sensitive login details.' }, { icon: Headphones, title: 'Always here', text: 'Real support through Telegram whenever you need it.' }, { icon: WalletCards, title: 'Fair pricing', text: 'Clear USD pricing, bonuses and competitive packages.' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-cyan-200"><Icon className="h-4 w-4" /></span><div><h3 className="text-xs font-black text-white">{title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p></div></div>)}</div></div><div className="surface-card flex flex-col justify-between bg-gradient-to-br from-cyan-300/[0.1] via-white/[0.025] to-violet-400/[0.12] p-7 sm:p-9"><div><span className="eyebrow">REAL PLAYERS, REAL FEEDBACK</span><div className="mt-5 flex gap-1 text-amber-300">{Array.from({ length: 5 }).map((_, index) => <Sparkles key={index} className="h-4 w-4 fill-current" />)}</div><blockquote className="mt-5 text-xl font-black leading-8 text-white">“Top up arrived before I could close the payment screen. Super clean experience.”</blockquote><p className="mt-5 text-xs font-bold text-slate-400">— Dara, Mobile Legends player</p></div><div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/[0.1] pt-5"><div><p className="text-2xl font-black text-white">12k+</p><p className="text-[10px] text-slate-500">Happy players</p></div><div><p className="text-2xl font-black text-white">4.9/5</p><p className="text-[10px] text-slate-500">Average rating</p></div><div><p className="text-2xl font-black text-white">99.8%</p><p className="text-[10px] text-slate-500">Success rate</p></div></div></div></div></section>
      </main>

      <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-2 sm:right-6"><a href="https://t.me/VReaksa" target="_blank" rel="noreferrer" aria-label="Chat on Telegram" className="floating-support flex h-12 w-12 items-center justify-center rounded-2xl bg-[#229ED9] text-white transition hover:scale-105"><SendIcon /></a><Link to="/contact" aria-label="Open customer support" className="floating-support flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white transition hover:scale-105"><MessageCircle className="h-5 w-5" /></Link></div>
      <Footer />
    </div>
  );
};

const SendIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M21.8 3.2 18.6 20c-.2 1.2-.9 1.5-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 13.7l-4.9-1.6c-1.1-.3-1.1-1.1.2-1.6L20.5 2c.9-.3 1.7.2 1.3 1.2Z" /></svg>;
