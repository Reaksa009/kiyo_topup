import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PaymentModal } from '../components/PaymentModal';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Tag, ArrowRight } from 'lucide-react';

interface GamePackage {
  _id: string;
  title: string;
  price: number;
  badge?: string;
  providerProductId: string;
  supportsBoth?: boolean;
  discountPercent?: number;
}

const formatKhr = (usd: number) => Math.round(usd * 4100 / 100) * 100;

export function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState<any>(null);
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [playerFields, setPlayerFields] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'best_selling' | 'normal'>('best_selling');
  
  // Account Validation State
  const [verifyingPlayer, setVerifyingPlayer] = useState(false);
  const [verifiedPlayerInfo, setVerifiedPlayerInfo] = useState<{ valid: boolean; username?: string; message?: string } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'ABA_PAYWAY' | 'BAKONG_KHQR' | 'WALLET'>('BAKONG_KHQR');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/games/${slug}`);
        setGame(res.data.data.game);
        setPackages(res.data.data.packages || []);
        setSelectedPackage(null);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Game not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [slug]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setPlayerFields((prev) => ({ ...prev, [fieldName]: value }));
    setVerifiedPlayerInfo(null);
  };

  const handleVerifyPlayer = async () => {
    setVerifyingPlayer(true);
    setVerifiedPlayerInfo(null);
    try {
      const res = await apiClient.post('/games/verify-player', {
        slug: game.slug,
        fields: playerFields
      });
      setVerifiedPlayerInfo(res.data.data);
    } catch (err: any) {
      setVerifiedPlayerInfo({
        valid: false,
        message: err.response?.data?.message || 'Verification failed'
      });
    } finally {
      setVerifyingPlayer(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await apiClient.get(`/cms/coupons/validate/${couponCode.trim()}`);
      const coupon = res.data.data;
      if (coupon.discountType === 'percentage') {
        setCouponDiscount(coupon.discountValue);
        setCouponMsg(`10% discount applied!`);
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

    // Validate input fields
    for (const field of game.inputFields) {
      if (field.required && !playerFields[field.name]) {
        setErrorMsg(`Please enter your ${field.label}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/orders', {
        gameId: game._id,
        packageId: selectedPackage._id,
        playerFields,
        paymentMethod,
        couponCode,
        guestEmail: user?.email || guestEmail || 'customer@kiyotopup.com'
      });

      const orderData = res.data.data.order;

      if (paymentMethod === 'WALLET') {
        navigate(`/tracking?orderNumber=${orderData.orderNumber}`);
        return;
      }

      setActiveOrder(orderData);
      setPaymentDetails(res.data.data.paymentDetails);
      setShowPaymentModal(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to initialize order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">Game Not Found</h2>
          <p className="text-gray-400 mt-2">The requested game title does not exist or is currently inactive.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const basePrice = selectedPackage ? selectedPackage.price : 0;
  const finalPrice = Math.max(0, basePrice - (basePrice * (couponDiscount / 100)));

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full py-8 space-y-8">
        
        {/* Game Banner Header */}
        <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden glass-panel border border-cyan-500/20">
          <img src={game.bannerUrl} alt={game.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080B11] via-[#080B11]/60 to-transparent flex items-end p-8">
            <div className="flex items-center space-x-6">
              <img src={game.thumbnail} alt={game.title} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-cyan-400 shadow-2xl glow-cyan" />
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{game.publisher}</span>
                <h1 className="text-2xl md:text-4xl font-black text-white">{game.title}</h1>
                <p className="text-xs text-gray-300 mt-1">Instant 5-Second Automated G2Bulk Provider Delivery</p>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Selection Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1: Account Credentials */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-xl bg-cyan-500 text-black font-black flex items-center justify-center text-xs">1</span>
                  <h3 className="text-lg font-black text-white">Enter Account Credentials</h3>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyPlayer}
                  disabled={verifyingPlayer}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>{verifyingPlayer ? 'Verifying...' : 'Verify Player ID'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {game.inputFields.map((field: any) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-300">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={playerFields[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-[#111625] border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                    />
                    {field.helpText && <p className="text-[11px] text-gray-400">{field.helpText}</p>}
                  </div>
                ))}
              </div>

              {/* Verified Player Status Banner */}
              {verifiedPlayerInfo && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-3 ${verifiedPlayerInfo.valid ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                  {verifiedPlayerInfo.valid ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-black">{verifiedPlayerInfo.valid ? `✓ Account Verified: ${verifiedPlayerInfo.username}` : 'Invalid Account Credentials'}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">{verifiedPlayerInfo.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Choose Package */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-xl bg-purple-500 text-white font-black flex items-center justify-center text-xs">2</span>
                  <h3 className="text-lg font-black text-white">Select Top-Up Package</h3>
                </div>
              </div>

              {/* Category tabs: Best Selling vs Normal Package */}
              <div className="flex space-x-2 bg-[#111625] p-1.5 rounded-2xl border border-gray-800/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('best_selling')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                    activeTab === 'best_selling'
                      ? 'bg-purple-600 text-white shadow-lg glow-purple'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>Best Selling</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('normal')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                    activeTab === 'normal'
                      ? 'bg-purple-600 text-white shadow-lg glow-purple'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Tag className="w-4 h-4 text-cyan-300" />
                  <span>Normal Package</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(() => {
                  const filtered = packages.filter(pkg => {
                    const badgeLower = (pkg.badge || '').toLowerCase();
                    const isBest = badgeLower.includes('seller') || badgeLower.includes('pass') || badgeLower.includes('value') || badgeLower.includes('sale') || badgeLower.includes('deal');
                    return activeTab === 'best_selling' ? isBest : !isBest;
                  });
                  const toDisplay = filtered.length > 0 ? filtered : packages;
                  return toDisplay.map((pkg) => {
                    const isSelected = selectedPackage?._id === pkg._id;
                    return (
                      <button
                        key={pkg._id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`relative p-4 rounded-2xl text-left border transition-all flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 glow-purple text-white'
                            : 'bg-[#111625] border-gray-800 hover:border-gray-700 text-gray-300'
                        }`}
                      >
                        {pkg.badge && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-black uppercase tracking-wider shadow">
                            {pkg.badge}
                          </span>
                        )}
                        <div>
                          <h4 className="font-bold text-sm leading-snug">{pkg.title}</h4>
                          {pkg.supportsBoth && (
                            <div className="inline-flex items-center text-[8px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded mt-1.5 uppercase tracking-wide">
                              Global & Regular
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 w-full">
                          <span className="text-xs text-gray-400">Price</span>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {pkg.discountPercent && pkg.discountPercent > 0 && <span className="text-[10px] text-gray-500 line-through">${(pkg.price / (1 - pkg.discountPercent / 100)).toFixed(2)}</span>}
                              <span className="text-base font-black text-cyan-400">${pkg.price.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] font-semibold text-gray-500">≈ ៛{formatKhr(pkg.price).toLocaleString('en-US')}</p>
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-3 border-b border-gray-800 pb-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center text-xs">3</span>
                <h3 className="text-lg font-black text-white">Select Payment Method</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BAKONG_KHQR')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition ${
                    paymentMethod === 'BAKONG_KHQR'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg glow-emerald'
                      : 'bg-[#111625] border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-red-500 uppercase">Bakong KHQR</span>
                    <CheckCircle2 className={`w-5 h-5 ${paymentMethod === 'BAKONG_KHQR' ? 'text-emerald-400' : 'opacity-0'}`} />
                  </div>
                  <p className="text-[11px] text-gray-400">Instant scan & pay with any Cambodian Banking App (ABA, Acleda, Sathapana, Wing)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ABA_PAYWAY')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition ${
                    paymentMethod === 'ABA_PAYWAY'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg glow-emerald'
                      : 'bg-[#111625] border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-cyan-400 uppercase">ABA PayWay</span>
                    <CheckCircle2 className={`w-5 h-5 ${paymentMethod === 'ABA_PAYWAY' ? 'text-emerald-400' : 'opacity-0'}`} />
                  </div>
                  <p className="text-[11px] text-gray-400">Credit/Debit Card (Visa, Mastercard) & ABA Mobile App</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition ${
                    paymentMethod === 'WALLET'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg glow-emerald'
                      : 'bg-[#111625] border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-purple-400 uppercase">KIYO Wallet</span>
                    <CheckCircle2 className={`w-5 h-5 ${paymentMethod === 'WALLET' ? 'text-emerald-400' : 'opacity-0'}`} />
                  </div>
                  <p className="text-[11px] text-gray-400">Pay directly using your account balance</p>
                </button>
              </div>
            </div>
          </div>

          {/* Checkout Order Summary Column */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-6 sticky top-24 border border-cyan-500/20">
              <h3 className="text-xl font-black text-white border-b border-gray-800 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Selected Package</span>
                  <span className="font-bold text-white text-right max-w-[160px] truncate">{selectedPackage?.title || 'None'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Payment Gateway</span>
                  <span className="font-bold text-cyan-400 uppercase">{paymentMethod.replace('_', ' ')}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount</span>
                    <span>-{couponDiscount}%</span>
                  </div>
                )}

                <div className="border-t border-gray-800 pt-3 flex justify-between items-baseline">
                  <span className="text-base font-bold text-gray-200">Total Due</span>
                  <span className="text-2xl font-black text-cyan-400">${finalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Promo Code</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-[#111625] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Apply
                  </button>
                </div>
                {couponMsg && <p className="text-[11px] font-bold text-cyan-400">{couponMsg}</p>}
              </div>

              {!user && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400">Recipient Email (Order Receipt)</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting || !selectedPackage}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-black text-base shadow-xl hover:opacity-95 transition-all glow-cyan flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:glow-none"
              >
                <span>{submitting ? 'Processing Order...' : 'Pay & Top-Up Now'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Payment Modal */}
      {showPaymentModal && activeOrder && (
        <PaymentModal
          orderNumber={activeOrder.orderNumber}
          amount={activeOrder.totalAmount || activeOrder.amount || 0}
          paymentMethod={paymentMethod}
          paymentDetails={paymentDetails}
          onSuccess={() => navigate(`/tracking?orderNumber=${activeOrder.orderNumber}`)}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
