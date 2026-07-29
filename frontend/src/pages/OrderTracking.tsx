import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { io } from 'socket.io-client';
import { apiClient } from '../api/client';
import { Search, CheckCircle2, Clock, AlertCircle, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OrderTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get('orderNumber') || '';

  const [inputOrderNumber, setInputOrderNumber] = useState(initialOrderNumber);
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchOrder = async (ordNum: string) => {
    if (!ordNum.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get(`/orders/${ordNum.trim()}`);
      setOrder(res.data.data.order);
      setPayment(res.data.data.payment);

      if (res.data.data.order.overallStatus === 'completed') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setErrorMsg('Order not found. Please verify the order number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  // Socket.IO live updates
  useEffect(() => {
    if (!order?.orderNumber) return;
    const socket = io();
    socket.on(`order_update_${order.orderNumber}`, (data: any) => {
      setOrder((prev: any) => ({
        ...prev,
        overallStatus: data.overallStatus,
        providerStatus: data.providerStatus,
        failureReason: data.failureReason || prev?.failureReason
      }));

      if (data.overallStatus === 'completed') {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order?.orderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(inputOrderNumber);
  };

  const copyOrderNum = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-12 space-y-8">
        
        {/* Lookup Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white">ORDER STATUS TRACKER</h1>
          <p className="text-sm text-gray-400">Track real-time payment verification and provider top-up delivery</p>

          <form onSubmit={handleSearch} className="max-w-md mx-auto flex space-x-2 pt-2">
            <input
              type="text"
              placeholder="Enter Order Number (e.g. ORD-12345)"
              value={inputOrderNumber}
              onChange={(e) => setInputOrderNumber(e.target.value)}
              className="flex-1 bg-[#111625] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-lg glow-cyan flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Track</span>
            </button>
          </form>
        </div>

        {loading && (
          <div className="py-12 flex justify-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Order Details Display Card */}
        {order && (
          <div className="glass-panel p-8 rounded-3xl border border-cyan-500/30 space-y-8 shadow-2xl">
            
            {/* Header Info Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-black text-white">{order.orderNumber}</h2>
                  <button onClick={copyOrderNum} className="text-gray-400 hover:text-cyan-400">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Created on {new Date(order.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                    order.overallStatus === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-cyan'
                      : order.overallStatus === 'processing'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : order.overallStatus === 'failed'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {order.overallStatus}
                </span>
              </div>
            </div>

            {/* Visual Timeline Stepper */}
            <div className="grid grid-cols-3 gap-4 text-center">
              
              {/* Step 1: Payment Received */}
              <div className="space-y-2">
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-500 text-black glow-cyan'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  1
                </div>
                <h4 className="text-xs font-bold text-white">Payment Received</h4>
                <p className="text-[11px] text-gray-400">{order.paymentMethod}</p>
              </div>

              {/* Step 2: Provider Fulfillment */}
              <div className="space-y-2">
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                    order.providerStatus === 'success'
                      ? 'bg-emerald-500 text-black glow-cyan'
                      : order.providerStatus === 'processing'
                      ? 'bg-amber-500 text-black animate-pulse'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  2
                </div>
                <h4 className="text-xs font-bold text-white">Provider Fulfillment</h4>
                <p className="text-[11px] text-gray-400">G2Bulk Automated API</p>
              </div>

              {/* Step 3: Top-Up Delivered */}
              <div className="space-y-2">
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                    order.overallStatus === 'completed'
                      ? 'bg-emerald-500 text-black glow-cyan'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  3
                </div>
                <h4 className="text-xs font-bold text-white">Top-Up Delivered</h4>
                <p className="text-[11px] text-gray-400">In-Game Account</p>
              </div>

            </div>

            {/* Receipt Item Breakdown */}
            <div className="bg-[#111625] p-6 rounded-2xl space-y-3 border border-gray-800 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-gray-800 pb-2">Receipt Details</h4>
              <div className="flex justify-between text-gray-300">
                <span>Game:</span>
                <span className="font-bold text-white">{order.gameTitle}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Package:</span>
                <span className="font-bold text-white">{order.packageTitle}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Player Credentials:</span>
                <span className="font-mono font-bold text-cyan-400">
                  {JSON.stringify(order.playerFields)}
                </span>
              </div>
              <div className="flex justify-between text-gray-300 pt-2 border-t border-gray-800">
                <span className="font-bold text-white">Amount Paid:</span>
                <span className="font-black text-cyan-400 text-sm">${order.amount.toFixed(2)} USD</span>
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
