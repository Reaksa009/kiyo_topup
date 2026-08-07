import React, { useEffect, useMemo, useState } from 'react';
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
import { SeoMeta } from '../components/SeoMeta';
import type { PublicBannerDTO, PublicGameDTO, PublicPackageDTO } from '../types/catalog';
import { useTranslation } from 'react-i18next';
import { resolveBannerImages } from '../utils/bannerPresentation';

type PaymentMethod = 'ABA_PAYWAY' | 'BAKONG_KHQR' | 'WALLET';

const paymentOptions: Array<{ id: PaymentMethod; label: string; short: string; subtitle: string; tone: string }> = [
  { id: 'BAKONG_KHQR', label: 'Bakong KHQR', short: 'KHQR', subtitle: 'Scan with any Cambodian banking app', tone: 'from-rose-500 to-red-600 text-white font-extrabold shadow-sm' }
];

export function GameDetail() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState<PublicGameDTO | null>(null);
  const [packages, setPackages] = useState<Array<TopUpPackage & PublicPackageDTO>>([]);
  const [detailBanners, setDetailBanners] = useState<PublicBannerDTO[]>([]);
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const purchasablePackages = useMemo(() => {
    return packages.filter((pkg) => pkg.isPurchasable !== false);
  }, [packages]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/games/${slug}`);
        const loadedGame = response.data.data.game as PublicGameDTO;
        setGame(loadedGame);
        setPackages((response.data.data.packages || []) as Array<TopUpPackage & PublicPackageDTO>);
        if (loadedGame._id) {
          try {
            const bannerResponse = await apiClient.get('/cms/banners', { params: { placement: 'game-detail', gameId: loadedGame._id } });
            setDetailBanners(bannerResponse.data.data || []);
          } catch {
            setDetailBanners([]);
          }
        }
        setSelectedPackage(null);
        setPlayerFields({});
        setVerifiedPlayerInfo(null);
      } catch (error: any) {
        setErrorMsg(error.response?.data?.message || 'Game not found.');
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0 });
      }
    };
    fetchGame();
  }, [slug]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setPlayerFields((previous) => ({ ...previous, [fieldName]: value }));
    setVerifiedPlayerInfo(null);
  };

  const handleVerifyPlayer = async () => {
    if (!game?.isPurchasable) return;
    setVerifyingPlayer(true);
    setVerifiedPlayerInfo(null);
    try {
      const response = await apiClient.post('/games/verify-player', { slug: game.slug, fields: playerFields });
      const verifyResult = response.data.data;
      setVerifiedPlayerInfo(verifyResult);
      if (verifyResult && verifyResult.valid) {
        setAgreedToTerms(true);
      }
    } catch (error: any) {
      setVerifiedPlayerInfo({ valid: false, message: error.response?.data?.message || 'Verification failed' });
    } finally {
      setVerifyingPlayer(false);
    }
  };

  // Auto-verify player account details when all fields are populated with valid lengths
  useEffect(() => {
    if (!game || !game.isPurchasable) return;
    
    const requiredFields = game.inputFields || [];
    if (requiredFields.length === 0) return;

    const canAutoVerify = requiredFields.every((field) => {
      const value = playerFields[field.name]?.trim() || '';
      const isZone = field.name.toLowerCase().includes('zone') || field.name.toLowerCase().includes('server') || field.label.toLowerCase().includes('zone') || field.label.toLowerCase().includes('server');
      const minLength = isZone ? 3 : 5;
      return value.length >= minLength;
    });

    if (canAutoVerify) {
      const timer = setTimeout(() => {
        if (!verifyingPlayer) {
          handleVerifyPlayer();
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [playerFields, game]);

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
    if (!game?.isPurchasable || selectedPackage?.isPurchasable === false) {
      setErrorMsg(t('customer.gameUnavailable'));
      return;
    }
    if (!selectedPackage) {
      setErrorMsg('Please select a top-up package.');
      return;
    }
    for (const field of game.inputFields || []) {
      if (field.required && !playerFields[field.name]) {
        setErrorMsg(`Please enter your ${field.label}.`);
        return;
      }
    }
    if (!agreedToTerms) {
      setErrorMsg('សូមយល់ព្រមលើលក្ខខណ្ឌនៃការទូទាត់ប្រាក់ជាមុនសិន។ / Please agree to the terms and conditions first.');
      return;
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
      const details = response.data.data.paymentDetails;
      if (paymentMethod === 'ABA_PAYWAY' && details?.checkoutUrl) {
        window.location.href = details.checkoutUrl;
        return;
      }
      setActiveOrder(orderData);
      setPaymentDetails(details);
      setShowPaymentModal(true);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Failed to initialize order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen flex-col bg-[#f0f4f8] text-slate-800"><Navbar /><div className="flex flex-1 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div><Footer /></div>;
  }

  if (!game) {
    return <div className="flex min-h-screen flex-col bg-[#f0f4f8] text-slate-800"><Navbar /><div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><AlertCircle className="h-12 w-12 text-rose-500" /><h2 className="mt-4 text-xl font-black">Game Not Found</h2><p className="mt-2 text-xs text-slate-500">The requested game is unavailable.</p><Link to="/#games" className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black text-slate-700 shadow-sm">Browse Games</Link></div><Footer /></div>;
  }

  const basePrice = selectedPackage?.price || 0;
  const finalPrice = Math.max(0, basePrice - (basePrice * couponDiscount / 100));
  const selectedPayment = paymentOptions.find((option) => option.id === paymentMethod)!;
  const categoryName = typeof game.categoryId === 'object' ? game.categoryId?.name : 'Game Top-Up';
  const hasRequiredPlayerFields = (game.inputFields || []).every((field) => !field.required || playerFields[field.name]?.trim());
  const isPurchasable = game.isPurchasable !== false;
  const activeDetailBanner = detailBanners[0];
  const gameFallbackBanner = game.detailBannerDesktop || game.coverImageUrl || game.bannerUrl || game.thumbnail;
  const { desktop: bannerDesktop, mobile: bannerMobile } = activeDetailBanner
    ? resolveBannerImages(activeDetailBanner, gameFallbackBanner)
    : { desktop: gameFallbackBanner, mobile: game.detailBannerMobile || gameFallbackBanner };

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f4f8] pb-24 text-slate-800 md:pb-0">
      <SeoMeta title={game.seoTitle || `${game.displayName || game.title} Top-Up | Kiyo Topup`} description={game.seoDescription || game.description || `Buy ${game.title} top-ups securely.`} image={bannerDesktop} canonicalPath={`/game/${game.slug}`} />
      <Navbar />
      <main className="section-shell flex-1 py-4 sm:py-6">
        <Link to="/#games" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[10px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50 sm:h-9 sm:text-[9px]"><ArrowLeft className="h-4 w-4" />{t('customer.backToGames')}</Link>

        <section className="relative mt-3 aspect-[3/2] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:aspect-auto sm:h-52 lg:h-60">
          <picture><source media="(max-width: 639px)" srcSet={bannerMobile} /><img src={bannerDesktop} alt={`${game.title} banner`} fetchPriority="high" decoding="async" width="1200" height="400" loading="eager" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = game.thumbnail; }} /></picture>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex max-w-lg items-center gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-auto sm:p-3.5">
            <img src={game.thumbnail} alt="" decoding="async" width="64" height="64" loading="eager" className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover min-[380px]:h-14 min-[380px]:w-14 sm:h-16 sm:w-16" />
            <div className="min-w-0"><p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-sky-600">{game.publisher || categoryName}</p><h1 className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-slate-900 min-[380px]:text-base sm:text-xl">{game.title}</h1><div className="mt-1 flex flex-wrap items-center gap-2 text-[8px] font-bold text-slate-500 sm:text-[9px]"><span>{categoryName || 'Digital Credits'}</span><span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />4.9</span><span className="inline-flex items-center gap-0.5 text-emerald-600"><Zap className="h-3 w-3" />Instant delivery</span></div></div>
          </div>
        </section>

        {!isPurchasable && <div role="status" className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[10px] font-bold text-amber-800"><AlertCircle className="h-4 w-4 shrink-0" />{t('customer.gameUnavailable')}</div>}
        {errorMsg && <div id="checkout-error" role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] font-bold text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{errorMsg}</div>}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            
            {/* Step 1: User ID */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm relative">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white shadow-sm">1</span>
                <h2 className="text-sm font-black text-slate-800 sm:text-base">បញ្ចូល ID របស់អ្នក / Enter User ID</h2>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {(game.inputFields || []).map((field, idx, arr) => {
                  const isSolo = arr.length === 1;
                  const isZone = field.name.toLowerCase().includes('zone') || field.name.toLowerCase().includes('server') || field.label.toLowerCase().includes('zone') || field.label.toLowerCase().includes('server');
                  const customPlaceholder = isZone ? "Zone ID" : (field.name.toLowerCase().includes('id') || field.label.toLowerCase().includes('id') ? "Enter your id" : field.placeholder);

                  return (
                    <label key={field.name} className={`block ${isSolo ? 'col-span-2' : 'col-span-1'}`}>
                      <span className="mb-1.5 block text-[10px] font-black text-slate-700 sm:text-[11px]">
                        {field.label}{field.required && <span className="text-rose-500"> *</span>}
                      </span>
                      <input
                        type={field.type || 'text'}
                        placeholder={customPlaceholder}
                        value={playerFields[field.name] || ''}
                        onChange={(event) => handleFieldChange(field.name, event.target.value)}
                        aria-invalid={Boolean(errorMsg && field.required && !playerFields[field.name])}
                        aria-describedby={errorMsg ? 'checkout-error' : undefined}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[16px] font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 sm:h-11 md:text-sm"
                      />
                      {field.helpText && <span className="mt-1 block text-[8.5px] text-slate-400 leading-normal">{field.helpText}</span>}
                    </label>
                  );
                })}
              </div>

              {/* Verify ID Action inside Step 1 Card */}
              {hasRequiredPlayerFields && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={handleVerifyPlayer}
                    disabled={verifyingPlayer}
                    className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
                      verifiedPlayerInfo?.valid
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-white shadow-md shadow-blue-500/15 active:scale-[0.98]'
                    } disabled:pointer-events-none disabled:opacity-45`}
                  >
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{verifyingPlayer ? 'Verifying ID...' : verifiedPlayerInfo?.valid ? 'ID Verified' : 'Verify ID First'}</span>
                  </button>

                  {verifiedPlayerInfo && (
                    <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-[10px] font-bold ${
                      verifiedPlayerInfo.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}>
                      {verifiedPlayerInfo.valid ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                      <div>
                        <p className="font-black text-sm">{verifiedPlayerInfo.valid ? `Account verified${verifiedPlayerInfo.username ? `: ${verifiedPlayerInfo.username}` : ''}` : 'Invalid account information'}</p>
                        {verifiedPlayerInfo.message && <p className="mt-0.5 text-xs opacity-75">{verifiedPlayerInfo.message}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Step 2: Select Package */}
            <TopUpPackageSelector packages={purchasablePackages} selectedPackage={selectedPackage} onSelect={setSelectedPackage} step="2" compact compactJoined gameSlug={game.slug} initialVisibleCount={48} />

            {/* Step 3: Select Payment Method & Terms */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm relative">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white shadow-sm">3</span>
                <h2 className="text-sm font-black text-slate-800 sm:text-base">ជ្រើសរើសវិធីបង់ប្រាក់ / Select Payment Method</h2>
              </div>

              <div className="mt-4 space-y-2">
                {paymentOptions.map((option) => {
                  const active = paymentMethod === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-300 ${
                        active
                          ? 'border-sky-500 bg-sky-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[10px] font-black ${option.tone}`}>{option.short}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-black text-slate-850">{option.label}</span>
                        <span className="mt-0.5 block truncate text-[9px] text-slate-400">{option.subtitle}</span>
                      </span>
                      {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
                
                {/* Promo Code Coupon Input */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-black text-slate-500 uppercase tracking-wider"><Tag className="inline h-3 w-3 mr-1" />Promo Code</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Enter coupon"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 text-xs uppercase text-slate-900 outline-none placeholder:text-slate-450 focus:border-sky-550 focus:ring-2 focus:ring-sky-500/10"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="h-10 rounded-xl border border-slate-350 bg-slate-50 hover:bg-slate-100 px-4 text-xs font-black text-slate-650 transition"
                    >
                      Apply
                    </button>
                  </div>
                  {couponMsg && <p className="mt-1.5 text-xs font-bold text-sky-500">{couponMsg}</p>}
                </div>

                {/* Receipt Email Input */}
                {!user && (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black text-slate-550 uppercase tracking-wider">Receipt Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={guestEmail}
                      onChange={(event) => setGuestEmail(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none placeholder:text-slate-450 focus:border-sky-550 focus:ring-2 focus:ring-sky-500/10"
                    />
                  </div>
                )}

                {/* Refund Terms Agreement Checkbox */}
                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-600 leading-normal hover:bg-slate-100/50 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 bg-white text-sky-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>
                    ខ្ញុំយល់ព្រមលើលក្ខខណ្ឌនៃការបង់ប្រាក់។ រាល់ការបង់ប្រាក់រួចរាល់ មិនអាចដកវិញបានឡើយ។
                    <br />
                    <span className="text-[9px] text-slate-400">I agree to the terms. Completed digital orders cannot be refunded.</span>
                  </span>
                </label>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Order Summary */}
          <aside className="lg:col-span-1">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24 space-y-4">
              <div className="border-b border-slate-100 pb-3.5">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">ព័ត៌មានលម្អិតពីការបញ្ជាទិញ / Order Details</h2>
                <p className="mt-0.5 text-[9px] text-slate-400">Review your top-up order information before paying.</p>
              </div>

              {/* Order Summary details */}
              <div className="space-y-3 text-xs leading-loose">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-450 font-medium">Game / ហ្គេម</span>
                  <span className="font-bold text-slate-850 text-right">{game.title}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-450 font-medium">Account / គណនី</span>
                  <span className={`font-mono font-bold text-right truncate max-w-[150px] ${verifiedPlayerInfo?.valid ? 'text-emerald-600' : 'text-slate-450'}`}>
                    {verifiedPlayerInfo?.valid ? verifiedPlayerInfo.username : 'Awaiting verification'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-450 font-medium">Package / កញ្ចប់ពេជ្រ</span>
                  <span className="font-bold text-slate-850 text-right truncate max-w-[150px]">{selectedPackage?.title || 'Choose package'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-450 font-medium">Payment / ការទូទាត់</span>
                  <span className="font-bold text-sky-600 text-right">{selectedPayment.label}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-emerald-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-{couponDiscount}%</span>
                  </div>
                )}
              </div>

              {/* Total Price Display */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total / តម្លៃសរុប</p>
                <p className="text-3xl font-black text-emerald-600">${finalPrice.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-slate-500">
                  ≈ KHR {(Math.round((finalPrice * 4100) / 100) * 100).toLocaleString('en-US')}
                </p>
              </div>

              {/* Order checkout action button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting || !selectedPackage || !isPurchasable || !agreedToTerms}
                className={`w-full flex h-12 items-center justify-center gap-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all duration-300 ${
                  (!selectedPackage || submitting || !isPurchasable || !agreedToTerms)
                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:via-blue-400 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]'
                }`}
              >
                <span>{submitting ? 'Processing Order...' : 'Pay & Top-Up Now'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
      
      {/* Mobile Bottom Sticky Bar */}
      {!showPaymentModal && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-lg items-center gap-3">
            <div className="min-w-0 shrink-0">
              <p className="text-[7px] font-black uppercase tracking-[0.16em] text-slate-550">Total</p>
              <p className="mt-0.5 text-lg font-black text-emerald-600">${finalPrice.toFixed(2)}</p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting || !selectedPackage || !isPurchasable || !agreedToTerms}
              className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold uppercase tracking-wide transition-all duration-300 ${
                (!selectedPackage || submitting || !isPurchasable || !agreedToTerms)
                  ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:via-blue-400 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]'
              }`}
            >
              <span className="truncate">{submitting ? 'Processing...' : selectedPackage ? 'Buy Now' : 'Select Package'}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      )}
      {showPaymentModal && activeOrder && <PaymentModal orderNumber={activeOrder.orderNumber} amount={activeOrder.totalAmount || activeOrder.amount || 0} paymentMethod={paymentMethod} paymentDetails={paymentDetails} onSuccess={() => navigate(`/tracking?orderNumber=${activeOrder.orderNumber}`)} onClose={() => setShowPaymentModal(false)} />}
    </div>
  );
}
