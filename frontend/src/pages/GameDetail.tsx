import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gem,
  ShieldCheck,
  Star,
  Tag,
  Zap
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PaymentModal } from '../components/PaymentModal';
import { TopUpPackageSelector, type TopUpPackage } from '../components/TopUpPackageSelector';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

type PaymentMethod = 'ABA_PAYWAY' | 'BAKONG_KHQR' | 'WALLET';

const paymentOptions: Array<{ id: PaymentMethod; label: string; short: string; subtitle: string; tone: string }> = [
  { id: 'BAKONG_KHQR', label: 'Bakong KHQR', short: 'KHQR', subtitle: 'Scan with any Cambodian banking app', tone: 'from-rose-500/20 to-red-600/5 text-rose-300' },
  { id: 'ABA_PAYWAY', label: 'ABA PayWay', short: 'ABA', subtitle: 'ABA Mobile, Visa or Mastercard', tone: 'from-cyan-500/20 to-blue-600/5 text-cyan-300' },
  { id: 'WALLET', label: 'Kiyo Wallet', short: 'KIYO', subtitle: 'Use your available account balance', tone: 'from-violet-500/20 to-purple-600/5 text-violet-300' }
];

export function GameDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState<any>(null);
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null);
  const [playerFields, setPlayerFields] = useState<Record<string, string>>({});
  const [verifyingPlayer, setVerifyingPlayer] = useState(false);
  const [verifiedPlayerInfo, setVerifiedPlayerInfo] = useState<{ valid: boolean; username?: string; message?: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BAKONG_KHQR');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/games/${slug}`);
        setGame(response.data.data.game);
        setPackages(response.data.data.packages || []);
        setSelectedPackage(null);
        setPlayerFields({});
        setVerifiedPlayerInfo(null);
      } catch (error: any) {
        setErrorMsg(error.response?.data?.message || 'Game not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [slug]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setPlayerFields((previous) => ({ ...previous, [fieldName]: value }));
    setVerifiedPlayerInfo(null);
  };

  const handleVerifyPlayer = async () => {
    setVerifyingPlayer(true);
    setVerifiedPlayerInfo(null);
    try {
      const response = await apiClient.post('/games/verify-player', { slug: game.slug, fields: playerFields });
      setVerifiedPlayerInfo(response.data.data);
    } catch (error: any) {
      setVerifiedPlayerInfo({ valid: false, message: error.response?.data?.message || 'Verification failed' });
    } finally {
      setVerifyingPlayer(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const response = await apiClient.get(`/cms/coupons/validate/${couponCode.trim()}`);
      const coupon = response.data.data;
      setCouponDiscount(coupon.discountValue);
      setCouponMsg(coupon.discountType === 'percentage' ? `${coupon.discountValue}% discount applied!` : `$${coupon.discountValue} discount applied!`);
    } catch (error: any) {
      setCouponMsg(error.response?.data?.message || 'Invalid coupon code');
      setCouponDiscount(0);
    }
  };

  const handleCheckout = async () => {
    setErrorMsg('');
    if (!selectedPackage) {
      setErrorMsg('Please select a top-up package.');
      return;
    }
    for (const field of game.inputFields) {
      if (field.required && !playerFields[field.name]) {
        setErrorMsg(`Please enter your ${field.label}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post('/orders', {
        gameId: game._id,
        packageId: selectedPackage._id,
        playerFields,
        paymentMethod,
        couponCode,
        guestEmail: user?.email || guestEmail || 'customer@kiyotopup.com'
      });
      const orderData = response.data.data.order;
      if (paymentMethod === 'WALLET') {
        navigate(`/tracking?orderNumber=${orderData.orderNumber}`);
        return;
      }
      setActiveOrder(orderData);
      setPaymentDetails(response.data.data.paymentDetails);
      setShowPaymentModal(true);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Failed to initialize order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen flex-col bg-[#071024] text-white"><Navbar /><div className="flex flex-1 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" /></div><Footer /></div>;
  }

  if (!game) {
    return <div className="flex min-h-screen flex-col bg-[#071024] text-white"><Navbar /><div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><AlertCircle className="h-12 w-12 text-rose-400" /><h2 className="mt-4 text-xl font-black">Game Not Found</h2><p className="mt-2 text-xs text-slate-500">The requested game is unavailable.</p><Link to="/#games" className="mt-5 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.08] px-4 py-2 text-[10px] font-black text-cyan-200">Browse Games</Link></div><Footer /></div>;
  }

  const basePrice = selectedPackage?.price || 0;
  const finalPrice = Math.max(0, basePrice - (basePrice * couponDiscount / 100));
  const selectedPayment = paymentOptions.find((option) => option.id === paymentMethod)!;
  const categoryName = typeof game.categoryId === 'object' ? game.categoryId?.name : 'Game Top-Up';
  const hasRequiredPlayerFields = game.inputFields.every((field: any) => !field.required || playerFields[field.name]?.trim());

  return (
    <div className="flex min-h-screen flex-col bg-[#071024] text-slate-100">
      <Navbar />
      <main className="section-shell flex-1 py-4 sm:py-6">
        <Link to="/#games" className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-[#081a30] px-3.5 text-[10px] font-black text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/[0.08] sm:h-9 sm:text-[9px]"><ArrowLeft className="h-4 w-4" />Back to Games</Link>

        <section className="relative mt-3 aspect-[3/2] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#081a30] shadow-xl shadow-black/20 sm:aspect-auto sm:h-52 lg:h-60">
          <img src={game.bannerUrl || game.thumbnail} alt={game.title} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061321]/85 via-transparent to-black/10" />
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex max-w-lg items-center gap-3 rounded-2xl border border-cyan-300/25 bg-[#062131]/95 p-3 shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-auto sm:p-3.5">
            <img src={game.thumbnail} alt="" decoding="async" className="h-12 w-12 shrink-0 rounded-xl border border-cyan-300/40 object-cover min-[380px]:h-14 min-[380px]:w-14 sm:h-16 sm:w-16" />
            <div className="min-w-0"><p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-cyan-300">{game.publisher || categoryName}</p><h1 className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-white min-[380px]:text-base sm:text-xl">{game.title}</h1><div className="mt-1 flex flex-wrap items-center gap-2 text-[8px] font-bold text-slate-400 sm:text-[9px]"><span>{categoryName || 'Digital Credits'}</span><span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 text-slate-300" />4.9</span><span className="inline-flex items-center gap-0.5 text-emerald-300"><Zap className="h-3 w-3" />Instant delivery</span></div></div>
          </div>
        </section>

        {errorMsg && <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] px-3 py-2.5 text-[10px] font-bold text-rose-300"><AlertCircle className="h-4 w-4 shrink-0" />{errorMsg}</div>}

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <section className="rounded-[24px] border border-cyan-300/25 bg-[#082536] p-4 shadow-xl shadow-black/15 sm:rounded-2xl sm:p-5">
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-xl font-black text-amber-300 sm:text-2xl">1</span>
                <div className="min-w-0"><h2 className="truncate text-base font-black text-white sm:text-lg">Enter Player Information</h2><p className="mt-0.5 text-[9px] text-slate-500 sm:text-[10px]">Enter the account details used for delivery.</p></div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {game.inputFields.map((field: any) => (
                  <label key={field.name} className="block"><span className="mb-2 block text-[10px] font-black text-cyan-200/70 sm:text-[11px]">{field.label}{field.required && <span className="text-amber-300"> *</span>}</span><input type={field.type || 'text'} placeholder={field.placeholder} value={playerFields[field.name] || ''} onChange={(event) => handleFieldChange(field.name, event.target.value)} className="h-14 w-full rounded-xl border border-amber-300/80 bg-[#06152b] px-4 text-base font-bold text-white outline-none placeholder:text-slate-600 focus:border-amber-200 focus:ring-2 focus:ring-amber-300/10 sm:h-12 sm:text-sm" />{field.helpText && <span className="mt-1.5 block text-[8px] text-slate-600">{field.helpText}</span>}</label>
                ))}
              </div>

              <div className="mt-3 min-w-0 rounded-2xl border border-white/[0.08] bg-[#061b2e] p-1.5 min-[360px]:p-2">
                <div className="flex min-h-14 min-w-0 items-center gap-2 rounded-xl bg-[#06182b] px-2.5 py-2.5 min-[360px]:gap-3 min-[360px]:px-3" aria-live="polite">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-300/[0.1] text-cyan-200 min-[360px]:h-9 min-[360px]:w-9 min-[360px]:rounded-xl"><Gem className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black text-white min-[360px]:text-sm">{selectedPackage?.title || 'Choose a top-up package'}</p><p className="mt-0.5 truncate text-[7px] text-slate-500 min-[360px]:text-[8px]">{selectedPackage ? `KHR ${(Math.round((selectedPackage.price * 4100) / 100) * 100).toLocaleString('en-US')}` : 'Select from the packages below'}</p></div>
                  <span className="shrink-0 text-sm font-black text-amber-300 min-[360px]:text-base">{selectedPackage ? `$${selectedPackage.price.toFixed(2)}` : '--'}</span>
                </div>
                <button type="button" onClick={handleVerifyPlayer} disabled={verifyingPlayer || !hasRequiredPlayerFields} className={`mt-1.5 flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition min-[360px]:mt-2 min-[360px]:h-12 min-[360px]:text-sm ${verifiedPlayerInfo?.valid ? 'bg-emerald-400 text-[#041910]' : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#041523]'} disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45`}><Zap className="h-4 w-4 shrink-0 min-[360px]:h-5 min-[360px]:w-5" /><span className="truncate">{verifyingPlayer ? 'Verifying ID...' : verifiedPlayerInfo?.valid ? 'ID Verified' : 'Verify ID First'}</span></button>
              </div>

              {verifiedPlayerInfo && <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-[10px] font-bold ${verifiedPlayerInfo.valid ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300' : 'border-rose-400/25 bg-rose-400/[0.08] text-rose-300'}`}>{verifiedPlayerInfo.valid ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}<div><p className="font-black">{verifiedPlayerInfo.valid ? `Account verified${verifiedPlayerInfo.username ? `: ${verifiedPlayerInfo.username}` : ''}` : 'Invalid account information'}</p>{verifiedPlayerInfo.message && <p className="mt-0.5 text-[8px] opacity-75">{verifiedPlayerInfo.message}</p>}</div></div>}
            </section>

            <TopUpPackageSelector packages={packages} selectedPackage={selectedPackage} onSelect={setSelectedPackage} step="2" compact initialVisibleCount={48} />
          </div>

          <aside>
            <section className="rounded-2xl border border-cyan-300/20 bg-[#081d30] p-3 shadow-xl shadow-black/15 md:sticky md:top-20 sm:p-4">
              <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-300 text-[11px] font-black text-[#171006]">3</span><div><h2 className="text-xs font-black text-white sm:text-sm">Payment & Confirmation</h2><p className="mt-0.5 text-[7px] text-slate-500">Choose a secure payment method.</p></div></div>

              <div className="mt-3 space-y-2">
                {paymentOptions.map((option) => {
                  const active = paymentMethod === option.id;
                  return <button key={option.id} type="button" onClick={() => setPaymentMethod(option.id)} className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${active ? 'border-amber-300/55 bg-amber-300/[0.06]' : 'border-white/[0.08] bg-[#061522] hover:border-white/[0.16]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[8px] font-black ${option.tone}`}>{option.short}</span><span className="min-w-0"><span className="block text-[9px] font-black text-white">{option.label}</span><span className="mt-0.5 block truncate text-[7px] text-slate-500">{option.subtitle}</span></span>{active && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-cyan-300" />}</button>;
                })}
              </div>

              <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#061522] p-3">
                <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[7px] font-black uppercase tracking-wider text-slate-600">Order Summary</p><p className="mt-1 truncate text-[9px] font-black text-white">{selectedPackage?.title || 'Select a package'}</p><p className="mt-0.5 text-[7px] text-slate-500">{game.title}</p></div><span className="shrink-0 text-lg font-black text-amber-300">${finalPrice.toFixed(2)}</span></div>
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.07] pt-2 text-[7px]"><span className="text-slate-600">Payment</span><span className="font-black text-cyan-300">{selectedPayment.label}</span></div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 flex items-center gap-1 text-[8px] font-black text-slate-500"><Tag className="h-3 w-3" />Promo Code</label>
                <div className="flex gap-1.5"><input type="text" placeholder="Enter coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-white/[0.09] bg-[#061522] px-2.5 text-[9px] uppercase text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40" /><button type="button" onClick={handleApplyCoupon} className="h-9 rounded-lg border border-white/[0.09] bg-white/[0.05] px-3 text-[8px] font-black text-white">Apply</button></div>
                {couponMsg && <p className="mt-1.5 text-[8px] font-bold text-cyan-300">{couponMsg}</p>}
              </div>

              {!user && <label className="mt-3 block"><span className="mb-1.5 block text-[8px] font-black text-slate-500">Receipt Email</span><input type="email" placeholder="your@email.com" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} className="h-9 w-full rounded-lg border border-white/[0.09] bg-[#061522] px-2.5 text-[9px] text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40" /></label>}

              <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/[0.07] bg-black/10 p-2 text-[7px] leading-3.5 text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />By continuing, you agree to the terms. Completed digital orders cannot be refunded.</div>

              <button type="button" onClick={handleCheckout} disabled={submitting || !selectedPackage} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500 text-[10px] font-black uppercase text-[#03101d] shadow-lg shadow-cyan-950/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"><span>{submitting ? 'Processing Order...' : 'Pay & Top-Up Now'}</span><ArrowRight className="h-4 w-4" /></button>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
      {showPaymentModal && activeOrder && <PaymentModal orderNumber={activeOrder.orderNumber} amount={activeOrder.totalAmount || activeOrder.amount || 0} paymentMethod={paymentMethod} paymentDetails={paymentDetails} onSuccess={() => navigate(`/tracking?orderNumber=${activeOrder.orderNumber}`)} onClose={() => setShowPaymentModal(false)} />}
    </div>
  );
}
