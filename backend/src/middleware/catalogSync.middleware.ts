import { NextFunction, Request, Response } from 'express';
import { Settings } from '../models/System';

export const CATALOG_SYNC_MESSAGE = 'Catalog is updating. Please try again in a few minutes.';

export const catalogSyncGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const syncIsRunning = await Settings.exists({ isSyncing: true });
    if (syncIsRunning) {
      return res.status(503).json({
        success: false,
        message: CATALOG_SYNC_MESSAGE
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
