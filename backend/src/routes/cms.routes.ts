import { Router } from 'express';
import { CMSController } from '../controllers/cms.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/banners', CMSController.getBanners);
router.get('/blogs', CMSController.getBlogs);
router.get('/blogs/:slug', CMSController.getBlogBySlug);
router.get('/coupons/validate/:code', CMSController.validateCoupon);
router.get('/coupons/active', CMSController.getActiveCoupons);
router.get('/promotions/active', CMSController.getActivePromotions);

// Admin
router.post('/banners', authenticateJwt, requirePermission('cms:write'), CMSController.createBanner);
router.post('/coupons', authenticateJwt, requirePermission('cms:write'), CMSController.createCoupon);
router.get('/coupons', authenticateJwt, requirePermission('cms:read'), CMSController.getCoupons);
router.put('/coupons/:id', authenticateJwt, requirePermission('cms:write'), CMSController.updateCoupon);
router.delete('/coupons/:id', authenticateJwt, requirePermission('cms:write'), CMSController.deleteCoupon);
router.get('/promotions', authenticateJwt, requirePermission('cms:read'), CMSController.getPromotions);
router.post('/promotions', authenticateJwt, requirePermission('cms:write'), CMSController.createPromotion);
router.put('/promotions/:id', authenticateJwt, requirePermission('cms:write'), CMSController.updatePromotion);
router.delete('/promotions/:id', authenticateJwt, requirePermission('cms:write'), CMSController.deletePromotion);

export default router;
