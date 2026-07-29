import { ActivityLog } from '../models/System';
import { logger } from '../utils/logger';

export class AuditService {
  static async log(
    action: string,
    actorType: 'user' | 'admin' | 'system',
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ) {
    try {
      await ActivityLog.create({
        actorId,
        actorType,
        action,
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        details: details || {}
      });
    } catch (error) {
      logger.error('Failed to log audit activity:', error);
    }
  }
}
