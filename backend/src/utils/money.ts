export type SupportedCurrency = 'USD' | 'KHR';

const fractionDigits = (currency: SupportedCurrency) => currency === 'KHR' ? 0 : 2;

export const majorToMinor = (value: number, currency: SupportedCurrency = 'USD'): number => {
  if (!Number.isFinite(value) || value < 0) throw new Error('Money value must be a non-negative finite number');
  return Math.round(value * (10 ** fractionDigits(currency)));
};

export const minorToMajor = (value: number, currency: SupportedCurrency = 'USD'): number => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Money minor value must be a non-negative safe integer');
  return value / (10 ** fractionDigits(currency));
};

export const readSellingPriceMinor = (pkg: { sellingPriceMinor?: number; price?: number; displayCurrency?: SupportedCurrency }): number =>
  Number.isSafeInteger(pkg.sellingPriceMinor) && (pkg.sellingPriceMinor as number) >= 0
    ? pkg.sellingPriceMinor as number
    : majorToMinor(pkg.price ?? 0, pkg.displayCurrency || 'USD');

export const readProviderBasePriceMinor = (pkg: { providerBasePriceMinor?: number; costPrice?: number; providerCurrency?: SupportedCurrency }): number =>
  Number.isSafeInteger(pkg.providerBasePriceMinor) && (pkg.providerBasePriceMinor as number) >= 0
    ? pkg.providerBasePriceMinor as number
    : majorToMinor(pkg.costPrice ?? 0, pkg.providerCurrency || 'USD');
