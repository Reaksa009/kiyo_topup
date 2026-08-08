import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import {
  CheckCircle2,
  ExternalLink,
  ImageOff,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  X
} from 'lucide-react';
import { apiClient } from '../api/client';

interface PaymentModalProps {
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDetails: any;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderNumber,
  amount,
  paymentMethod,
  paymentDetails,
  onSuccess,
  onClose
}) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const expiresAt = paymentDetails?.expiresAt ? new Date(paymentDetails.expiresAt).getTime() : 0;
    return expiresAt > Date.now() ? Math.ceil((expiresAt - Date.now()) / 1000) : 600;
  });
  const [simulating, setSimulating] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
    const socket = import.meta.env.DEV || socketUrl ? io(socketUrl || undefined) : null;

    socket?.on(`order_update_${orderNumber}`, (data: any) => {
      if (data.overallStatus === 'completed' || data.overallStatus === 'processing') {
        setIsPaid(true);
        window.setTimeout(onSuccess, 1500);
      }
    });

    const pollTimer = window.setInterval(async () => {
      try {
        const response = await apiClient.get(`/payments/status/${orderNumber}`);
        if (response.data.status === 'paid') {
          setIsPaid(true);
          window.clearInterval(pollTimer);
          window.setTimeout(onSuccess, 1500);
        }
      } catch {
        // The next poll will retry while the payment remains pending.
      }
    }, 4000);

    return () => {
      socket?.disconnect();
      window.clearInterval(pollTimer);
    };
  }, [orderNumber, onSuccess]);

  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      await apiClient.post('/payments/simulate', { orderNumber });
      setIsPaid(true);
      window.setTimeout(onSuccess, 1500);
    } catch {
      window.alert('Simulation error');
    } finally {
      setSimulating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const qrImageUrl = paymentDetails?.qrImageUrl || paymentDetails?.qr;
  const rawQrPayload = paymentDetails?.qrString;
  const abaAppDeeplink = paymentMethod === 'ABA_PAYWAY' ? paymentDetails?.appDeeplink : undefined;
  const checkoutUrl = paymentMethod === 'ABA_PAYWAY' ? paymentDetails?.checkoutUrl : undefined;
  const merchantName = paymentDetails?.merchantName || 'KIYO TOPUP';
  const currency = paymentDetails?.currency || 'USD';
  const hasQr = Boolean((qrImageUrl && !qrImageError) || rawQrPayload);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-white/95 px-4 py-8 backdrop-blur-sm" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-dialog-title"
        className="relative w-full max-w-[410px] rounded-[28px] bg-white px-5 py-7 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:px-8"
      >
        <button
          onClick={onClose}
          ref={closeButtonRef}
          aria-label="Close payment dialog"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {isPaid ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 id="payment-dialog-title" className="mt-5 text-2xl font-black">Payment Confirmed!</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Order <span className="font-mono font-bold text-slate-800">#{orderNumber}</span> is being fulfilled.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-[342px]">
            <div className="mb-7 flex items-center justify-between pr-9">
              <h2 id="payment-dialog-title" className="text-[28px] font-medium tracking-[-0.04em] text-slate-950">
                KHQR<span className="font-light">cc</span>
              </h2>
              <div className="flex items-center gap-2 font-mono text-base font-bold text-slate-900">
                <span className="h-7 w-7 animate-spin rounded-full border-[5px] border-slate-100 border-r-cyan-400 border-t-cyan-500" aria-hidden="true" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
              <div className="relative flex h-[60px] items-center justify-center bg-[#ed1c24] text-2xl font-black text-white">
                KHQR
                <span className="absolute -bottom-7 right-0 h-14 w-14 rotate-45 bg-white" aria-hidden="true" />
              </div>

              <div className="px-12 pb-10 pt-8">
                <p className="truncate text-xs font-medium text-slate-900">{merchantName}</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-[27px] font-black tracking-tight">{amount.toFixed(2)}</span>
                  <span className="text-xs font-medium text-slate-600">{currency}</span>
                </div>
              </div>

              <div className="mx-5 border-t border-dashed border-slate-300" />

              <div className="flex min-h-[300px] items-center justify-center px-7 py-8">
                {qrImageUrl && !qrImageError ? (
                  <div className="relative">
                    <img
                      src={qrImageUrl}
                      alt="KHQR payment code"
                      width={244}
                      height={244}
                      className="h-[244px] w-[244px] object-contain"
                      referrerPolicy="no-referrer"
                      onError={() => setQrImageError(true)}
                    />
                    {paymentMethod === 'ABA_PAYWAY' && (
                      <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-xl font-bold text-white shadow-sm">$</span>
                    )}
                  </div>
                ) : rawQrPayload ? (
                  <div className="relative">
                    <QRCodeSVG value={rawQrPayload} size={244} level="H" includeMargin={false} />
                    <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-xl font-bold text-white shadow-sm">$</span>
                  </div>
                ) : (
                  <div className="flex h-[244px] w-[244px] flex-col items-center justify-center gap-3 text-center text-rose-600">
                    <ImageOff className="h-10 w-10" />
                    <p className="text-sm font-bold">QR code could not be loaded.</p>
                  </div>
                )}
              </div>
            </div>

            <p className="mx-auto mt-9 max-w-[290px] text-center text-[17px] leading-6 text-slate-400">
              Scan with ABA Mobile, or another Mobile Banking App supporting KHQR
            </p>

            {abaAppDeeplink && (
              <a
                href={abaAppDeeplink}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0057b8] py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#004694]"
              >
                <Smartphone className="h-4 w-4" />
                Open in ABA Mobile
              </a>
            )}

            {!hasQr && checkoutUrl && (
              <a
                href={checkoutUrl}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Continue to secure checkout
              </a>
            )}

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure KHQR payment · Order #{orderNumber}
            </div>

            {import.meta.env.DEV && (
              <button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 disabled:opacity-60"
              >
                {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Simulate Payment Success
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
