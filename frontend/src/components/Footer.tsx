import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Gamepad2, Instagram, Mail, MapPin, Send } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="mt-12 border-t border-cyan-300/20 bg-[#06132b] text-slate-400">
    <div className="mx-auto h-1 w-24 rounded-b-full bg-gradient-to-r from-cyan-300 to-violet-500" />
    <div className="section-shell py-9 sm:py-11">
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-[1.4fr_.8fr_.8fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src="/images/logo.jpg" alt="Kiyo Topup Logo" className="h-10 w-10 shrink-0 rounded-xl border border-cyan-300/30 object-cover" />
            <span className="text-base font-black tracking-[0.13em] text-white">KIYO<span className="text-cyan-300"> TOPUP</span></span>
          </Link>
          <p className="mt-3 max-w-sm text-[11px] leading-5 text-slate-500">Fast, secure game top-ups with transparent prices and payment methods made for Cambodia.</p>
          <div className="mt-4 flex gap-2">
            <a href="https://t.me/VReaksa" target="_blank" rel="noreferrer" aria-label="Telegram" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200"><Send className="h-3.5 w-3.5" /></a>
            <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200"><Facebook className="h-3.5 w-3.5" /></a>
            <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200"><Instagram className="h-3.5 w-3.5" /></a>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Quick Links</h3>
          <div className="mt-3 space-y-2 text-[11px]"><Link to="/" className="block hover:text-white">Home</Link><Link to="/#games" className="block hover:text-white">Games</Link><Link to="/promotions" className="block hover:text-white">Promotions</Link><Link to="/tracking" className="block hover:text-white">Track order</Link></div>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Support</h3>
          <div className="mt-3 space-y-2 text-[11px]"><Link to="/support" className="block hover:text-white">Help center</Link><Link to="/contact" className="block hover:text-white">Contact us</Link><span className="block">Refund policy</span><span className="block">Privacy policy</span></div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Contact Us</h3>
          <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2 md:grid-cols-1">
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />Phnom Penh, Cambodia</p>
            <a href="mailto:support@kiyotopup.com" className="flex items-start gap-2 hover:text-white"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />support@kiyotopup.com</a>
            <a href="https://t.me/VReaksa" target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-white"><Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />@VReaksa</a>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-[9px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 Kiyo Topup. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-2"><span>We accept:</span>{['ABA', 'KHQR', 'Wing', 'TrueMoney'].map((method) => <span key={method} className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 font-black text-slate-400">{method}</span>)}</div>
      </div>
    </div>
  </footer>
);
