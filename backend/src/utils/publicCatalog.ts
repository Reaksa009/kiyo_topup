type CatalogRecord = Record<string, any>;

export const toPublicGameDTO = (game: CatalogRecord) => ({
  _id: game._id,
  title: game.title,
  slug: game.slug,
  publisher: game.publisher,
  thumbnail: game.thumbnail,
  bannerUrl: game.bannerUrl,
  // Presentation fields are intentionally allow-listed. Provider identity, sync data,
  // raw payloads and commercial configuration remain server-only.
  displayName: game.displayName,
  description: game.description,
  logoUrl: game.logoUrl,
  coverImageUrl: game.coverImageUrl,
  detailBannerDesktop: game.detailBannerDesktop,
  detailBannerMobile: game.detailBannerMobile,
  categoryId: game.categoryId,
  inputFields: game.inputFields,
  instructions: game.instructions,
  isPopular: game.isPopular,
  isFlashSale: game.isFlashSale,
  status: game.status,
  sortOrder: game.sortOrder,
  seoTitle: game.seoTitle,
  seoDescription: game.seoDescription,
  isPurchasable: game.isPurchasable !== false
});

export const toPublicPackageDTO = (pkg: CatalogRecord, isPurchasable = true) => ({
  _id: pkg._id,
  gameId: pkg.gameId,
  title: pkg.title,
  description: pkg.description,
  icon: pkg.icon,
  price: pkg.price,
  packageAmount: pkg.packageAmount,
  packageType: pkg.packageType,
  discountPercent: pkg.discountPercent,
  badge: pkg.badge,
  stock: pkg.stock,
  status: pkg.status,
  sortOrder: pkg.sortOrder,
  supportsBoth: pkg.supportsBoth,
  isPurchasable
});

export const toCustomerOrderDTO = (order: CatalogRecord) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  gameId: order.gameId,
  packageId: order.packageId,
  gameTitle: order.gameTitle,
  packageTitle: order.packageTitle,
  amount: order.amount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  providerStatus: order.providerStatus,
  overallStatus: order.overallStatus,
  failureReason: order.failureReason,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt
});
