import { Request, Response } from 'express';
import { Banner, Blog, Coupon, Promotion } from '../models/CMS';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const discountIsInvalid = (discountType: string, discountValue: unknown) => {
  const value = Number(discountValue);
  return !Number.isFinite(value) || value <= 0 || (discountType === 'percentage' && value > 100);
};

export class CMSController {
  // Public
  static async getBanners(req: Request, res: Response) {
    try {
      const banners = await Banner.find({ active: true }).sort({ sortOrder: 1 });
      res.json({ success: true, data: banners });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getBlogs(req: Request, res: Response) {
    try {
      const blogs = await Blog.find({ status: 'published' }).sort({ createdAt: -1 });
      res.json({ success: true, data: blogs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getBlogBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const blog = await Blog.findOne({ slug, status: 'published' });
      if (!blog) return res.status(404).json({ success: false, message: 'Article not found' });
      res.json({ success: true, data: blog });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async validateCoupon(req: Request, res: Response) {
    try {
      const code = req.params.code as string;
      const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
      if (!coupon || coupon.expiryDate < new Date() || coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ success: false, message: 'Coupon code is invalid or expired' });
      }

      res.json({
        success: true,
        data: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getActiveCoupons(req: Request, res: Response) {
    try {
      const now = new Date();
      const coupons = await Coupon.find({
        active: true,
        expiryDate: { $gt: now },
        $expr: { $lt: ['$usedCount', '$maxUses'] }
      })
        .sort({ expiryDate: 1 })
        .select('code discountType discountValue minOrderAmount expiryDate maxUses usedCount')
        .lean();
      res.json({ success: true, data: coupons });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getActivePromotions(req: Request, res: Response) {
    try {
      const now = new Date();
      const promotions = await Promotion.find({ active: true, startDate: { $lte: now }, endDate: { $gt: now } })
        .sort({ endDate: 1 })
        .select('title bannerUrl targetGameIds discountType discountValue startDate endDate')
        .lean();
      res.json({ success: true, data: promotions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin CMS CRUD
  static async createBanner(req: AuthenticatedRequest, res: Response) {
    try {
      const banner = await Banner.create(req.body);
      res.status(201).json({ success: true, data: banner });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createCoupon(req: AuthenticatedRequest, res: Response) {
    try {
      if (discountIsInvalid(req.body.discountType, req.body.discountValue)) {
        return res.status(400).json({ success: false, message: 'Discount must be positive and percentage discounts cannot exceed 100%.' });
      }
      const coupon = await Coupon.create({ ...req.body, code: String(req.body.code || '').trim().toUpperCase() });
      await AuditService.log('COUPON_CREATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { couponId: coupon._id, code: coupon.code });
      res.status(201).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? 'Coupon code already exists.' : error.message });
    }
  }

  static async getCoupons(req: Request, res: Response) {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      res.json({ success: true, data: coupons });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateCoupon(req: AuthenticatedRequest, res: Response) {
    try {
      const update = { ...req.body };
      if (update.code !== undefined) update.code = String(update.code).trim().toUpperCase();
      delete update.usedCount;
      const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
      if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
      await AuditService.log('COUPON_UPDATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { couponId: coupon._id, code: coupon.code });
      res.json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? 'Coupon code already exists.' : error.message });
    }
  }

  static async deleteCoupon(req: AuthenticatedRequest, res: Response) {
    try {
      const coupon = await Coupon.findByIdAndDelete(req.params.id);
      if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
      await AuditService.log('COUPON_DELETED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { couponId: coupon._id, code: coupon.code });
      res.json({ success: true, message: 'Coupon deleted.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getPromotions(req: Request, res: Response) {
    try {
      const promotions = await Promotion.find().sort({ createdAt: -1 });
      res.json({ success: true, data: promotions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createPromotion(req: AuthenticatedRequest, res: Response) {
    try {
      if (discountIsInvalid(req.body.discountType, req.body.discountValue)) {
        return res.status(400).json({ success: false, message: 'Discount must be positive and percentage discounts cannot exceed 100%.' });
      }
      if (new Date(req.body.endDate) <= new Date(req.body.startDate)) {
        return res.status(400).json({ success: false, message: 'Promotion end date must be after its start date.' });
      }
      const promotion = await Promotion.create(req.body);
      await AuditService.log('PROMOTION_CREATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { promotionId: promotion._id, title: promotion.title });
      res.status(201).json({ success: true, data: promotion });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updatePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const current = await Promotion.findById(req.params.id);
      if (!current) return res.status(404).json({ success: false, message: 'Promotion not found.' });
      const startDate = req.body.startDate ? new Date(req.body.startDate) : current.startDate;
      const endDate = req.body.endDate ? new Date(req.body.endDate) : current.endDate;
      if (endDate <= startDate) {
        return res.status(400).json({ success: false, message: 'Promotion end date must be after its start date.' });
      }
      Object.assign(current, req.body);
      await current.save();
      await AuditService.log('PROMOTION_UPDATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { promotionId: current._id, title: current.title });
      res.json({ success: true, data: current });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deletePromotion(req: AuthenticatedRequest, res: Response) {
    try {
      const promotion = await Promotion.findByIdAndDelete(req.params.id);
      if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found.' });
      await AuditService.log('PROMOTION_DELETED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { promotionId: promotion._id, title: promotion.title });
      res.json({ success: true, message: 'Promotion deleted.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
