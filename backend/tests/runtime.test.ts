import { shouldAutoSeedDatabase } from '../src/config/env';

describe('database seed runtime protection', () => {
  test('allows explicit auto-seeding only in local development', () => {
    expect(shouldAutoSeedDatabase(true, { NODE_ENV: 'development' })).toBe(true);
    expect(shouldAutoSeedDatabase(false, { NODE_ENV: 'development' })).toBe(false);
  });

  test('never auto-seeds production or Vercel deployments', () => {
    expect(shouldAutoSeedDatabase(true, { NODE_ENV: 'production' })).toBe(false);
    expect(shouldAutoSeedDatabase(true, { NODE_ENV: 'development', VERCEL: '1' })).toBe(false);
    expect(shouldAutoSeedDatabase(true, { NODE_ENV: 'development', VERCEL_ENV: 'production' })).toBe(false);
  });
});
