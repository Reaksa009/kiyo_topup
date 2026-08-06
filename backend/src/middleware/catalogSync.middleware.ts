import { NextFunction, Request, Response } from 'express';
import { Settings } from '../models/System';

export const CATALOG_SYNC_MESSAGE = 'Catalog is updating. Please try again in a few minutes.';

let lastSettingsCache: { isSyncing: boolean; updatedAt?: Date } | null = null;
let lastSettingsFetchTime = 0;
const SETTINGS_CACHE_TTL_MS = 5000; // Cache for 5 seconds

export const catalogSyncGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = Date.now();
    const isTest = process.env.NODE_ENV === 'test';
    let settings = isTest ? null : lastSettingsCache;
    const timedRes = res as any;

    if (!settings || now - lastSettingsFetchTime > SETTINGS_CACHE_TTL_MS) {
      if (timedRes.startTime) timedRes.startTime('db_sync_guard', 'Sync Guard Check');
      const doc = await Settings.findOne({}, { isSyncing: 1, updatedAt: 1 }).lean() as any;
      if (timedRes.endTime) timedRes.endTime('db_sync_guard');

      settings = doc ? { isSyncing: !!doc.isSyncing, updatedAt: doc.updatedAt } : null;
      lastSettingsCache = settings;
      lastSettingsFetchTime = now;
    }

    if (settings?.isSyncing) {
      return res.status(503).json({
        success: false,
        message: CATALOG_SYNC_MESSAGE
      });
    }

    res.locals.catalogVersion = settings?.updatedAt
      ? new Date(settings.updatedAt).getTime().toString()
      : 'no-settings';
    next();
  } catch (error) {
    next(error);
  }
};
