import { env } from '../config/env';
import { minorToMajor, readProviderBasePriceMinor, readSellingPriceMinor } from '../utils/money';

export interface PackagePricingInput {
  providerBasePriceMinor?: number;
  sellingPriceMinor?: number;
  fixedSellingPriceMinor?: number;
  markupValueMinor?: number;
  markupPercentBasisPoints?: number;
  pricingMode?: 'automatic' | 'fixed';
  markupType?: 'percentage' | 'fixed';
  price?: number;
  costPrice?: number;
}

export interface PriceCalculation { providerCostMinor: number; sellingPriceMinor: number; profitMinor: number; }

export const calculateSellingPriceMinor = (
  input: PackagePricingInput,
  options: { minimumProfitMinor?: number; allowBelowCost?: boolean } = {}
): PriceCalculation => {
  const providerCostMinor = readProviderBasePriceMinor(input);
  const minimumProfitMinor = options.minimumProfitMinor ?? env.MINIMUM_PROFIT_MINOR;
  if (!Number.isSafeInteger(minimumProfitMinor) || minimumProfitMinor < 0) throw new Error('Invalid minimum profit configuration');

  let sellingPriceMinor: number;
  if (!input.pricingMode || input.pricingMode === 'fixed') {
    sellingPriceMinor = input.fixedSellingPriceMinor ?? readSellingPriceMinor(input);
  } else if (input.markupType === 'percentage') {
    const bps = input.markupPercentBasisPoints;
    if (typeof bps !== 'number' || !Number.isSafeInteger(bps) || bps < 0) throw new Error('Invalid percentage markup');
    const percentageBps = bps;
    sellingPriceMinor = Math.round((providerCostMinor * (10000 + percentageBps)) / 10000);
  } else if (input.markupType === 'fixed') {
    const markup = input.markupValueMinor;
    if (typeof markup !== 'number' || !Number.isSafeInteger(markup) || markup < 0) throw new Error('Invalid fixed markup');
    sellingPriceMinor = providerCostMinor + markup;
  } else {
    throw new Error('Invalid pricing configuration');
  }

  if (!Number.isSafeInteger(sellingPriceMinor) || sellingPriceMinor < 0) throw new Error('Invalid selling price');
  const profitMinor = sellingPriceMinor - providerCostMinor;
  if (!options.allowBelowCost && profitMinor < minimumProfitMinor) throw new Error('Selling price is below the required provider-cost margin');
  return { providerCostMinor, sellingPriceMinor, profitMinor };
};

export const calculateLegacyOrderPrice = (pkg: PackagePricingInput): PriceCalculation & { amount: number; costPrice: number; profit: number } => {
  const calculated = calculateSellingPriceMinor(pkg);
  return {
    ...calculated,
    amount: minorToMajor(calculated.sellingPriceMinor, 'USD'),
    costPrice: minorToMajor(calculated.providerCostMinor, 'USD'),
    profit: minorToMajor(calculated.profitMinor, 'USD')
  };
};

export const exceedsProviderCostTolerance = (previousCostMinor: number, observedCostMinor: number, toleranceBasisPoints = env.MAX_PROVIDER_PRICE_CHANGE_BPS): boolean => {
  if (!Number.isSafeInteger(previousCostMinor) || previousCostMinor < 0 || !Number.isSafeInteger(observedCostMinor) || observedCostMinor < 0) throw new Error('Invalid provider cost');
  if (!Number.isSafeInteger(toleranceBasisPoints) || toleranceBasisPoints < 0) throw new Error('Invalid provider cost tolerance');
  return observedCostMinor > previousCostMinor + Math.floor((previousCostMinor * toleranceBasisPoints) / 10000);
};
