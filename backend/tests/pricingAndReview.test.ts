jest.mock('../src/models/Order', () => ({ Order: { findById: jest.fn(), findOneAndUpdate: jest.fn() } }));

import { Order } from '../src/models/Order';
import { calculateLegacyOrderPrice, calculateSellingPriceMinor, exceedsProviderCostTolerance } from '../src/services/pricing.service';
import { PriceReviewService } from '../src/services/priceReview.service';

describe('server-side pricing and provider price review', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calculates percentage, fixed-markup, and fixed selling prices in minor units', () => {
    expect(calculateSellingPriceMinor({ providerBasePriceMinor: 100, pricingMode: 'automatic', markupType: 'percentage', markupPercentBasisPoints: 1500 })).toMatchObject({ sellingPriceMinor: 115, profitMinor: 15 });
    expect(calculateSellingPriceMinor({ providerBasePriceMinor: 100, pricingMode: 'automatic', markupType: 'fixed', markupValueMinor: 20 })).toMatchObject({ sellingPriceMinor: 120 });
    expect(calculateSellingPriceMinor({ providerBasePriceMinor: 100, pricingMode: 'fixed', fixedSellingPriceMinor: 150 })).toMatchObject({ sellingPriceMinor: 150 });
  });

  test('rounds deterministically and rejects invalid prices or margin violations', () => {
    expect(calculateSellingPriceMinor({ providerBasePriceMinor: 101, pricingMode: 'automatic', markupType: 'percentage', markupPercentBasisPoints: 500 })).toMatchObject({ sellingPriceMinor: 106 });
    expect(() => calculateSellingPriceMinor({ providerBasePriceMinor: 100, pricingMode: 'automatic', markupType: 'fixed', markupValueMinor: -1 })).toThrow('Invalid fixed markup');
    expect(() => calculateSellingPriceMinor({ providerBasePriceMinor: 100, pricingMode: 'fixed', fixedSellingPriceMinor: 99 })).toThrow('margin');
  });

  test('uses persisted package configuration instead of a frontend price', () => {
    const price = calculateLegacyOrderPrice({ providerBasePriceMinor: 100, pricingMode: 'automatic', markupType: 'fixed', markupValueMinor: 25, price: 0.01, costPrice: 0.01 });
    expect(price.amount).toBe(1.25);
    expect(price.costPrice).toBe(1);
  });

  test('only requires review when a verified observed cost exceeds tolerance', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ _id: 'order', overallStatus: 'pending', providerCostMinor: 100, costPrice: 1 });
    expect(exceedsProviderCostTolerance(100, 105, 500)).toBe(false);
    expect(await PriceReviewService.requireIfProviderCostExceedsTolerance('order', 105)).toBeNull();
    (Order.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'order', priceReviewStatus: 'required' });
    expect(await PriceReviewService.requireIfProviderCostExceedsTolerance('order', 106)).toMatchObject({ priceReviewStatus: 'required' });
  });

  test('uses an atomic condition to prevent duplicate review decisions', async () => {
    (Order.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: 'order', priceReviewStatus: 'approved' }).mockResolvedValueOnce(null);
    expect(await PriceReviewService.decide('order', 'approved', 'admin')).toMatchObject({ priceReviewStatus: 'approved' });
    expect(await PriceReviewService.decide('order', 'approved', 'admin')).toBeNull();
    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(expect.objectContaining({ priceReviewStatus: 'required' }), expect.anything(), { new: true });
  });
});
