import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Globe2, Headphones, History, LogIn, Menu, Tag, UserRound, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItem = 'group relative flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'km' ? 'en' : 'km');
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

  const linkClass = ({ isActive }: { isActive: boolean }) => `${navItem} ${isActive ? 'bg-cyan-300/[0.09] text-cyan-200' : ''}`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070a12]/80 backdrop-blur-2xl">
      <div className="section-shell flex h-[72px] items-center justify-between gap-4">
        <Link to="/" onClick={closeMobileMenu} className="group flex shrink-0 items-center gap-3" aria-label="Kiyo Topup home">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-cyan-200 via-blue-500 to-violet-500 p-px shadow-[0_0_24px_rgba(98,230,255,0.22)] transition group-hover:scale-105">
            <span className="flex h-full w-full items-center justify-center rounded-[13px] bg-[#0a1020]"><Gamepad2 className="h-5 w-5 text-cyan-200" /></span>
          </span>
          <span className="hidden sm:block">
            <span className="block text-[17px] font-black tracking-[0.16em] text-white">KIYO<span className="text-cyan-300"> TOPUP</span></span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Play more. Wait less.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
          <NavLink to="/" end className={linkClass}><span>Home</span></NavLink>
          <Link to="/#games" onClick={handleGamesClick} className={`${navItem} ${isGamesActive ? 'bg-cyan-300/[0.09] text-cyan-200' : ''}`}><Gamepad2 className="h-3.5 w-3.5" /><span>Games</span></Link>
          <NavLink to="/promotions" className={linkClass}><Tag className="h-3.5 w-3.5" /><span>Promotions</span></NavLink>
          <NavLink to="/history" className={linkClass}><History className="h-3.5 w-3.5" /><span>Transaction History</span></NavLink>
          <NavLink to="/support" className={linkClass}><Headphones className="h-3.5 w-3.5" /><span>Customer Support</span></NavLink>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="hidden items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 2xl:flex"><Zap className="h-3.5 w-3.5" /> Secure checkout</span>
          <button type="button" onClick={toggleLanguage} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[10px] font-black text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200" aria-label="Change language"><Globe2 className="h-3.5 w-3.5" />{i18n.language.toUpperCase()}</button>
          {user ? (
            <Link to="/profile" className="btn-secondary !px-3 !py-2"><UserRound className="h-3.5 w-3.5" />Account</Link>
          ) : (
            <><Link to="/login" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-300 hover:text-white"><LogIn className="h-3.5 w-3.5" />Login</Link><Link to="/register" className="btn-primary !px-3.5 !py-2">Register</Link></>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={toggleLanguage} className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] px-2.5 py-1.5 text-[10px] font-black text-cyan-200">{i18n.language.toUpperCase()}</button>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/[0.08] bg-[#0a1020]/95 px-4 pb-5 pt-3 shadow-2xl backdrop-blur-xl lg:hidden">
          <nav className="section-shell flex flex-col gap-1" aria-label="Mobile navigation">
            <NavLink to="/" end onClick={closeMobileMenu} className={linkClass}>Home</NavLink>
            <Link to="/#games" onClick={handleGamesClick} className={`${navItem} ${isGamesActive ? 'bg-cyan-300/[0.09] text-cyan-200' : ''}`}>Games</Link>
            <NavLink to="/promotions" onClick={closeMobileMenu} className={linkClass}>Promotions</NavLink>
            <NavLink to="/history" onClick={closeMobileMenu} className={linkClass}>Transaction History</NavLink>
            <NavLink to="/support" onClick={closeMobileMenu} className={linkClass}>Customer Support</NavLink>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3">
              {user ? <Link to="/profile" onClick={closeMobileMenu} className="btn-secondary">Account</Link> : <><Link to="/login" onClick={closeMobileMenu} className="btn-secondary">Login</Link><Link to="/register" onClick={closeMobileMenu} className="btn-primary">Register</Link></>}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
