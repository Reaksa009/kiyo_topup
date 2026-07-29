import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, PhoneCall, Send, MessageSquare, ShieldAlert } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      // In a real app, this would send an API request
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-12 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">Get in Touch</span>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">Contact Us</h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Have questions about your order, custom pricing, or game integration? Our team is here 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Side */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3">
                Support Channels
              </h3>
              
              <div className="space-y-4">
                {/* Channel 1 */}
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Telegram Live Support</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Instant response 24/7</p>
                    <a
                      href="https://t.me/VReaksa"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-extrabold text-cyan-400 hover:text-cyan-300 inline-block mt-1.5"
                    >
                      @VReaksa →
                    </a>
                  </div>
                </div>

                {/* Channel 2 */}
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Email Address</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Corporate & reseller inquiries</p>
                    <a
                      href="mailto:support@kiyotopup.com"
                      className="text-xs font-extrabold text-purple-400 hover:text-purple-300 inline-block mt-1.5"
                    >
                      support@kiyotopup.com
                    </a>
                  </div>
                </div>

                {/* Channel 3 */}
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-pink-500/10 text-pink-400 rounded-2xl border border-pink-500/20">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Response Time</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Automated queue checks</p>
                    <span className="inline-block mt-1.5 text-xs text-pink-400 font-extrabold">
                      5-10 Sec Average
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safeguard Alert Notice */}
            <div className="glass-panel p-6 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-3">
              <div className="flex items-center space-x-2 text-red-400">
                <ShieldAlert className="w-5 h-5" />
                <h4 className="text-xs font-black uppercase tracking-wider">Scam Prevention</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                KIYO TOPUP admins will **never** ask for your account password, email OTP, or 2FA credentials. Never share sensitive login info.
              </p>
            </div>
          </div>

          {/* Contact Form Side */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-8 rounded-3xl border border-gray-800">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Message Sent Successfully!</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Thank you for reaching out. A support agent will respond to your registered email shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="mt-6 text-xs font-black bg-cyan-500 text-black px-6 py-2.5 rounded-xl uppercase transition hover:opacity-90"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-wide">
                    Send Us a Message
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#111625] border border-gray-700/60 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#111625] border border-gray-700/60 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-[#111625] border border-gray-700/60 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-cyan-500"
                      placeholder="e.g. Reseller Pricing Request"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#111625] border border-gray-700/60 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Type your inquiry here..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg glow-cyan transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
