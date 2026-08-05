import { Order } from '../models/Order';
import { exceedsProviderCostTolerance } from './pricing.service';

export class PriceReviewService {
  static async requireIfProviderCostExceedsTolerance(orderId: string, observedProviderCostMinor: number) {
    const order = await Order.findById(orderId);
    if (!order || order.overallStatus === 'completed') return null;
    const previousCostMinor = order.providerCostMinor ?? Math.round(order.costPrice * 100);
    if (!exceedsProviderCostTolerance(previousCostMinor, observedProviderCostMinor)) return null;
    return Order.findOneAndUpdate(
      { _id: orderId, priceReviewStatus: { $ne: 'required' }, overallStatus: { $nin: ['completed', 'refunded'] } },
      { $set: { priceReviewStatus: 'required', priceReviewReason: 'Provider cost exceeds configured tolerance.', overallStatus: 'price_review_required', observedProviderCostMinor } },
      { new: true }
    );
  }

  static async decide(orderId: string, decision: 'approved' | 'rejected', adminId: string) {
    return Order.findOneAndUpdate(
      { _id: orderId, priceReviewStatus: 'required', overallStatus: 'price_review_required' },
      { $set: { priceReviewStatus: decision, priceReviewDecisionBy: adminId, priceReviewDecidedAt: new Date(), overallStatus: decision === 'approved' ? 'pending' : 'failed' } },
      { new: true }
    );
  }
}
