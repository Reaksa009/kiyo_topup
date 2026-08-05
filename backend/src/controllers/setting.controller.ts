import { Request, Response } from 'express';
import { Settings } from '../models/System';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const PUBLIC_SETTING_FIELDS = [
  'platformName',
  'logoUrl',
  'maintenanceMode',
  'contactEmail',
  'contactTelegram'
] as const;

const ADMIN_EDITABLE_FIELDS = [
  ...PUBLIC_SETTING_FIELDS,
] as const;

const SECRET_SETTING_FIELDS = [
  'abaPayWayApiKey',
  'bakongApiToken',
  'g2bulkApiKey',
  'g2bulkApiSecret',
  'telegramBotToken'
] as const;

export const buildSettingsUpdate = (body: Record<string, any>) => {
  const update: Record<string, any> = {};
  for (const field of ADMIN_EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) update[field] = body[field];
  }
  return update;
};

export const buildPublicSettings = (settings: Record<string, any> | null) => {
  const source = settings || {};
  return Object.fromEntries(PUBLIC_SETTING_FIELDS.map((field) => [field, source[field]]));
};

const buildMaskedAdminSettings = (settings: Record<string, any>) => {
  const safe: Record<string, any> = {};
  for (const field of ADMIN_EDITABLE_FIELDS) safe[field] = settings[field];
  for (const field of SECRET_SETTING_FIELDS) safe[field] = '';
  safe.configuredSecrets = Object.fromEntries(
    SECRET_SETTING_FIELDS.map((field) => [field, Boolean(settings[field])])
  );
  safe.updatedAt = settings.updatedAt;
  return safe;
};

const allEditableFields = new Set<string>(ADMIN_EDITABLE_FIELDS);

export class SettingController {
  static async getPublicSettings(req: Request, res: Response) {
    try {
      const selection = PUBLIC_SETTING_FIELDS.join(' ');
      const settings = await Settings.findOne().select(selection).lean();
      res.json({ success: true, data: buildPublicSettings(settings as any) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Unable to load public platform settings.' });
    }
  }

  static async getSettings(req: Request, res: Response) {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create({});
      const masked = buildMaskedAdminSettings(settings.toObject());
      res.json({ success: true, data: masked });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Unable to load settings.' });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const body = req.body || {};
      const unknownFields = Object.keys(body).filter((field) => !allEditableFields.has(field));
      if (unknownFields.length) return res.status(400).json({ success: false, message: 'Validation failed for request payload', errors: unknownFields.map((field) => ({ field, message: 'Unsupported settings field' })) });
      const update = buildSettingsUpdate(body);
      if (Object.keys(update).length === 0) {
        return res.status(400).json({ success: false, message: 'No supported settings were provided.' });
      }

      const settings = await Settings.findOneAndUpdate(
        {},
        { $set: update },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      await AuditService.log('SETTINGS_UPDATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], {
        fields: Object.keys(update)
      });
      res.json({
        success: true,
        message: 'Settings updated successfully.',
        data: buildMaskedAdminSettings(settings.toObject())
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Unable to update settings.' });
    }
  }
}
