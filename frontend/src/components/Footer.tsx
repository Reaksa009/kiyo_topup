import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ShieldCheck, Zap, Headphones, Send } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05070C] border-t border-gray-800/80 pt-16 pb-12 mt-20 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Features Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-gray-800/60">
          <div className="flex items-center space-x-4 p-4 rounded-2xl glass-panel">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Instant 5-Second Delivery</h4>
              <p className="text-xs text-gray-400 mt-0.5">Automated G2Bulk provider API fulfillment</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl glass-panel">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Strict Payment Security</h4>
              <p className="text-xs text-gray-400 mt-0.5">Official ABA PayWay & Bakong KHQR verification</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl glass-panel">
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">24/7 Telegram Support</h4>
              <p className="text-xs text-gray-400 mt-0.5">Real-time resolution for any account issue</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-black font-black">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-white tracking-wider">KIYO TOPUP</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              Cambodia's premier enterprise online game top-up platform supporting Mobile Legends, Free Fire, PUBG Mobile, Valorant, Honor of Kings, and more.
            </p>
            <a
              href="https://t.me/VReaksa"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/30 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Contact Telegram Bot</span>
            </a>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Supported Games</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/game/mobile-legends" className="hover:text-cyan-400 transition-colors">Mobile Legends</Link></li>
              <li><Link to="/game/free-fire" className="hover:text-cyan-400 transition-colors">Free Fire</Link></li>
              <li><Link to="/game/pubg-mobile" className="hover:text-cyan-400 transition-colors">PUBG Mobile</Link></li>
              <li><Link to="/game/valorant" className="hover:text-cyan-400 transition-colors">Valorant</Link></li>
              <li><Link to="/game/honor-of-kings" className="hover:text-cyan-400 transition-colors">Honor of Kings</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Payment Gateways</h5>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>ABA PayWay Gateway</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>Bakong KHQR (EMVCo)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span>Customer Wallet Balance</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Customer Care</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/tracking" className="hover:text-cyan-400 transition-colors">Order Status Lookup</Link></li>
              <li><Link to="/support" className="hover:text-cyan-400 transition-colors">FAQ & Support</Link></li>
              <li><Link to="/blogs" className="hover:text-cyan-400 transition-colors">News & Top-Up Guides</Link></li>
              <li><Link to="/admin/login" className="hover:text-purple-400 transition-colors">Admin Portal Sign In</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800/60 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>© 2026 KIYO TOPUP Platform. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>API SLA Guarantee</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
