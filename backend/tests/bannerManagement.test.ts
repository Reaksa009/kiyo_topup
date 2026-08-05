import { Banner } from '../src/models/CMS';
import { buildActiveBannerFilter, toPublicBannerDTO } from '../src/controllers/cms.controller';
import { bannerWriteSchema } from '../src/validation/catalog.schemas';
import cmsRoutes from '../src/routes/cms.routes';
import { resolveBannerImages } from '../../frontend/src/utils/bannerPresentation';

describe('responsive banner management', () => {
  test('adds compatibility and responsive banner fields with a query index', () => {
    expect(Banner.schema.path('imageUrl')).toBeDefined();
    expect(Banner.schema.path('desktopImageUrl')).toBeDefined();
    expect(Banner.schema.path('mobileImageUrl')).toBeDefined();
    expect(Banner.schema.indexes().map(([keys]) => keys)).toContainEqual({ active: 1, enabled: 1, placement: 1, gameId: 1, startDate: 1, endDate: 1, sortOrder: 1 });
  });

  test('validates image, placement, game assignment, and date windows', () => {
    expect(bannerWriteSchema.safeParse({ title: 'Home', desktopImageUrl: 'https://example.com/a.jpg', placement: 'home' }).success).toBe(true);
    expect(bannerWriteSchema.safeParse({ title: 'Missing image', placement: 'home' }).success).toBe(false);
    expect(bannerWriteSchema.safeParse({ title: 'Detail', imageUrl: 'https://example.com/a.jpg', placement: 'game-detail' }).success).toBe(false);
    expect(bannerWriteSchema.safeParse({ title: 'Dates', imageUrl: 'https://example.com/a.jpg', placement: 'home', startDate: '2027-02-01', endDate: '2027-01-01' }).success).toBe(false);
    expect(bannerWriteSchema.safeParse({ title: 'Unknown', imageUrl: 'https://example.com/a.jpg', providerRawData: {} }).success).toBe(false);
  });

  test('filters active date-windowed banners and retains legacy home banners', () => {
    const filter = buildActiveBannerFilter('home', undefined, new Date('2027-01-01T00:00:00.000Z'));
    expect(filter.active).toBe(true);
    expect(filter.enabled).toEqual({ $ne: false });
    expect(filter.$and).toHaveLength(3);
    const detail = buildActiveBannerFilter('game-detail', 'game-id');
    expect(detail.placement).toBe('game-detail');
    expect(detail.gameId).toBe('game-id');
  });

  test('only maps safe presentation fields and preserves legacy button/image fallbacks', () => {
    const dto = toPublicBannerDTO({ _id: 'banner', title: 'Legacy', imageUrl: 'legacy.jpg', linkUrl: '/games', providerRawData: { secret: 'nope' }, enabled: false });
    expect(dto).toEqual(expect.objectContaining({ imageUrl: 'legacy.jpg', buttonUrl: '/games', placement: 'home' }));
    expect(dto).not.toHaveProperty('providerRawData');
    expect(dto).not.toHaveProperty('enabled');
  });

  test('applies customer image fallback priority for desktop and mobile', () => {
    expect(resolveBannerImages({ title: 'Full', desktopImageUrl: 'desktop.jpg', mobileImageUrl: 'mobile.jpg' }, 'fallback.jpg')).toEqual({ desktop: 'desktop.jpg', mobile: 'mobile.jpg' });
    expect(resolveBannerImages({ title: 'Desktop', desktopImageUrl: 'desktop.jpg', imageUrl: 'legacy.jpg' }, 'fallback.jpg')).toEqual({ desktop: 'desktop.jpg', mobile: 'desktop.jpg' });
    expect(resolveBannerImages({ title: 'Legacy', imageUrl: 'legacy.jpg' }, 'fallback.jpg')).toEqual({ desktop: 'legacy.jpg', mobile: 'legacy.jpg' });
    expect(resolveBannerImages({ title: 'Fallback' }, 'fallback.jpg')).toEqual({ desktop: 'fallback.jpg', mobile: 'fallback.jpg' });
  });

  test('protects banner administration with existing authentication and CMS permissions', () => {
    const routes = (cmsRoutes as any).stack.filter((layer: any) => layer.route);
    for (const [path, method] of [['/banners', 'post'], ['/banners/admin', 'get'], ['/banners/:id', 'put']]) {
      const route = routes.find((layer: any) => layer.route.path === path && layer.route.methods[method]);
      expect(route).toBeDefined();
      expect(route.route.stack).toHaveLength(3);
      expect(route.route.stack[0].handle.name).toBe('authenticateJwt');
    }
  });
});
