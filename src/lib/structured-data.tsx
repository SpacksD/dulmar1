// Helpers para generar Structured Data (Schema.org) en formato JSON-LD

interface LocalBusinessData {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  openingHours?: string[];
  image?: string;
  priceRange?: string;
}

interface ServiceData {
  name: string;
  description: string;
  provider: string;
  url: string;
  image?: string;
  priceRange?: string;
  areaServed?: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Genera JSON-LD para LocalBusiness (Centro Infantil)
 */
export function generateLocalBusinessSchema(data: LocalBusinessData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ChildCare',
    name: data.name,
    description: data.description,
    url: data.url,
    telephone: data.telephone,
    email: data.email,
    image: data.image,
    priceRange: data.priceRange || '$$',
    address: data.address ? {
      '@type': 'PostalAddress',
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      addressRegion: data.address.addressRegion,
      postalCode: data.address.postalCode,
      addressCountry: data.address.addressCountry,
    } : undefined,
    openingHoursSpecification: data.openingHours?.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(':')[0],
      opens: hours.split(':')[1]?.split('-')[0]?.trim(),
      closes: hours.split(':')[1]?.split('-')[1]?.trim(),
    })),
  };
}

/**
 * Genera JSON-LD para Organization (para branding)
 */
export function generateOrganizationSchema(data: {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs,
  };
}

/**
 * Genera JSON-LD para Service
 */
export function generateServiceSchema(data: ServiceData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    description: data.description,
    provider: {
      '@type': 'ChildCare',
      name: data.provider,
    },
    url: data.url,
    image: data.image,
    offers: data.priceRange ? {
      '@type': 'Offer',
      priceRange: data.priceRange,
    } : undefined,
    areaServed: data.areaServed ? {
      '@type': 'City',
      name: data.areaServed,
    } : undefined,
  };
}

/**
 * Genera JSON-LD para BreadcrumbList
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Componente para renderizar Schema en el HTML
 */
export function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
