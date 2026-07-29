import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HelpCircle, Send, ShieldCheck, Zap } from 'lucide-react';

export const SupportFAQ: React.FC = () => {
  const faqs = [
    {
      q: 'How fast will my game top-up arrive?',
      a: 'Top-ups are processed automatically via automated G2Bulk provider API endpoints within 5 to 10 seconds after payment confirmation.'
    },
    {
      q: 'What payment methods do you support in Cambodia?',
      a: 'We support ABA PayWay (ABA Mobile KHQR) and Bakong KHQR EMVCo standard payment gateways, as well as customer wallet balances.'
    },
    {
      q: 'What should I do if I entered an incorrect Player ID?',
      a: 'Please contact our 24/7 Telegram customer support team immediately with your Order Number.'
    },
    {
      q: 'Is my gaming account safe when using KIYO TOPUP?',
      a: 'Yes! We only use official player ID top-up channels. We never ask for your account password or login credentials.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-12 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">SUPPORT CENTER & FAQ</h1>
          <p className="text-sm text-gray-400">Everything you need to know about top-ups, payments, and account security</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-3xl space-y-2 border border-gray-800">
              <h3 className="text-base font-bold text-cyan-400 flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed pl-7">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Telegram Direct Support Box */}
        <div className="glass-panel p-8 rounded-3xl border border-cyan-500/30 text-center space-y-4 bg-gradient-to-r from-purple-900/20 via-[#111625] to-cyan-900/20">
          <h3 className="text-2xl font-black text-white">Need Personal Support?</h3>
          <p className="text-xs text-gray-300 max-w-md mx-auto">
            Our live customer support specialists are available on Telegram 24 hours a day, 7 days a week.
          </p>
          <a
            href="https://t.me/VReaksa"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase px-6 py-3 rounded-2xl shadow-lg glow-cyan transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Chat Live on Telegram</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};
