import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Gamepad2, Headphones, Instagram, Mail, MapPin, Send, ShieldCheck, Smartphone, Zap } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="mt-20 border-t border-white/[0.08] bg-[#050810] pb-8 pt-14 text-slate-400">
    <div className="section-shell">
      <div className="grid gap-4 border-b border-white/[0.08] pb-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Zap, title: 'Fast delivery', text: 'Most top-ups arrive within 5–10 seconds.' },
          { icon: ShieldCheck, title: 'Secure checkout', text: 'Protected payments and verified providers.' },
          { icon: Headphones, title: 'Human support', text: 'Real people available around the clock.' },
          { icon: Smartphone, title: 'Built for Cambodia', text: 'ABA, KHQR, Wing and local wallets.' }
        ].map(({ icon: Icon, title, text }) => <div key={title} className="surface-card flex items-center gap-3 p-4"><span className="rounded-2xl bg-cyan-300/[0.09] p-3 text-cyan-200"><Icon className="h-5 w-5" /></span><div><h3 className="text-xs font-black text-white">{title}</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">{text}</p></div></div>)}
      </div>

      <div className="grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div><Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-200 to-violet-500 text-slate-950"><Gamepad2 className="h-5 w-5" /></span><span className="text-lg font-black tracking-[0.14em] text-white">KIYO<span className="text-cyan-300"> TOPUP</span></span></Link><p className="mt-4 max-w-xs text-xs leading-6 text-slate-500">A premium game credit store for fast, secure and affordable top-ups. Made for players who value their time.</p><div className="mt-5 flex gap-2"><a href="https://t.me/VReaksa" target="_blank" rel="noreferrer" aria-label="Telegram" className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200"><Send className="h-4 w-4" /></a><a href="#" aria-label="Facebook" className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200"><Facebook className="h-4 w-4" /></a><a href="#" aria-label="Instagram" className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200"><Instagram className="h-4 w-4" /></a></div></div>
        <div><h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-white">Explore</h4><div className="mt-4 space-y-3 text-xs"><Link to="/#games" className="block hover:text-cyan-200">Popular games</Link><Link to="/promotions" className="block hover:text-cyan-200">Promotions</Link><Link to="/history" className="block hover:text-cyan-200">Transaction history</Link><Link to="/blogs" className="block hover:text-cyan-200">News & guides</Link></div></div>
        <div><h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-white">Support</h4><div className="mt-4 space-y-3 text-xs"><Link to="/support" className="block hover:text-cyan-200">Customer support</Link><Link to="/contact" className="block hover:text-cyan-200">Contact us</Link><Link to="/tracking" className="block hover:text-cyan-200">Track an order</Link><a href="mailto:support@kiyotopup.com" className="block hover:text-cyan-200">Refund policy</a></div></div>
        <div><h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-white">Contact</h4><div className="mt-4 space-y-3 text-xs"><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />Phnom Penh, Cambodia</p><p className="flex items-start gap-2"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />support@kiyotopup.com</p><p className="flex items-start gap-2"><Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />@VReaksa on Telegram</p></div></div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Kiyo Topup. All rights reserved.</p><div className="flex flex-wrap gap-4"><span>Terms & conditions</span><span>Privacy policy</span><span>Refund policy</span><span className="text-cyan-300/70">ABA · KHQR · Wing · TrueMoney</span></div></div>
    </div>
  </footer>
);
