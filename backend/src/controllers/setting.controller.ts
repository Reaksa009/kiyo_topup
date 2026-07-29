import { Request, Response } from 'express';
import { Settings } from '../models/System';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SettingController {
  static async getSettings(req: Request, res: Response) {
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({});
      }
      res.json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create(req.body);
      } else {
        Object.assign(settings, req.body);
        await settings.save();
      }

      await AuditService.log('SETTINGS_UPDATED', 'admin', req.user?.id, req.ip, req.headers['user-agent']);
      res.json({ success: true, message: 'Settings updated successfully', data: settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
