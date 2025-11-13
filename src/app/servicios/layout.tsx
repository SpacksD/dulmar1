import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.centrodulmar.com';

export const metadata: Metadata = {
  title: 'Nuestros Servicios',
  description: 'Descubre todos nuestros servicios de estimulación temprana y desarrollo infantil para niños de 0 a 6 años. Programas especializados con profesionales capacitados.',
  keywords: [
    'servicios estimulación temprana',
    'programas desarrollo infantil',
    'educación inicial',
    'talleres para niños',
    'estimulación temprana Lima',
    'centro infantil servicios',
  ],
  openGraph: {
    title: 'Servicios de Estimulación Temprana - Centro Infantil DULMAR',
    description: 'Descubre todos nuestros servicios especializados en estimulación temprana y desarrollo infantil para niños de 0 a 6 años.',
    type: 'website',
    url: `${baseUrl}/servicios`,
    siteName: 'Centro Infantil DULMAR',
    locale: 'es_ES',
    images: [
      {
        url: `${baseUrl}/media/logo.png`,
        width: 1200,
        height: 630,
        alt: 'Servicios Centro Infantil DULMAR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Servicios de Estimulación Temprana - Centro Infantil DULMAR',
    description: 'Descubre todos nuestros servicios especializados en estimulación temprana y desarrollo infantil.',
    images: [`${baseUrl}/media/logo.png`],
  },
  alternates: {
    canonical: `${baseUrl}/servicios`,
  },
};

export default function ServiciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
