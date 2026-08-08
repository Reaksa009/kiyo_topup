import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PaymentModal } from '../components/PaymentModal';
import { TopUpPackageSelector, type TopUpPackage } from '../components/TopUpPackageSelector';
import { apiClient } from '../api/client';
import { CheckCircle2, AlertCircle, Upload, Play, ShieldCheck, Trash2, HelpCircle, FileText } from 'lucide-react';

interface GameItem {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  publisher: string;
  inputFields: Array<{ name: string; label: string; placeholder: string; required: boolean }>;
}

interface LoadedAccount {
  id: string;
  userId: string;
  zoneId: string;
  status: 'pending' | 'verifying' | 'success' | 'failed';
  username?: string;
  error?: string;
}

export function BulkTopup() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null);

  // Input Accounts State
  const [rawText, setRawText] = useState('');
  const [accounts, setAccounts] = useState<LoadedAccount[]>([]);
  
  // Checkout & Payment State
  const [paymentMethod, setPaymentMethod] = useState<'ABA_PAYWAY' | 'BAKONG_KHQR'>('BAKONG_KHQR');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Fetch Games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/games');
        const activeGames = res.data.data.filter((g: any) => g.status === 'active');
        setGames(activeGames);
        if (activeGames.length > 0) {
          // Default to Mobile Legends
          const ml = activeGames.find((g: any) => g.slug === 'mobile-legends') || activeGames[0];
          handleGameChange(ml);
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to load games catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const handleGameChange = async (game: GameItem) => {
    setSelectedGame(game);
    setPackages([]);
    setSelectedPackage(null);
    try {
      const res = await apiClient.get(`/games/${game.slug}`);
      const pkgs = res.data.data.packages || [];
      setPackages(pkgs);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load game packages.');
    }
  };

  // Parse TXT / CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndAddAccounts(text);
    };
    reader.readAsText(file);
  };

  const parseAndAddAccounts = (text: string) => {
    const lines = text.split('\n');
    const parsed: LoadedAccount[] = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Extract using regex for common formats: "56387296,3484" or "56387296 (3484)" or "56387296/3484"
      const match = cleanLine.match(/(\d+)\s*[\s,()/\\]+\s*(\d+)/) || cleanLine.match(/^(\d+)$/);
      if (match) {
        parsed.push({
          id: Math.random().toString(36).substring(2, 9),
          userId: match[1],
          zoneId: match[2] || '',
          status: 'pending'
        });
      }
    });

    if (parsed.length > 0) {
      setAccounts((prev) => [...prev, ...parsed]);
      setSuccessMsg(`Successfully loaded ${parsed.length} accounts!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg('No valid Player IDs found in the file.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Add account manually from raw text area
  const handleAddManual = () => {
    if (!rawText.trim()) return;
    parseAndAddAccounts(rawText);
    setRawText('');
  };

  // Verify all loaded player IDs
  const handleVerifyAll = async () => {
    if (accounts.length === 0) return;
    setVerifying(true);
    setErrorMsg('');

    const updated = [...accounts];
    for (let i = 0; i < updated.length; i++) {
      const acc = updated[i];
      updated[i].status = 'verifying';
      setAccounts([...updated]);

      try {
        const res = await apiClient.post('/games/verify-player', {
          slug: selectedGame?.slug,
          fields: { userId: acc.userId, zoneId: acc.zoneId, playerId: acc.userId }
        });
        
        if (res.data.success && res.data.data.valid) {
          updated[i].status = 'success';
          updated[i].username = res.data.data.username;
        } else {
          updated[i].status = 'failed';
          updated[i].error = 'Invalid credentials';
        }
      } catch (err) {
        updated[i].status = 'failed';
        updated[i].error = 'Failed to verify';
      }
      setAccounts([...updated]);
    }
    setVerifying(false);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAll = () => {
    setAccounts([]);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await apiClient.get(`/cms/coupons/validate/${couponCode.trim()}`);
      const coupon = res.data.data;
      if (coupon.discountType === 'percentage') {
        setCouponDiscount(coupon.discountValue);
        setCouponMsg(`Discount coupon applied successfully!`);
      } else {
        setCouponDiscount(coupon.discountValue);
        setCouponMsg(`$${coupon.discountValue} discount applied!`);
      }
    } catch (err: any) {
      setCouponMsg(err.response?.data?.message || 'Invalid coupon code');
      setCouponDiscount(0);
    }
  };

  const handleCheckout = async () => {
    setErrorMsg('');
    if (!selectedPackage) {
      setErrorMsg('Please select a top-up package.');
      return;
    }
    if (accounts.length === 0) {
      setErrorMsg('Please add at least one player account.');
      return;
    }

    setSubmitting(true);
    try {
      const playersList = accounts.map((a) => ({
        userId: a.userId,
        zoneId: a.zoneId,
        playerId: a.userId
      }));

      const res = await apiClient.post('/orders/bulk', {
        gameId: selectedGame?._id,
        packageId: selectedPackage._id,
        players: playersList,
        paymentMethod,
        couponCode,
        guestEmail: guestEmail || 'customer@kiyotopup.com'
      });

      const parentOrder = res.data.data.order;
      const details = res.data.data.paymentDetails;
      if (paymentMethod === 'ABA_PAYWAY' && details?.appDeeplink) {
        setActiveOrder(parentOrder);
        setPaymentDetails(details);
        setShowPaymentModal(true);
        return;
      }
      if (paymentMethod === 'ABA_PAYWAY' && details?.checkoutUrl) {
        window.location.assign(details.checkoutUrl);
        return;
      }
      setActiveOrder(parentOrder);
      setPaymentDetails(details);
      setShowPaymentModal(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit bulk order.');
    } finally {
      setSubmitting(false);
    }
  };

  const unitPrice = selectedPackage ? selectedPackage.price : 0;
  const unitFinalPrice = Math.max(0.01, unitPrice - (unitPrice * (couponDiscount / 100)));
  const totalCost = unitFinalPrice * accounts.length;

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-8 space-y-8">
        
        {/* Bulk Header */}
        <div className="glass-panel p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-purple-950/20 to-cyan-950/20 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center space-x-3">
              <span>🚀</span>
              <span>Bulk Reseller Top-Up Engine</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Check out hundreds of Mobile Legends accounts in a single automated transaction.</p>
          </div>
          <div className="flex space-x-3">
            <label className="px-4 py-2.5 rounded-xl bg-cyan-600 text-black font-bold text-xs cursor-pointer hover:bg-cyan-500 transition-all flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload TXT/CSV</span>
              <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={handleClearAll}
              disabled={accounts.length === 0}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition disabled:opacity-50 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear List</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-3 animate-pulse">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Work Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1: Target Game & Package */}
            <div className="glass-panel p-6 rounded-3xl space-y-5">
              <div className="flex items-center space-x-3 border-b border-gray-800 pb-3">
                <span className="w-7 h-7 rounded-xl bg-purple-500 text-white font-black flex items-center justify-center text-xs">1</span>
                <h3 className="text-lg font-black text-white">Select Game & Package</h3>
              </div>

              {/* Game Selector Tab */}
              <div className="grid grid-cols-2 gap-4">
                {games.map((g) => {
                  const isSel = selectedGame?._id === g._id;
                  return (
                    <button
                      key={g._id}
                      onClick={() => handleGameChange(g)}
                      className={`p-3 rounded-2xl border text-left flex items-center space-x-3 transition ${
                        isSel ? 'border-cyan-500 bg-cyan-950/20 text-white' : 'border-gray-800 bg-[#111625] text-gray-400'
                      }`}
                    >
                      <img src={g.thumbnail} alt={g.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-xs">{g.title}</h4>
                        <span className="text-[10px] opacity-75">{g.publisher}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {packages.length > 0 && (
                <TopUpPackageSelector
                  packages={packages}
                  selectedPackage={selectedPackage}
                  onSelect={setSelectedPackage}
                  embedded
                  initialVisibleCount={18}
                />
              )}
            </div>

            {/* Step 2: Input & File Parser */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-xl bg-cyan-500 text-black font-black flex items-center justify-center text-xs">2</span>
                  <h3 className="text-lg font-black text-white">Import Accounts List</h3>
                </div>
                <button
                  onClick={handleVerifyAll}
                  disabled={accounts.length === 0 || verifying}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>{verifying ? 'Verifying All...' : 'Verify List'}</span>
                </button>
              </div>

              {/* Paste Text Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300">Copy-Paste Accounts (Format: PlayerID,ZoneID - one per line)</label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g.&#10;56387296,3484&#10;12345678,9012"
                  className="w-full bg-[#111625] border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleAddManual}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#1d2639] border border-gray-700 text-gray-200 text-xs font-bold hover:bg-gray-700/50 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <Play className="w-4 h-4 text-cyan-400" />
                  <span>Process Parsed Lines</span>
                </button>
              </div>

              {/* Parsed Accounts Table List */}
              {accounts.length > 0 && (
                <div className="border border-gray-800 rounded-2xl overflow-hidden mt-4">
                  <div className="bg-[#111625] px-4 py-2 border-b border-gray-800 flex justify-between items-center text-xs font-bold text-gray-400">
                    <span>Account Details</span>
                    <span>Status</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-800">
                    {accounts.map((acc) => (
                      <div key={acc.id} className="px-4 py-3 flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span className="font-bold text-white">{acc.userId}</span>
                          {acc.zoneId && <span className="text-gray-400">({acc.zoneId})</span>}
                          {acc.username && <span className="text-emerald-400 font-medium">[{acc.username}]</span>}
                        </div>
                        <div className="flex items-center space-x-3">
                          {acc.status === 'pending' && <span className="text-gray-500">Awaiting Verification</span>}
                          {acc.status === 'verifying' && <span className="text-cyan-400 animate-pulse">Checking...</span>}
                          {acc.status === 'success' && <span className="text-emerald-400">✓ Verified</span>}
                          {acc.status === 'failed' && <span className="text-red-400">✗ {acc.error}</span>}
                          <button onClick={() => handleRemoveAccount(acc.id)} className="text-gray-500 hover:text-red-400 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Checkout Panel */}
          <div className="space-y-8">
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-black text-white border-b border-gray-850 pb-3">Checkout Summary</h3>

              {/* Dynamic Bill Calculation */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Selected Game</span>
                  <span className="font-bold text-white">{selectedGame?.title || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Selected Package</span>
                  <span className="font-bold text-purple-400">{selectedPackage?.title || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Accounts</span>
                  <span className="font-bold text-cyan-400">x{accounts.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Unit Price</span>
                  <span className="font-bold text-white">${unitPrice.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-850 my-4" />

                {/* Coupon Code Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-300">Discount Coupon Code</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. KIYO2026"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-[#111625] border border-gray-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-400 focus:outline-none"
                    />
                    <button onClick={handleApplyCoupon} className="px-4 py-2 rounded-xl bg-[#1d2639] border border-gray-700 text-xs font-bold text-gray-200">
                      Apply
                    </button>
                  </div>
                  {couponMsg && <p className="text-[10px] text-amber-400 font-bold">{couponMsg}</p>}
                </div>

                {/* Guest Email */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-300">Delivery Receipt Email</label>
                  <input
                    type="email"
                    placeholder="reseller@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3 py-2 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="border-t border-gray-850 my-4" />

                {/* Select Payment Method */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-300">Payment Gateway</label>
                  <div className="grid grid-cols-1">
                    <button
                      onClick={() => setPaymentMethod('BAKONG_KHQR')}
                      className="p-2.5 rounded-xl border text-center text-[10px] font-black uppercase border-emerald-500 bg-emerald-950/20 text-emerald-400"
                    >
                      Bakong KHQR
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-850 my-4" />

                <div className="flex justify-between items-center text-base">
                  <span className="text-gray-300 font-bold">Grand Total (USD)</span>
                  <span className="text-xl font-black text-cyan-400">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={accounts.length === 0 || submitting || !selectedPackage}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black uppercase tracking-wider hover:opacity-90 shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Creating Order Batch...' : 'Proceed to Bulk Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Payment Modal */}
      {showPaymentModal && activeOrder && paymentDetails && (
        <PaymentModal
          orderNumber={activeOrder.orderNumber}
          amount={activeOrder.amount}
          paymentMethod={activeOrder.paymentMethod}
          paymentDetails={paymentDetails}
          onSuccess={() => {
            setShowPaymentModal(false);
            window.location.href = `/tracking?orderNumber=${activeOrder.orderNumber}`;
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
