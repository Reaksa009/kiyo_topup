import type { PublicBannerDTO } from '../types/catalog';

export const resolveBannerImages = (banner: PublicBannerDTO, fallbackImage: string) => {
  const desktop = banner.desktopImageUrl || banner.imageUrl || fallbackImage;
  return { desktop, mobile: banner.mobileImageUrl || desktop };
};
