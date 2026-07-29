import { Request, Response } from 'express';
import { Banner, Blog, Coupon, Promotion } from '../models/CMS';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

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
      const coupon = await Coupon.create(req.body);
      res.status(201).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
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
}
