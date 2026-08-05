import request from 'supertest';
import { app } from '../src/server';
import { buildSettingsUpdate } from '../src/controllers/setting.controller';

describe('production readiness safeguards', () => {
  test('exposes only minimal liveness and readiness probe responses', async () => {
    const live = await request(app).get('/health/live');
    expect(live.status).toBe(200);
    expect(live.body).toEqual({ status: 'ok' });
    expect(Object.keys(live.body)).not.toContain('service');

    const ready = await request(app).get('/health/ready');
    expect([200, 503]).toContain(ready.status);
    expect(['ready', 'not_ready']).toContain(ready.body.status);
    expect(Object.keys(ready.body)).toEqual(['status']);
  });

  test('does not accept operational credentials through Settings updates', () => {
    expect(buildSettingsUpdate({
      platformName: 'Kiyo',
      g2bulkApiKey: 'provider-secret',
      abaPayWayApiKey: 'payment-secret',
      telegramBotToken: 'bot-secret'
    })).toEqual({ platformName: 'Kiyo' });
  });
});
