import { Schema, model, Document } from 'mongoose';

export interface IProviderOrder extends Document {
  orderId: Schema.Types.ObjectId;
  providerType: 'G2BULK' | 'SMILEONE' | 'CODASHOP' | 'MOOGOLD' | 'CUSTOM';
  externalOrderId?: string;
  providerProductId: string;
  costPrice: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  responseData?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderOrderSchema = new Schema<IProviderOrder>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    providerType: { type: String, required: true },
    externalOrderId: { type: String, default: '' },
    providerProductId: { type: String, required: true },
    costPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'success', 'failed'], default: 'pending' },
    responseData: { type: Map, of: Schema.Types.Mixed },
    errorMessage: { type: String, default: '' }
  },
  { timestamps: true }
);

export const ProviderOrder = model<IProviderOrder>('ProviderOrder', ProviderOrderSchema);

export interface IProviderLog extends Document {
  providerType: string;
  endpoint: string;
  requestPayload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  statusCode: number;
  executionTimeMs: number;
  createdAt: Date;
}

const ProviderLogSchema = new Schema<IProviderLog>(
  {
    providerType: { type: String, required: true },
    endpoint: { type: String, required: true },
    requestPayload: { type: Map, of: Schema.Types.Mixed },
    responsePayload: { type: Map, of: Schema.Types.Mixed },
    statusCode: { type: Number, required: true },
    executionTimeMs: { type: Number, required: true }
  },
  { timestamps: true }
);

export const ProviderLog = model<IProviderLog>('ProviderLog', ProviderLogSchema);
