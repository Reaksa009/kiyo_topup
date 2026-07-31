import { Request, Response } from 'express';
import { Admin, Role, Permission } from '../models/Admin';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { ActivityLog } from '../models/System';
import { ProviderFactory } from '../services/providers/ProviderFactory';

export class AdminController {
  static async getDashboardMetrics(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const providerBalancePromise = ProviderFactory.getProvider('G2BULK')
        .getBalance()
        .then((result) => ({ balance: Number(result.balance) || 0, online: true, error: '' }))
        .catch((error: any) => ({ balance: null, online: false, error: error.message || 'Provider unavailable' }));

      const [
        totalRevenueAgg,
        todayRevenueAgg,
        totalOrders,
        totalUsers,
        pendingOrders,
        providerHealth,
        recentOrders
      ] = await Promise.all([
        Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' }, profit: { $sum: '$profit' } } }
        ]),
        Order.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Order.countDocuments(),
        User.countDocuments(),
        Order.countDocuments({ overallStatus: 'pending' }),
        providerBalancePromise,
        Order.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select('orderNumber gameTitle packageTitle amount profit overallStatus createdAt')
          .lean()
      ]);

      res.json({
        success: true,
        data: {
          metrics: {
            totalRevenue: totalRevenueAgg[0]?.total || 0,
            totalProfit: totalRevenueAgg[0]?.profit || 0,
            todayRevenue: todayRevenueAgg[0]?.total || 0,
            todayOrders: todayRevenueAgg[0]?.count || 0,
            totalOrders,
            totalUsers,
            pendingOrders,
            providerBalance: providerHealth.balance,
            providerOnline: providerHealth.online,
            providerError: providerHealth.error
          },
          recentOrders
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await Role.find();
      res.json({ success: true, data: roles });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createRole(req: Request, res: Response) {
    try {
      const role = await Role.create(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getActivityLogs(req: Request, res: Response) {
    try {
      const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
