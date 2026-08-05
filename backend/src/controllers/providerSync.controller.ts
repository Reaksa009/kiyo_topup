import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { ProviderSyncService } from '../services/providerSync.service';

const run = (syncType: 'games' | 'packages' | 'full') => async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await ProviderSyncService.requestDocumentedSync(syncType, req.user?.id);
    if (!result.ok) {
      const status = result.code === 'SYNC_ALREADY_RUNNING' ? 409 : 503;
      await AuditService.log(`G2BULK_${syncType.toUpperCase()}_SYNC_BLOCKED`, 'admin', req.user?.id, req.ip, req.headers['user-agent'], { code: result.code });
      return res.status(status).json({ success: false, error: { code: result.code, message: result.message }, logId: 'logId' in result ? result.logId : undefined });
    }

    await AuditService.log(`G2BULK_${syncType.toUpperCase()}_SYNC_SUCCESS`, 'admin', req.user?.id, req.ip, req.headers['user-agent'], { syncType });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(503).json({ success: false, error: { code: 'SYNC_UNAVAILABLE', message: err.message || 'Catalogue synchronization is temporarily unavailable.' } });
  }
};

export class ProviderSyncController {
  static syncGames = run('games');
  static syncPackages = run('packages');
  static syncFull = run('full');

  static async getStatus(_req: Request, res: Response) {
    try { return res.json({ success: true, data: await ProviderSyncService.getStatus() }); }
    catch { return res.status(503).json({ success: false, error: { code: 'SYNC_STATUS_UNAVAILABLE', message: 'Sync status is temporarily unavailable.' } }); }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 20;
      return res.json({ success: true, data: await ProviderSyncService.getHistory(limit) });
    } catch { return res.status(503).json({ success: false, error: { code: 'SYNC_HISTORY_UNAVAILABLE', message: 'Sync history is temporarily unavailable.' } }); }
  }
}
