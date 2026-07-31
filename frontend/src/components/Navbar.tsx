import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Globe, History, Menu, X, Zap } from 'lucide-react';

const baseNavClass = 'relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'km' ? 'en' : 'km');
  };

  const isGamesActive = location.pathname.startsWith('/game') || location.hash === '#games';
  const isContactActive = location.pathname === '/contact';
  const isTrackingActive = location.pathname === '/tracking';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, location.hash]);

  const handleGamesClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      event.preventDefault();
      document.getElementById('games')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeMobileMenu();
  };

  const activeLink = (active: boolean) =>
    `${baseNavClass} ${active ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMobileMenu} className="group flex shrink-0 items-center gap-3" aria-label="KIYO TOPUP home">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-cyan-500 to-purple-600 p-[1px] shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-transform group-hover:scale-105">
            <span className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#0B1020]">
              <Gamepad2 className="h-6 w-6 text-cyan-300" />
            </span>
          </span>
          <span className="hidden sm:block">
            <span className="block text-[19px] font-black leading-none tracking-[0.16em] text-white">
              KIYO<span className="text-cyan-300">TOPUP</span>
            </span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.28em] text-slate-500">Instant game credit</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          <NavLink to="/" end className={({ isActive }) => activeLink(isActive)}>
            {t('nav.home', 'Home')}
          </NavLink>
          <Link to="/#games" onClick={handleGamesClick} className={activeLink(isGamesActive)}>
            {t('nav.games', 'Games')}
          </Link>
          <NavLink to="/contact" className={({ isActive }) => activeLink(isContactActive || isActive)}>
            Contact
          </NavLink>
          <NavLink
            to="/tracking"
            className={({ isActive }) => `${activeLink(isTrackingActive || isActive)} ml-1 border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:border-cyan-300/60 hover:bg-cyan-400/20`}
          >
            <History className="h-4 w-4" />
            <span>{t('nav.tracking', 'Track Order')}</span>
          </NavLink>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 xl:flex">
            <Zap className="h-3.5 w-3.5" />
            Fast & secure
          </span>
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
            aria-label="Change language"
          >
            <Globe className="h-3.5 w-3.5" />
            {i18n.language.toUpperCase()}
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-black text-cyan-300"
          >
            {i18n.language.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:text-white"
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0B1020]/95 px-4 pb-5 pt-3 shadow-2xl backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
            <NavLink to="/" end onClick={closeMobileMenu} className={({ isActive }) => activeLink(isActive)}>
              {t('nav.home', 'Home')}
            </NavLink>
            <Link to="/#games" onClick={handleGamesClick} className={activeLink(isGamesActive)}>
              {t('nav.games', 'Games')}
            </Link>
            <NavLink to="/contact" onClick={closeMobileMenu} className={({ isActive }) => activeLink(isContactActive || isActive)}>
              Contact
            </NavLink>
            <NavLink
              to="/tracking"
              onClick={closeMobileMenu}
              className={({ isActive }) => `${activeLink(isTrackingActive || isActive)} border border-cyan-400/30 bg-cyan-400/10 text-cyan-200`}
            >
              <History className="h-4 w-4" />
              {t('nav.tracking', 'Track Order')}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};
