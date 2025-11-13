import { Metadata } from 'next';
import { StructuredData, generateBreadcrumbSchema } from '@/lib/structured-data';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.centrodulmar.com';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contacta con Centro Infantil DULMAR. Estamos aquí para responder tus preguntas sobre nuestros servicios de estimulación temprana. Llámanos, escríbenos o visítanos.',
  keywords: [
    'contacto centro infantil',
    'información DULMAR',
    'consultas estimulación temprana',
    'teléfono centro infantil',
    'dirección DULMAR',
    'horarios atención',
  ],
  openGraph: {
    title: 'Contacto - Centro Infantil DULMAR',
    description: 'Contacta con nosotros para más información sobre nuestros servicios de estimulación temprana y desarrollo infantil.',
    type: 'website',
    url: `${baseUrl}/contacto`,
    siteName: 'Centro Infantil DULMAR',
    locale: 'es_ES',
    images: [
      {
        url: `${baseUrl}/media/logo.png`,
        width: 1200,
        height: 630,
        alt: 'Contacto Centro Infantil DULMAR',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Contacto - Centro Infantil DULMAR',
    description: 'Contacta con nosotros para más información sobre nuestros servicios de estimulación temprana.',
    images: [`${baseUrl}/media/logo.png`],
  },
  alternates: {
    canonical: `${baseUrl}/contacto`,
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Breadcrumb schema
  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Inicio', url: baseUrl },
    { name: 'Contacto', url: `${baseUrl}/contacto` },
  ]);

  return (
    <>
      <StructuredData data={breadcrumbData} />
      {children}
    </>
  );
}
