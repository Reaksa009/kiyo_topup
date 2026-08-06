import { Request, Response } from 'express';
import { Package } from '../models/Package';
import { Settings } from '../models/System';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { packageUpdateSchema } from '../validation/catalog.schemas';
import { toPublicPackageDTO } from '../utils/publicCatalog';
import { calculateSellingPriceMinor } from '../services/pricing.service';

export class PackageController {
  static async getPackagesByGame(req: Request, res: Response) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=10');
      res.setHeader('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');

      const { gameId } = req.params;
      const timedRes = res as any;
      if (timedRes.startTime) timedRes.startTime('db_packages_by_game', 'Fetch Game Packages');
      const packages = await Package.find({ gameId, status: 'active' })
        .select('_id gameId title description icon price packageAmount packageType discountPercent badge stock status sortOrder supportsBoth')
        .sort({ sortOrder: 1, price: 1 }).lean();
      if (timedRes.endTime) timedRes.endTime('db_packages_by_game');

      res.json({ success: true, count: packages.length, data: packages.map((pkg) => toPublicPackageDTO(pkg)) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Admin catalog view: return every MongoDB package for a game, including
   * inactive and out-of-stock records. The public endpoint intentionally
   * returns active packages only so hidden catalog entries never reach buyers.
   */
  static async getAllPackagesByGame(req: AuthenticatedRequest, res: Response) {
    try {
      const { gameId } = req.params;
      const packages = await Package.find({ gameId }).sort({ status: 1, sortOrder: 1, price: 1 }).lean();
      res.json({
        success: true,
        count: packages.length,
        activeCount: packages.filter((pkg) => pkg.status === 'active').length,
        data: packages
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createPackage(req: AuthenticatedRequest, res: Response) {
    try {
      const pkg = await Package.create(req.body);
      await AuditService.log('PACKAGE_CREATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { packageId: pkg._id });
      res.status(201).json({ success: true, message: 'Package created successfully', data: pkg });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updatePackage(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsed = packageUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed for request payload', errors: parsed.error.errors.map((error) => ({ field: error.path.join('.'), message: error.message })) });
      const pkg = await Package.findById(id);
      if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

      if (parsed.data.price !== undefined) {
        const newPrice = parsed.data.price;
        if (newPrice < pkg.costPrice) {
          return res.status(400).json({
            success: false,
            message: `Retail price ($${newPrice.toFixed(2)}) cannot be less than G2Bulk wholesale cost ($${pkg.costPrice.toFixed(2)}).`
          });
        }
      }

      Object.assign(pkg, parsed.data);
      if (parsed.data.isEnabled !== undefined) pkg.status = parsed.data.isEnabled ? 'active' : 'inactive';
      if (parsed.data.pricingMode || parsed.data.markupType || parsed.data.markupPercentBasisPoints !== undefined || parsed.data.markupValueMinor !== undefined || parsed.data.fixedSellingPriceMinor !== undefined) {
        const calculated = calculateSellingPriceMinor(pkg);
        pkg.sellingPriceMinor = calculated.sellingPriceMinor;
      }
      await pkg.save();

      await AuditService.log('PACKAGE_UPDATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { packageId: pkg._id });
      res.json({ success: true, message: 'Package updated successfully', data: pkg });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deletePackage(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await Package.findByIdAndDelete(id);
      await AuditService.log('PACKAGE_DELETED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { packageId: id });
      res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
