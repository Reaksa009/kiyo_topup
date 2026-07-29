import { Request, Response } from 'express';
import { Order } from '../models/Order';

export class ReportController {
  static async getRevenueReport(req: Request, res: Response) {
    try {
      const revenueByDate = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' },
            cost: { $sum: '$costPrice' },
            profit: { $sum: '$profit' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]);

      const topGames = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: '$gameTitle',
            totalRevenue: { $sum: '$amount' },
            totalOrders: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ]);

      res.json({
        success: true,
        data: {
          chartData: revenueByDate.map((r) => ({
            date: r._id,
            revenue: r.revenue,
            cost: r.cost,
            profit: r.profit,
            orders: r.orderCount
          })),
          topGames
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
