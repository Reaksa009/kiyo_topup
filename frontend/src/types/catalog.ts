export interface PublicCategoryDTO {
  name: string;
  slug: string;
}

export interface PublicGameDTO {
  _id?: string;
  title: string;
  slug: string;
  publisher?: string;
  thumbnail: string;
  bannerUrl?: string;
  displayName?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  detailBannerDesktop?: string;
  detailBannerMobile?: string;
  categoryId?: PublicCategoryDTO | string;
  inputFields?: Array<{ name: string; label: string; placeholder?: string; type?: string; required?: boolean; helpText?: string }>;
  instructions?: string;
  isPopular?: boolean;
  isFlashSale?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isPurchasable: boolean;
  sortOrder?: number;
  status?: 'active' | 'maintenance' | 'inactive';
}

export interface PublicPackageDTO {
  _id: string;
  gameId?: string;
  title: string;
  description?: string;
  icon?: string;
  price: number;
  badge?: string;
  supportsBoth?: boolean;
  discountPercent?: number;
  isPurchasable: boolean;
}

export interface PublicBannerDTO {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  placement?: 'home' | 'game-detail';
  gameId?: string;
  sortOrder?: number;
}
