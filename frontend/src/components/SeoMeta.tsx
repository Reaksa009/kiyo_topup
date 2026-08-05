import { useEffect } from 'react';

interface SeoMetaProps {
  title: string;
  description: string;
  image?: string;
  canonicalPath?: string;
}

const setMeta = (selector: string, attribute: 'name' | 'property', value: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, selector.includes('=') ? selector.split('=')[1].replace(/[\"\]]/g, '') : '');
    document.head.appendChild(element);
  }
  element.content = value;
};

export const SeoMeta = ({ title, description, image, canonicalPath }: SeoMetaProps) => {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'name', description);
    setMeta('meta[property="og:title"]', 'property', title);
    setMeta('meta[property="og:description"]', 'property', description);
    setMeta('meta[property="og:type"]', 'property', 'website');
    if (image) setMeta('meta[property="og:image"]', 'property', image);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = new URL(canonicalPath || window.location.pathname, window.location.origin).toString();
  }, [title, description, image, canonicalPath]);

  return null;
};
