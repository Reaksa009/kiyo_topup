import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

export class CustomerController {
  static async getSavedAccounts(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const user = await User.findById(req.user.id);
      res.json({ success: true, data: user?.savedPlayerIds || [] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await User.find().select('-passwordHash').sort({ createdAt: -1 });
      res.json({ success: true, count: customers.length, data: customers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const { amount, action } = req.body; // action: 'add' | 'subtract'

      const user = await User.findById(customerId);
      if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });

      if (action === 'add') {
        user.walletBalance += amount;
      } else {
        user.walletBalance = Math.max(0, user.walletBalance - amount);
      }

      await user.save();

      await AuditService.log('CUSTOMER_BALANCE_ADJUSTED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], {
        customerId,
        amount,
        action,
        newBalance: user.walletBalance
      });

      res.json({ success: true, message: 'Customer balance updated successfully', data: { walletBalance: user.walletBalance } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
