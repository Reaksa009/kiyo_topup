import { buildPublicSettings, buildSettingsUpdate } from '../src/controllers/setting.controller';

describe('settings data exposure protection', () => {
  test('public settings contain only storefront-safe fields', () => {
    const result = buildPublicSettings({
      platformName: 'KIYO TOPUP',
      logoUrl: '/logo.png',
      maintenanceMode: false,
      contactEmail: 'support@example.com',
      contactTelegram: '@support',
      abaPayWayApiKey: 'must-not-leak',
      bakongApiToken: 'must-not-leak',
      g2bulkApiKey: 'must-not-leak',
      g2bulkApiSecret: 'must-not-leak',
      telegramBotToken: 'must-not-leak',
      catalogSyncToken: 'must-not-leak'
    });

    expect(result).toEqual({
      platformName: 'KIYO TOPUP',
      logoUrl: '/logo.png',
      maintenanceMode: false,
      contactEmail: 'support@example.com',
      contactTelegram: '@support'
    });
    expect(Object.keys(result)).not.toContain('g2bulkApiKey');
    expect(Object.keys(result)).not.toContain('bakongApiToken');
  });

  test('settings updates reject operational credentials and only retain storefront fields', () => {
    const result = buildSettingsUpdate({
      platformName: 'Kiyo Secure',
      maintenanceMode: true,
      isSyncing: false,
      catalogSyncStatus: 'success',
      catalogSyncToken: 'attacker-controlled',
      g2bulkApiKey: 'new-secret',
      unknownField: 'ignored'
    });

    expect(result).toEqual({
      platformName: 'Kiyo Secure',
      maintenanceMode: true
    });
  });
});
