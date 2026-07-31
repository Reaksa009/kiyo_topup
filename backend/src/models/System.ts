import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  platformName: string;
  logoUrl: string;
  maintenanceMode: boolean;
  isSyncing: boolean;
  catalogSyncToken?: string;
  catalogSyncStartedAt?: Date;
  catalogSyncFinishedAt?: Date;
  catalogSyncStatus: 'idle' | 'running' | 'success' | 'failed';
  catalogSyncLastReport?: Record<string, any>;
  catalogSyncLastError?: string;
  contactEmail: string;
  contactTelegram: string;
  abaPayWayMerchantId: string;
  abaPayWayApiKey: string;
  abaPayWayApiUrl: string;
  bakongMerchantName: string;
  bakongMerchantId: string;
  bakongAccountId: string;
  bakongApiToken: string;
  g2bulkApiUrl: string;
  g2bulkApiKey: string;
  g2bulkApiSecret: string;
  g2bulkUserId: string;
  telegramBotToken: string;
  telegramChatId: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    platformName: { type: String, default: 'KIYO TOPUP' },
    logoUrl: { type: String, default: '/logo.png' },
    maintenanceMode: { type: Boolean, default: false },
    isSyncing: { type: Boolean, default: false },
    catalogSyncToken: { type: String, default: '', select: false },
    catalogSyncStartedAt: { type: Date },
    catalogSyncFinishedAt: { type: Date },
    catalogSyncStatus: {
      type: String,
      enum: ['idle', 'running', 'success', 'failed'],
      default: 'idle'
    },
    catalogSyncLastReport: { type: Schema.Types.Mixed },
    catalogSyncLastError: { type: String, default: '' },
    contactEmail: { type: String, default: 'support@kiyotopup.com' },
    contactTelegram: { type: String, default: '@kiyotopup_support' },
    abaPayWayMerchantId: { type: String, default: '' },
    abaPayWayApiKey: { type: String, default: '', select: false },
    abaPayWayApiUrl: { type: String, default: '' },
    bakongMerchantName: { type: String, default: '' },
    bakongMerchantId: { type: String, default: '' },
    bakongAccountId: { type: String, default: '' },
    bakongApiToken: { type: String, default: '', select: false },
    g2bulkApiUrl: { type: String, default: '' },
    g2bulkApiKey: { type: String, default: '', select: false },
    g2bulkApiSecret: { type: String, default: '', select: false },
    g2bulkUserId: { type: String, default: '' },
    telegramBotToken: { type: String, default: '', select: false },
    telegramChatId: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', SettingsSchema);

export interface INotification extends Document {
  userId?: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'order_update' | 'payment_success' | 'promotion' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'order_update', 'payment_success', 'promotion', 'system'],
      default: 'info'
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Notification = model<INotification>('Notification', NotificationSchema);

export interface ITelegramLog extends Document {
  message: string;
  targetChatId: string;
  status: 'sent' | 'failed';
  error?: string;
  createdAt: Date;
}

const TelegramLogSchema = new Schema<ITelegramLog>(
  {
    message: { type: String, required: true },
    targetChatId: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
    error: { type: String, default: '' }
  },
  { timestamps: true }
);

export const TelegramLog = model<ITelegramLog>('TelegramLog', TelegramLogSchema);

export interface IActivityLog extends Document {
  actorId?: Schema.Types.ObjectId;
  actorType: 'user' | 'admin' | 'system';
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actorId: { type: Schema.Types.ObjectId },
    actorType: { type: String, enum: ['user', 'admin', 'system'], required: true },
    action: { type: String, required: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    details: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
