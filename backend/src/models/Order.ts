import { Schema, model, Document } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string; // e.g. ORD-20260725-XXXXXX
  userId?: Schema.Types.ObjectId; // Optional for guest checkout
  guestEmail?: string;
  gameId: Schema.Types.ObjectId;
  packageId: Schema.Types.ObjectId;
  playerFields: Record<string, string>; // e.g. { playerId: "12345678", zoneId: "1234" }
  gameTitle: string;
  packageTitle: string;
  providerType?: 'G2BULK' | 'SMILEONE' | 'CODASHOP' | 'MOOGOLD' | 'CUSTOM';
  providerProductId?: string;
  supplierId?: string;
  amount: number; // Final selling price in USD
  costPrice: number; // Cost price in USD
  profit: number; // amount - costPrice
  paymentMethod: 'ABA_PAYWAY' | 'BAKONG_KHQR' | 'WALLET';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  providerStatus: 'pending' | 'processing' | 'success' | 'failed';
  overallStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'price_review_required';
  providerCostMinor?: number;
  sellingPriceMinor?: number;
  paidPriceMinor?: number;
  observedProviderCostMinor?: number;
  priceReviewStatus?: 'none' | 'required' | 'approved' | 'rejected';
  priceReviewReason?: string;
  priceReviewDecisionBy?: Schema.Types.ObjectId;
  priceReviewDecidedAt?: Date;
  idempotencyKey: string;
  couponCode?: string;
  discountAmount?: number;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String, default: '' },
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    playerFields: { type: Map, of: String, required: true },
    gameTitle: { type: String, required: true },
    packageTitle: { type: String, required: true },
    providerType: { type: String, enum: ['G2BULK', 'SMILEONE', 'CODASHOP', 'MOOGOLD', 'CUSTOM'], default: 'G2BULK' },
    providerProductId: { type: String, default: '' },
    supplierId: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['ABA_PAYWAY', 'BAKONG_KHQR', 'WALLET'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    providerStatus: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed'],
      default: 'pending'
    },
    overallStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'price_review_required'],
      default: 'pending'
    },
    idempotencyKey: { type: String, required: true, unique: true },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    failureReason: { type: String, default: '' },
    providerCostMinor: { type: Number, min: 0 },
    sellingPriceMinor: { type: Number, min: 0 },
    paidPriceMinor: { type: Number, min: 0 },
    observedProviderCostMinor: { type: Number, min: 0 },
    priceReviewStatus: { type: String, enum: ['none', 'required', 'approved', 'rejected'], default: 'none' },
    priceReviewReason: { type: String, maxlength: 500 },
    priceReviewDecisionBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    priceReviewDecidedAt: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

OrderSchema.index({ overallStatus: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ providerStatus: 1, updatedAt: -1 });
OrderSchema.index({ priceReviewStatus: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', OrderSchema);

export interface IPayment extends Document {
  orderId: Schema.Types.ObjectId;
  paymentMethod: 'ABA_PAYWAY' | 'BAKONG_KHQR' | 'WALLET';
  transactionId: string; // Gateway transaction ID / MD5 / Ref
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  rawPayload?: Record<string, any>;
  signatureHash?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    paymentMethod: { type: String, enum: ['ABA_PAYWAY', 'BAKONG_KHQR', 'WALLET'], required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
    rawPayload: { type: Map, of: Schema.Types.Mixed },
    signatureHash: { type: String, default: '' },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
