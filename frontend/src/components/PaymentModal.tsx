import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { io } from 'socket.io-client';
import { X, CheckCircle2, Clock, Copy, ShieldCheck, PlayCircle, Loader2, ImageOff, Download } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
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

  // Listen to Socket.IO for real-time payment confirmation
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
    const socket = import.meta.env.DEV || socketUrl
      ? io(socketUrl || undefined)
      : null;

    socket?.on(`order_update_${orderNumber}`, (data: any) => {
      if (data.overallStatus === 'completed' || data.overallStatus === 'processing') {
        setIsPaid(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    });

    // Also poll backend every 4 seconds in fallback mode
    const pollTimer = setInterval(async () => {
      try {
        const res = await apiClient.get(`/payments/status/${orderNumber}`);
        if (res.data.status === 'paid') {
          setIsPaid(true);
          clearInterval(pollTimer);
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } catch (err) {
        // ignore
      }
    }, 4000);

    return () => {
      socket?.disconnect();
      clearInterval(pollTimer);
    };
  }, [orderNumber, onSuccess]);

  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      await apiClient.post('/payments/simulate', { orderNumber });
      setIsPaid(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      alert('Simulation error');
    } finally {
      setSimulating(false);
    }
  };

  const copyQrText = () => {
    if (paymentDetails?.qrString) {
      navigator.clipboard.writeText(paymentDetails.qrString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById('khqr-download-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `KHQR-${orderNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (qrImageUrl) {
      const a = document.createElement('a');
      a.href = qrImageUrl;
      a.target = '_blank';
      a.download = `KHQR-${orderNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const qrImageUrl = paymentDetails?.qrImageUrl || paymentDetails?.qr;
  const rawQrPayload = paymentDetails?.qrString;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title" className="relative w-full max-w-md p-6 glass-panel rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          ref={closeButtonRef}
          aria-label="Close payment dialog"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isPaid ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center glow-cyan">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 id="payment-dialog-title" className="text-2xl font-black text-white">Payment Confirmed!</h3>
            <p className="text-sm text-gray-300">Your top-up order <span className="font-mono text-cyan-400">{orderNumber}</span> has been paid successfully and is being fulfilled.</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <span className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{paymentMethod === 'ABA_PAYWAY' ? 'ABA PayWay KHQR' : 'Bakong KHQR Payment'}</span>
              </span>
              <h3 id="payment-dialog-title" className="text-2xl font-black text-white">Scan to Pay</h3>
              <p className="text-xs text-gray-400">Order #{orderNumber}</p>
            </div>

            {/* QR Display Card */}
            <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center shadow-inner space-y-3">
              {qrImageUrl && !qrImageError ? (
                <img
                  src={qrImageUrl}
                  alt="Bakong KHQR payment code"
                  width={220}
                  height={220}
                  className="h-[220px] w-[220px] object-contain"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  onError={() => setQrImageError(true)}
                />
              ) : rawQrPayload ? (
                <QRCodeSVG
                  value={rawQrPayload}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="flex h-[220px] w-[220px] flex-col items-center justify-center gap-3 rounded-xl bg-red-50 px-5 text-center text-red-700">
                  <ImageOff className="h-9 w-9" />
                  <p className="text-sm font-bold">QR code could not be loaded. Please close this window and try again.</p>
                </div>
              )}
              <div className="text-center">
                <span className="text-xs font-bold text-gray-600 uppercase">Total Amount</span>
                <p className="text-2xl font-black text-gray-900">${amount.toFixed(2)} USD</p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadQr}
              type="button"
              className="w-full flex items-center justify-center space-x-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download KHQR Image</span>
            </button>

            {rawQrPayload && (
              <div style={{ display: 'none' }}>
                <QRCodeCanvas
                  id="khqr-download-canvas"
                  value={rawQrPayload}
                  size={512}
                  level="H"
                  includeMargin={true}
                />
              </div>
            )}

            {/* Timer & Copy Section */}
            <div className="flex items-center justify-between text-xs px-2">
              <div className="flex items-center space-x-1.5 text-amber-400 font-mono font-bold">
                <Clock className="w-4 h-4" />
                <span>Expires in: {formatTime(timeLeft)}</span>
              </div>
              {rawQrPayload && (
                <button
                  onClick={copyQrText}
                  className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied QR Payload!' : 'Copy Payload'}</span>
                </button>
              )}
            </div>

            {/* Instant Test Payment Simulator Button (development only) */}
            {import.meta.env.DEV && <div className="pt-2">
              <button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg glow-cyan transition-all"
              >
                {simulating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Simulate Payment Success (Dev Test)</span>
                  </>
                )}
              </button>
            </div>}
          </>
        )}

      </div>
    </div>
  );
};
