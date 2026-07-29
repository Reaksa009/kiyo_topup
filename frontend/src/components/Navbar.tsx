import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Search, Globe, History, PhoneCall, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'km' ? 'en' : 'km';
    i18n.changeLanguage(nextLang);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-gray-800/80 bg-[#080B11]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-0.5 glow-cyan transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              KIYO<span className="text-white">TOPUP</span>
            </span>
            <span className="block text-[10px] font-semibold text-cyan-400 uppercase tracking-widest -mt-1">
              Enterprise Gaming
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <input
            type="text"
            placeholder={t('hero.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111625] border border-gray-700/60 rounded-xl py-2.5 pl-11 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
        </form>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-8">
          <Link to="/" className="text-sm font-bold text-gray-200 hover:text-cyan-400 transition-colors uppercase tracking-wider">
            Home
          </Link>
          <a href="/#games" className="text-sm font-bold text-gray-200 hover:text-cyan-400 transition-colors uppercase tracking-wider">
            Game
          </a>
          <Link to="/bulk-topup" className="text-sm font-bold text-gray-200 hover:text-cyan-400 transition-colors uppercase tracking-wider">
            Bulk Top-Up
          </Link>
          <Link to="/contact" className="text-sm font-bold text-gray-200 hover:text-cyan-400 transition-colors uppercase tracking-wider flex items-center space-x-1.5">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <span>Contact</span>
          </Link>
          <Link to="/tracking" className="text-sm font-bold text-gray-200 hover:text-cyan-400 transition-colors uppercase tracking-wider flex items-center space-x-1.5">
            <History className="w-4 h-4 text-purple-400" />
            <span>Track Order</span>
          </Link>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 text-xs font-bold bg-[#182033] hover:bg-gray-700 text-cyan-400 px-3.5 py-2 rounded-xl border border-cyan-500/30 transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language.toUpperCase()}</span>
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="lg:hidden flex items-center space-x-3">
          <button
            onClick={toggleLanguage}
            className="text-xs font-bold text-cyan-400 bg-[#182033] px-3 py-1.5 rounded-lg border border-cyan-500/30"
          >
            {i18n.language.toUpperCase()}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-t border-gray-800 px-4 pt-4 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder={t('hero.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111625] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </form>
          <div className="flex flex-col space-y-4 font-bold text-gray-200 uppercase tracking-wider pt-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <a href="/#games" onClick={() => setMobileMenuOpen(false)}>Game</a>
            <Link to="/bulk-topup" onClick={() => setMobileMenuOpen(false)}>Bulk Top-Up</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <Link to="/tracking" onClick={() => setMobileMenuOpen(false)}>Track Order</Link>
          </div>
        </div>
      )}
    </header>
  );
};
