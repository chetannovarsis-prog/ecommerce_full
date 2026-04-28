import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.gharofethnics.com';
const BRAND_NAME = 'Ghar of Ethnics';

const toTitleFromSlug = (value = '') =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getSeoByPathname = (pathname) => {
  const base = {
    title: `${BRAND_NAME} | Women's Ethnic Clothing Brand`,
    description:
      'Shop premium women\'s ethnic wear at Ghar of Ethnics. Discover sarees, kurtas, festive collections, and timeless styles crafted for modern Indian women.',
    keywords:
      'women clothing brand, women ethnic wear, indian ethnic wear for women, sarees, kurtas, festive wear, ghar of ethnics',
    robots: 'index,follow',
  };

  if (pathname === '/') {
    return {
      ...base,
      title: `${BRAND_NAME} | Women\'s Ethnic Wear Online`,
      description:
        'Ghar of Ethnics is a women\'s clothing brand for elegant ethnic wear. Shop curated collections, bestsellers, and new arrivals online.',
    };
  }

  if (pathname === '/collections') {
    return {
      ...base,
      title: `Collections | ${BRAND_NAME}`,
      description:
        'Explore women\'s ethnic clothing collections at Ghar of Ethnics. Find curated styles for festive, casual, and occasion wear.',
    };
  }

  if (pathname === '/collections/all') {
    return {
      ...base,
      title: `All Products | ${BRAND_NAME}`,
      description:
        'Browse all women\'s clothing styles from Ghar of Ethnics. Discover handcrafted ethnic wear designed for comfort and elegance.',
    };
  }

  if (pathname.startsWith('/collections/')) {
    const slug = pathname.replace('/collections/', '').trim();
    const collectionName = toTitleFromSlug(slug);
    return {
      ...base,
      title: `${collectionName} Collection | ${BRAND_NAME}`,
      description: `Shop ${collectionName} collection at Ghar of Ethnics, a women\'s ethnic clothing brand for timeless Indian fashion.`,
      keywords: `${collectionName}, women clothing brand, women ethnic wear, indian ethnic fashion, ${BRAND_NAME}`,
    };
  }

  if (pathname.startsWith('/products/')) {
    const slug = pathname.replace('/products/', '').trim();
    const productName = toTitleFromSlug(slug);
    return {
      ...base,
      title: `${productName} | ${BRAND_NAME}`,
      description: `Buy ${productName} from Ghar of Ethnics. Premium women\'s ethnic clothing with quality fabrics and elegant craftsmanship.`,
      keywords: `${productName}, women ethnic wear, women clothing brand, buy ethnic wear online`,
    };
  }

  if (pathname === '/new-arrivals') {
    return {
      ...base,
      title: `New Arrivals | ${BRAND_NAME}`,
      description:
        'Discover new arrivals in women\'s ethnic wear at Ghar of Ethnics. Fresh designs, premium fabrics, and trend-led styles.',
    };
  }

  if (pathname === '/about') {
    return {
      ...base,
      title: `About Us | ${BRAND_NAME}`,
      description:
        'Learn about Ghar of Ethnics, a women\'s clothing brand focused on timeless Indian ethnic wear and quality craftsmanship.',
    };
  }

  if (pathname === '/contact') {
    return {
      ...base,
      title: `Contact Us | ${BRAND_NAME}`,
      description:
        'Contact Ghar of Ethnics for order help, shipping support, and product queries related to women\'s ethnic wear.',
    };
  }

  if (pathname === '/shipping') {
    return {
      ...base,
      title: `Shipping Policy | ${BRAND_NAME}`,
      description:
        'Read the shipping policy for Ghar of Ethnics orders, delivery timelines, and dispatch details for women\'s clothing purchases.',
    };
  }

  if (pathname === '/returns') {
    return {
      ...base,
      title: `Returns & Exchanges | ${BRAND_NAME}`,
      description:
        'Understand return and exchange rules for Ghar of Ethnics women\'s ethnic clothing orders.',
    };
  }

  if (pathname === '/privacy') {
    return {
      ...base,
      title: `Privacy Policy | ${BRAND_NAME}`,
      description: 'Read how Ghar of Ethnics collects, stores, and protects customer information.',
    };
  }

  if (pathname === '/terms') {
    return {
      ...base,
      title: `Terms & Conditions | ${BRAND_NAME}`,
      description: 'View terms and conditions for shopping on Ghar of Ethnics.',
    };
  }

  if (pathname === '/wishlist') {
    return {
      ...base,
      title: `Wishlist | ${BRAND_NAME}`,
      robots: 'noindex,nofollow',
    };
  }

  if (pathname === '/cart') {
    return {
      ...base,
      title: `Cart | ${BRAND_NAME}`,
      robots: 'noindex,nofollow',
    };
  }

  if (pathname === '/checkout') {
    return {
      ...base,
      title: `Checkout | ${BRAND_NAME}`,
      robots: 'noindex,nofollow',
    };
  }

  if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') {
    return {
      ...base,
      title: `Account | ${BRAND_NAME}`,
      robots: 'noindex,nofollow',
    };
  }

  if (pathname === '/profile' || pathname.startsWith('/orders/') || pathname.startsWith('/order-success/')) {
    return {
      ...base,
      title: `My Account | ${BRAND_NAME}`,
      robots: 'noindex,nofollow',
    };
  }

  return base;
};

const SeoMeta = ({ title, description, keywords, robots, canonical, ogImage }) => {
  const { pathname } = useLocation();
  const routeSeo = getSeoByPathname(pathname);
  const seo = {
    ...routeSeo,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(keywords ? { keywords } : {}),
    ...(robots ? { robots } : {}),
  };
  const resolvedCanonical = canonical || `${SITE_URL}${pathname === '/' ? '' : pathname}`;
  const resolvedOgImage = ogImage || `${SITE_URL}/images/GOE-LOGO.png`;

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="robots" content={seo.robots} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={resolvedOgImage} />
      <link rel="canonical" href={resolvedCanonical} />
    </Helmet>
  );
};

export default SeoMeta;
