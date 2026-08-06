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
import { SeoMeta } from '../components/SeoMeta';
import type { PublicBannerDTO, PublicGameDTO, PublicPackageDTO } from '../types/catalog';
import { useTranslation } from 'react-i18next';
import { resolveBannerImages } from '../utils/bannerPresentation';

type PaymentMethod = 'ABA_PAYWAY' | 'BAKONG_KHQR' | 'WALLET';

const paymentOptions: Array<{ id: PaymentMethod; label: string; short: string; subtitle: string; tone: string }> = [
  { id: 'BAKONG_KHQR', label: 'Bakong KHQR', short: 'KHQR', subtitle: 'Scan with any Cambodian banking app', tone: 'from-rose-500/20 to-red-600/5 text-rose-300' }
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
  const hasRequiredPlayerFields = (game.inputFields || []).every((field) => !field.required || playerFields[field.name]?.trim());
  const isPurchasable = game.isPurchasable !== false;
  const activeDetailBanner = detailBanners[0];
  const gameFallbackBanner = game.detailBannerDesktop || game.coverImageUrl || game.bannerUrl || game.thumbnail;
  const { desktop: bannerDesktop, mobile: bannerMobile } = activeDetailBanner
    ? resolveBannerImages(activeDetailBanner, gameFallbackBanner)
    : { desktop: gameFallbackBanner, mobile: game.detailBannerMobile || gameFallbackBanner };
  const verificationPanel = (
    <>
      <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#061b2e] p-1.5">
        <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg bg-[#06182b] px-2 py-2" aria-live="polite">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-300/[0.1] text-cyan-200"><Gem className="h-3.5 w-3.5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-black text-white sm:text-xs">{selectedPackage?.title || 'Choose a package'}</p>
            <p className="mt-0.5 truncate text-[7px] text-slate-500">{selectedPackage ? `KHR ${(Math.round((selectedPackage.price * 4100) / 100) * 100).toLocaleString('en-US')}` : 'Select from packages below'}</p>
          </div>
          <span className="shrink-0 text-xs font-black text-amber-300 sm:text-sm">{selectedPackage ? `$${selectedPackage.price.toFixed(2)}` : '--'}</span>
        </div>
        <button
          type="button"
          onClick={handleVerifyPlayer}
          disabled={verifyingPlayer || !hasRequiredPlayerFields}
          className={`mt-1.5 flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black transition ${
            verifiedPlayerInfo?.valid ? 'bg-emerald-400 text-[#041910]' : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#041523]'
          } disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45`}
        >
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{verifyingPlayer ? 'Verifying ID...' : verifiedPlayerInfo?.valid ? 'ID Verified' : 'Verify ID First'}</span>
        </button>
      </div>

      {verifiedPlayerInfo && (
        <div className={`mt-2 flex items-start gap-2 rounded-lg border p-2 text-[9px] font-bold ${
          verifiedPlayerInfo.valid ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300' : 'border-rose-400/25 bg-rose-400/[0.08] text-rose-300'
        }`}>
          {verifiedPlayerInfo.valid ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
          <div>
            <p className="font-black">{verifiedPlayerInfo.valid ? `Account verified${verifiedPlayerInfo.username ? `: ${verifiedPlayerInfo.username}` : ''}` : 'Invalid account information'}</p>
            {verifiedPlayerInfo.message && <p className="mt-0.5 text-[7px] opacity-75">{verifiedPlayerInfo.message}</p>}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#071024] pb-24 text-slate-100 md:pb-0">
      <SeoMeta title={game.seoTitle || `${game.displayName || game.title} Top-Up | Kiyo Topup`} description={game.seoDescription || game.description || `Buy ${game.title} top-ups securely.`} image={bannerDesktop} canonicalPath={`/game/${game.slug}`} />
      <Navbar />
      <main className="section-shell flex-1 py-4 sm:py-6">
        <Link to="/#games" className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-[#081a30] px-3.5 text-[10px] font-black text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:h-9 sm:text-[9px]"><ArrowLeft className="h-4 w-4" />{t('customer.backToGames')}</Link>

        <section className="relative mt-3 aspect-[3/2] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#081a30] shadow-xl shadow-black/20 sm:aspect-auto sm:h-52 lg:h-60">
          <picture><source media="(max-width: 639px)" srcSet={bannerMobile} /><img src={bannerDesktop} alt={`${game.title} banner`} fetchPriority="high" decoding="async" width="1200" height="400" loading="eager" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = game.thumbnail; }} /></picture>
          <div className="absolute inset-0 bg-gradient-to-t from-[#061321]/85 via-transparent to-black/10" />
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex max-w-lg items-center gap-3 rounded-2xl border border-cyan-300/25 bg-[#062131]/95 p-3 shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-auto sm:p-3.5">
            <img src={game.thumbnail} alt="" decoding="async" width="64" height="64" loading="eager" className="h-12 w-12 shrink-0 rounded-xl border border-cyan-300/40 object-cover min-[380px]:h-14 min-[380px]:w-14 sm:h-16 sm:w-16" />
            <div className="min-w-0"><p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-cyan-300">{game.publisher || categoryName}</p><h1 className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-white min-[380px]:text-base sm:text-xl">{game.title}</h1><div className="mt-1 flex flex-wrap items-center gap-2 text-[8px] font-bold text-slate-400 sm:text-[9px]"><span>{categoryName || 'Digital Credits'}</span><span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 text-slate-300" />4.9</span><span className="inline-flex items-center gap-0.5 text-emerald-300"><Zap className="h-3 w-3" />Instant delivery</span></div></div>
          </div>
        </section>

        {!isPurchasable && <div role="status" className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2.5 text-[10px] font-bold text-amber-100"><AlertCircle className="h-4 w-4 shrink-0" />{t('customer.gameUnavailable')}</div>}
        {errorMsg && <div id="checkout-error" role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] px-3 py-2.5 text-[10px] font-bold text-rose-300"><AlertCircle className="h-4 w-4 shrink-0" />{errorMsg}</div>}

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-0 md:space-y-3">
            <section className="rounded-t-[24px] rounded-b-none border border-b-0 border-cyan-300/25 bg-[#082536] p-4 shadow-xl shadow-black/15 sm:p-5 md:rounded-2xl md:border-b">
              <div className="flex flex-col items-center text-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 text-sm font-black text-white shadow-lg shadow-rose-300/30 sm:h-11 sm:w-11 sm:text-base">1</span>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-white sm:text-lg">{t('customer.enterPlayer')}</h2>
                  <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">Enter the account details used for delivery.</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {(game.inputFields || []).map((field, idx, arr) => {
                  const isSolo = arr.length === 1;
                  return (
                    <label key={field.name} className={`block ${isSolo ? 'col-span-2' : 'col-span-1'}`}>
                      <span className="mb-1.5 block text-[10px] font-black text-cyan-200/70 sm:text-[11px]">
                        {field.label}{field.required && <span className="text-amber-300"> *</span>}
                      </span>
                      <input
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={playerFields[field.name] || ''}
                        onChange={(event) => handleFieldChange(field.name, event.target.value)}
                        aria-invalid={Boolean(errorMsg && field.required && !playerFields[field.name])}
                        aria-describedby={errorMsg ? 'checkout-error' : undefined}
                        className="h-10 w-full rounded-lg border border-amber-300/80 bg-[#06152b] px-3.5 text-[16px] font-bold text-white outline-none placeholder:text-slate-600 focus:border-amber-200 focus:ring-2 focus:ring-amber-300/10 sm:h-11 md:text-sm"
                      />
                      {field.helpText && <span className="mt-1 block text-[8px] text-slate-600 leading-normal">{field.helpText}</span>}
                    </label>
                  );
                })}
              </div>

              <div className="mt-4">{verificationPanel}</div>
            </section>

            <TopUpPackageSelector packages={packages.filter((pkg) => pkg.isPurchasable !== false)} selectedPackage={selectedPackage} onSelect={setSelectedPackage} step="2" compact compactJoined gameSlug={game.slug} initialVisibleCount={48} />
          </div>

          <aside>
            <section className="rounded-2xl border border-cyan-300/20 bg-[#081d30] p-3 shadow-xl shadow-black/15 md:sticky md:top-20 sm:p-4">
              <div className="flex flex-col items-center text-center gap-3 border-b border-white/[0.08] pb-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 text-sm font-black text-white shadow-lg shadow-rose-300/30 sm:h-11 sm:w-11 sm:text-base">3</span>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-white sm:text-base">Payment & Confirmation</h2>
                  <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">Choose a secure payment method.</p>
                </div>
              </div>

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

              <div className="mt-3 hidden md:block">
                <label className="mb-1.5 flex items-center gap-1 text-[8px] font-black text-slate-500"><Tag className="h-3 w-3" />Promo Code</label>
                <div className="flex gap-1.5"><input type="text" placeholder="Enter coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-white/[0.09] bg-[#061522] px-2.5 text-[9px] uppercase text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40" /><button type="button" onClick={handleApplyCoupon} className="h-9 rounded-lg border border-white/[0.09] bg-white/[0.05] px-3 text-[8px] font-black text-white">Apply</button></div>
                {couponMsg && <p className="mt-1.5 text-[8px] font-bold text-cyan-300">{couponMsg}</p>}
              </div>

              {!user && <label className="mt-3 hidden md:block"><span className="mb-1.5 block text-[8px] font-black text-slate-500">Receipt Email</span><input type="email" placeholder="your@email.com" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} className="h-9 w-full rounded-lg border border-white/[0.09] bg-[#061522] px-2.5 text-[9px] text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40" /></label>}

              <div className="mt-3 hidden items-start gap-2 rounded-lg border border-white/[0.07] bg-black/10 p-2 text-[7px] leading-3.5 text-slate-500 md:flex"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />By continuing, you agree to the terms. Completed digital orders cannot be refunded.</div>

              <button type="button" onClick={handleCheckout} disabled={submitting || !selectedPackage || !isPurchasable} className="mt-3 hidden h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500 text-[10px] font-black uppercase text-[#03101d] shadow-lg shadow-cyan-950/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 md:flex"><span>{submitting ? 'Processing Order...' : 'Pay & Top-Up Now'}</span><ArrowRight className="h-4 w-4" /></button>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
      {!showPaymentModal && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cyan-300/20 bg-[#061522]/95 px-3 pt-2 shadow-[0_-14px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-lg items-center gap-3">
            <div className="min-w-0 shrink-0"><p className="text-[7px] font-black uppercase tracking-[0.16em] text-slate-500">Total</p><p className="mt-0.5 text-lg font-black text-amber-300">${finalPrice.toFixed(2)}</p></div>
            <button type="button" onClick={handleCheckout} disabled={submitting || !selectedPackage || !isPurchasable} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500 px-4 text-xs font-black uppercase text-[#03101d] shadow-lg shadow-cyan-950/30 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"><span className="truncate">{submitting ? 'Processing...' : selectedPackage ? 'Buy Now' : 'Select Package'}</span><ArrowRight className="h-4 w-4 shrink-0" /></button>
          </div>
        </div>
      )}
      {showPaymentModal && activeOrder && <PaymentModal orderNumber={activeOrder.orderNumber} amount={activeOrder.totalAmount || activeOrder.amount || 0} paymentMethod={paymentMethod} paymentDetails={paymentDetails} onSuccess={() => navigate(`/tracking?orderNumber=${activeOrder.orderNumber}`)} onClose={() => setShowPaymentModal(false)} />}
    </div>
  );
}
