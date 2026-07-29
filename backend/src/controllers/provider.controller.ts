import { Request, Response } from 'express';
import { ProviderFactory } from '../services/providers/ProviderFactory';
import { ProviderLog } from '../models/Provider';

export class ProviderController {
  static async getBalance(req: Request, res: Response) {
    try {
      const providerType = (req.params.providerType as string) || 'G2BULK';
      const provider = ProviderFactory.getProvider(providerType);
      const balanceData = await provider.getBalance();
      res.json({ success: true, data: balanceData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLogs(req: Request, res: Response) {
    try {
      const logs = await ProviderLog.find().sort({ createdAt: -1 }).limit(100);
      res.json({ success: true, count: logs.length, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
