import { Response } from 'express';
import { Order } from '../models/Order';
import { Package } from '../models/Package';
import { Settings } from '../models/System';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ProviderFactory } from '../services/providers/ProviderFactory';
import { AuditService } from '../services/audit.service';
import { syncG2BulkCatalog, ValidationError } from '../scripts/syncG2BulkCatalog';

type AlertSeverity = 'info' | 'warning' | 'critical';

interface OperationsAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  href: string;
  count?: number;
}

let providerBalanceCache: {
  expiresAt: number;
  balance: number | null;
  online: boolean;
  error?: string;
} | null = null;

const getProviderHealth = async () => {
  if (providerBalanceCache && providerBalanceCache.expiresAt > Date.now()) return providerBalanceCache;

  try {
    const provider = ProviderFactory.getProvider('G2BULK');
    const balanceData = await provider.getBalance();
    providerBalanceCache = {
      expiresAt: Date.now() + 60_000,
      balance: Number(balanceData.balance) || 0,
      online: true
    };
  } catch (error: any) {
    providerBalanceCache = {
      expiresAt: Date.now() + 15_000,
      balance: null,
      online: false,
      error: error.message || 'Provider health check failed.'
    };
  }
  return providerBalanceCache;
};

export class OperationsController {
  static async getOperationsSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const stuckBefore = new Date(now.getTime() - 15 * 60 * 1000);

      const [
        failedOrders,
        stuckOrders,
        pendingPayments,
        activePackages,
        totalPackages,
        actionableOrders,
        settings,
        provider
      ] = await Promise.all([
        Order.countDocuments({ overallStatus: 'failed', updatedAt: { $gte: last24Hours } }),
        Order.countDocuments({ overallStatus: 'processing', updatedAt: { $lt: stuckBefore } }),
        Order.countDocuments({ paymentStatus: 'pending', createdAt: { $gte: last24Hours, $lt: stuckBefore } }),
        Package.countDocuments({ status: 'active' }),
        Package.countDocuments(),
        Order.find({
          $or: [
            { overallStatus: 'failed', updatedAt: { $gte: last24Hours } },
            { overallStatus: 'processing', updatedAt: { $lt: stuckBefore } }
          ]
        })
          .sort({ updatedAt: -1 })
          .limit(12)
          .select('orderNumber gameTitle packageTitle amount paymentStatus providerStatus overallStatus failureReason createdAt updatedAt')
          .lean(),
        Settings.findOne().select('isSyncing catalogSyncStartedAt catalogSyncFinishedAt catalogSyncStatus catalogSyncLastReport catalogSyncLastError').lean(),
        getProviderHealth()
      ]);

      const sync = {
        isSyncing: settings?.isSyncing || false,
        status: settings?.isSyncing ? 'running' : (settings?.catalogSyncStatus || 'idle'),
        startedAt: settings?.catalogSyncStartedAt || settings?.catalogSyncLastReport?.syncStarted || null,
        finishedAt: settings?.catalogSyncFinishedAt || null,
        lastReport: settings?.catalogSyncLastReport || null,
        lastError: settings?.catalogSyncLastError || ''
      };

      const alerts: OperationsAlert[] = [];
      if (failedOrders > 0) {
        alerts.push({
          id: 'failed-orders',
          severity: 'critical',
          title: 'Failed top-up orders',
          message: `${failedOrders} order${failedOrders === 1 ? '' : 's'} failed in the last 24 hours and need review.`,
          href: '/admin/orders?status=failed',
          count: failedOrders
        });
      }
      if (stuckOrders > 0) {
        alerts.push({
          id: 'stuck-orders',
          severity: 'warning',
          title: 'Orders stuck processing',
          message: `${stuckOrders} order${stuckOrders === 1 ? '' : 's'} have been processing for more than 15 minutes.`,
          href: '/admin/orders?status=processing',
          count: stuckOrders
        });
      }
      if (pendingPayments > 0) {
        alerts.push({
          id: 'pending-payments',
          severity: 'warning',
          title: 'Pending payments',
          message: `${pendingPayments} payment${pendingPayments === 1 ? '' : 's'} have been pending for more than 15 minutes.`,
          href: '/admin/orders?paymentStatus=pending',
          count: pendingPayments
        });
      }
      if (!provider.online) {
        alerts.push({
          id: 'provider-offline',
          severity: 'critical',
          title: 'G2Bulk connection unavailable',
          message: provider.error || 'The supplier health check failed.',
          href: '/admin/providers'
        });
      } else if ((provider.balance || 0) < 50) {
        alerts.push({
          id: 'provider-low-balance',
          severity: 'warning',
          title: 'Low G2Bulk balance',
          message: `Supplier balance is $${(provider.balance || 0).toFixed(2)}. Add funds before orders are interrupted.`,
          href: '/admin/providers'
        });
      }
      if (sync.isSyncing) {
        alerts.push({
          id: 'catalog-sync-running',
          severity: 'info',
          title: 'Catalog synchronization running',
          message: 'Package listing and checkout are safely locked until validation completes.',
          href: '/admin/operations'
        });
      } else if (sync.status === 'failed') {
        alerts.push({
          id: 'catalog-sync-failed',
          severity: 'critical',
          title: 'Latest catalog sync failed',
          message: sync.lastError || 'The catalog transaction was rolled back.',
          href: '/admin/operations'
        });
      }

      res.json({
        success: true,
        data: {
          generatedAt: now,
          counts: { failedOrders, stuckOrders, pendingPayments, activePackages, totalPackages },
          provider: { balance: provider.balance, online: provider.online, error: provider.error || '' },
          sync,
          alerts,
          actionableOrders
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async runCatalogSync(req: AuthenticatedRequest, res: Response) {
    try {
      const report = await syncG2BulkCatalog();
      await AuditService.log(
        'G2BULK_CATALOG_SYNC_COMPLETED',
        'admin',
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        report
      );
      res.json({ success: true, message: 'Catalog synchronization completed successfully.', data: report });
    } catch (error: any) {
      await AuditService.log(
        'G2BULK_CATALOG_SYNC_FAILED',
        'admin',
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        { reason: error.message }
      );
      res.status(error instanceof ValidationError ? 409 : 500).json({
        success: false,
        message: error.message || 'Catalog synchronization failed and was rolled back.'
      });
    }
  }
}
