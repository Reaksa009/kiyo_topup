import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Globe2, Headphones, History, LogIn, Menu, Send, Tag, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItem = 'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white';

export const Navbar: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const languageLabel = i18n.language.toLowerCase().startsWith('km') ? 'KM' : 'EN';
  const toggleLanguage = () => i18n.changeLanguage(languageLabel === 'KM' ? 'en' : 'km');
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const isGamesActive = location.pathname.startsWith('/game') || location.hash === '#games';

  useEffect(() => closeMobileMenu(), [location.pathname, location.hash]);

  const handleGamesClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      event.preventDefault();
      document.getElementById('games')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeMobileMenu();
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => `${navItem} ${isActive ? 'bg-cyan-300/[0.1] text-cyan-200' : ''}`;

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-clip border-b border-cyan-300/20 bg-[#07152d]/95 shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="section-shell flex h-16 min-w-0 items-center justify-between gap-3">
        <Link to="/" onClick={closeMobileMenu} className="group flex min-w-0 items-center gap-2.5" aria-label="Kiyo Topup home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-[#0a1b3a] text-cyan-200 shadow-[0_0_22px_rgba(98,230,255,0.15)] transition group-hover:border-cyan-200/60">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block whitespace-nowrap text-[14px] font-black tracking-[0.12em] text-white sm:text-base">KIYO<span className="text-cyan-300"> TOPUP</span></span>
            <span className="hidden text-[7px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:block">Fast credits for every game</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary navigation">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <Link to="/#games" onClick={handleGamesClick} className={`${navItem} ${isGamesActive ? 'bg-cyan-300/[0.1] text-cyan-200' : ''}`}><Gamepad2 className="h-3.5 w-3.5" />Games</Link>
          <NavLink to="/promotions" className={linkClass}><Tag className="h-3.5 w-3.5" />Promotions</NavLink>
          <NavLink to="/history" className={linkClass}><History className="h-3.5 w-3.5" />History</NavLink>
          <NavLink to="/support" className={linkClass}><Headphones className="h-3.5 w-3.5" />Support</NavLink>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <button type="button" onClick={toggleLanguage} className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[9px] font-black text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200" aria-label="Change language"><Globe2 className="h-3.5 w-3.5" />{languageLabel}</button>
          {user ? (
            <Link to="/profile" className="flex h-9 items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] px-3 text-[10px] font-black text-cyan-100"><UserRound className="h-3.5 w-3.5" />Account</Link>
          ) : (
            <>
              <Link to="/login" className="flex h-9 items-center gap-1.5 px-2 text-[10px] font-bold text-slate-300 hover:text-white"><LogIn className="h-3.5 w-3.5" />Login</Link>
              <Link to="/register" className="flex h-9 items-center rounded-lg bg-gradient-to-r from-cyan-300 to-violet-500 px-3 text-[9px] font-black uppercase text-slate-950">Register</Link>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <a href="https://t.me/VReaksa" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-200" aria-label="Telegram support"><Send className="h-4 w-4" /></a>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-slate-200" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/[0.08] bg-[#081832] pb-4 pt-3 shadow-2xl lg:hidden">
          <nav className="section-shell flex flex-col gap-1" aria-label="Mobile navigation">
            <NavLink to="/" end onClick={closeMobileMenu} className={linkClass}>Home</NavLink>
            <Link to="/#games" onClick={handleGamesClick} className={`${navItem} ${isGamesActive ? 'bg-cyan-300/[0.1] text-cyan-200' : ''}`}>Games</Link>
            <NavLink to="/promotions" onClick={closeMobileMenu} className={linkClass}>Promotions</NavLink>
            <NavLink to="/history" onClick={closeMobileMenu} className={linkClass}>Transaction History</NavLink>
            <NavLink to="/support" onClick={closeMobileMenu} className={linkClass}>Customer Support</NavLink>
            <button type="button" onClick={toggleLanguage} className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-bold text-slate-300"><Globe2 className="h-3.5 w-3.5" />Language: {languageLabel}</button>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3">
              {user ? <Link to="/profile" onClick={closeMobileMenu} className="btn-secondary !rounded-xl !py-2.5">Account</Link> : <><Link to="/login" onClick={closeMobileMenu} className="btn-secondary !rounded-xl !py-2.5">Login</Link><Link to="/register" onClick={closeMobileMenu} className="btn-primary !rounded-xl !py-2.5">Register</Link></>}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
