import { Request, Response } from 'express';
import { Package } from '../models/Game';
import { Settings } from '../models/System';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class PackageController {
  static async getPackagesByGame(req: Request, res: Response) {
    try {
      // Check if catalog synchronization lock is enabled
      const settings = await Settings.findOne();
      if (settings?.isSyncing) {
        return res.status(503).json({
          success: false,
          message: "Catalog is updating. Please try again in a few minutes."
        });
      }

      const { gameId } = req.params;
      const packages = await Package.find({ gameId, status: 'active' }).sort({ sortOrder: 1, price: 1 });
      res.json({ success: true, count: packages.length, data: packages });
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
      const pkg = await Package.findById(id);
      if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

      if (req.body.price !== undefined) {
        const newPrice = parseFloat(req.body.price);
        if (newPrice < pkg.costPrice) {
          return res.status(400).json({
            success: false,
            message: `Retail price ($${newPrice.toFixed(2)}) cannot be less than G2Bulk wholesale cost ($${pkg.costPrice.toFixed(2)}).`
          });
        }
      }

      Object.assign(pkg, req.body);
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
