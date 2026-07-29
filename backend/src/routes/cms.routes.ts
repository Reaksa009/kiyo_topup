import { Router } from 'express';
import { CMSController } from '../controllers/cms.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/banners', CMSController.getBanners);
router.get('/blogs', CMSController.getBlogs);
router.get('/blogs/:slug', CMSController.getBlogBySlug);
router.get('/coupons/validate/:code', CMSController.validateCoupon);

// Admin
router.post('/banners', authenticateJwt, requirePermission('cms:write'), CMSController.createBanner);
router.post('/coupons', authenticateJwt, requirePermission('cms:write'), CMSController.createCoupon);
router.get('/coupons', authenticateJwt, requirePermission('cms:read'), CMSController.getCoupons);

export default router;
