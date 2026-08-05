import { z } from 'zod';

const finiteNumber = z.coerce.number().finite();
const optionalText = z.string().trim().max(2000).optional();

export const gameUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  slug: z.string().trim().min(1).max(160).optional(),
  publisher: z.string().trim().min(1).max(160).optional(),
  thumbnail: z.string().trim().max(2048).optional(),
  bannerUrl: z.string().trim().max(2048).optional(),
  categoryId: z.string().trim().optional(),
  inputFields: z.array(z.object({
    name: z.string().trim().min(1).max(100), label: z.string().trim().min(1).max(160),
    placeholder: z.string().max(250).optional(), type: z.enum(['text', 'number', 'select']).optional(),
    required: z.boolean().optional(), options: z.array(z.string().max(160)).optional(),
    regexPattern: z.string().max(500).optional(), helpText: z.string().max(500).optional()
  }).strict()).max(20).optional(),
  instructions: optionalText,
  isPopular: z.boolean().optional(), isFlashSale: z.boolean().optional(),
  status: z.enum(['active', 'maintenance', 'inactive']).optional(), sortOrder: finiteNumber.int().min(0).max(100000).optional(),
  seoTitle: z.string().trim().max(160).optional(), seoDescription: z.string().trim().max(320).optional()
}).strict();

export const packageUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(), description: optionalText,
  icon: z.string().trim().max(2048).optional(), price: finiteNumber.min(0).optional(),
  packageAmount: z.string().trim().max(160).optional(), packageType: z.string().trim().max(160).optional(),
  catalogKey: z.string().trim().max(200).optional(), discountPercent: finiteNumber.min(0).max(100).optional(),
  badge: z.string().trim().max(160).optional(), stock: finiteNumber.int().min(-1).optional(),
  status: z.enum(['active', 'out_of_stock', 'inactive']).optional(), sortOrder: finiteNumber.int().min(0).max(100000).optional(),
  supportsBoth: z.boolean().optional(), bonusText: z.string().trim().max(500).optional(),
  pricingMode: z.enum(['automatic', 'fixed']).optional(), markupType: z.enum(['percentage', 'fixed']).optional(),
  markupPercentBasisPoints: finiteNumber.int().min(0).max(1000000).optional(), markupValueMinor: finiteNumber.int().min(0).optional(),
  fixedSellingPriceMinor: finiteNumber.int().min(0).optional(), displayCurrency: z.enum(['USD', 'KHR']).optional(),
  isEnabled: z.boolean().optional(), isFeatured: z.boolean().optional()
}).strict();

export const providerPricingConfigurationSchema = z.object({
  pricingMode: z.enum(['automatic', 'fixed']),
  markupType: z.enum(['percentage', 'fixed']).optional(),
  markupPercentBasisPoints: z.number().int().min(0).max(1000000).optional(),
  markupValueMinor: z.number().int().min(0).optional(),
  fixedSellingPriceMinor: z.number().int().min(0).optional(),
  providerBasePriceMinor: z.number().int().min(0).optional()
}).strict().superRefine((value, context) => {
  if (value.pricingMode === 'fixed' && value.fixedSellingPriceMinor === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['fixedSellingPriceMinor'], message: 'Required for fixed pricing' });
  }
  if (value.pricingMode === 'automatic' && value.markupType === 'percentage' && value.markupPercentBasisPoints === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['markupPercentBasisPoints'], message: 'Required for percentage markup' });
  }
  if (value.pricingMode === 'automatic' && value.markupType === 'fixed' && value.markupValueMinor === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['markupValueMinor'], message: 'Required for fixed markup' });
  }
});

const bannerUrl = z.string().trim().url().max(2048);
const optionalBannerUrl = bannerUrl.optional().or(z.literal(''));
const bannerDate = z.coerce.date();

const bannerFields = {
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(500).optional(),
  imageUrl: optionalBannerUrl,
  desktopImageUrl: optionalBannerUrl,
  mobileImageUrl: optionalBannerUrl,
  buttonText: z.string().trim().max(120).optional(),
  buttonUrl: bannerUrl.optional().or(z.literal('')),
  placement: z.enum(['home', 'game-detail']).default('home'),
  gameId: z.string().trim().optional(),
  enabled: z.boolean().optional(),
  sortOrder: finiteNumber.int().min(0).max(100000).optional(),
  startDate: bannerDate.optional(),
  endDate: bannerDate.optional()
};

const validateBanner = (value: { imageUrl?: string; desktopImageUrl?: string; mobileImageUrl?: string; placement?: string; gameId?: string; startDate?: Date; endDate?: Date }, context: z.RefinementCtx) => {
  if (!value.imageUrl && !value.desktopImageUrl && !value.mobileImageUrl) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['imageUrl'], message: 'At least one banner image URL is required.' });
  }
  if (value.placement === 'game-detail' && !value.gameId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['gameId'], message: 'A game is required for game-detail banners.' });
  }
  if (value.placement === 'home' && value.gameId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['gameId'], message: 'Home banners cannot be assigned to a game.' });
  }
  if (value.startDate && value.endDate && value.endDate <= value.startDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be after start date.' });
  }
};

export const bannerWriteSchema = z.object(bannerFields).strict().superRefine(validateBanner);

export const bannerUpdateSchema = z.object(bannerFields).partial().strict().superRefine((value, context) => {
  if (value.startDate && value.endDate && value.endDate <= value.startDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be after start date.' });
  }
});
