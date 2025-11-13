import { Metadata } from 'next';
import { generateServiceMetadata } from './metadata';
import { StructuredData, generateServiceSchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import Database from 'better-sqlite3';
import path from 'path';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

interface ServiceData {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  price: number | null;
  primary_image: string | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  return generateServiceMetadata(resolvedParams.id);
}

export default async function ServiceLayout({ params, children }: Props) {
  const resolvedParams = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.centrodulmar.com';

  let serviceData = null;

  try {
    const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
    const db = new Database(dbPath);

    const service = db.prepare(`
      SELECT id, name, slug, description, short_description, category, price, primary_image
      FROM services
      WHERE id = ?
    `).get(resolvedParams.id) as ServiceData | undefined;

    db.close();

    if (service) {
      // Generar structured data para el servicio
      serviceData = generateServiceSchema({
        name: service.name,
        description: service.short_description || service.description,
        provider: 'Centro Infantil DULMAR',
        url: `${baseUrl}/servicios/${resolvedParams.id}`,
        image: service.primary_image ? `${baseUrl}${service.primary_image}` : undefined,
        priceRange: service.price ? `S/. ${service.price}` : undefined,
        areaServed: 'Lima',
      });
    }
  } catch (error) {
    console.error('Error generating structured data:', error);
  }

  // Breadcrumb schema
  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Inicio', url: baseUrl },
    { name: 'Servicios', url: `${baseUrl}/servicios` },
    { name: 'Detalle del Servicio', url: `${baseUrl}/servicios/${resolvedParams.id}` },
  ]);

  return (
    <>
      {serviceData && <StructuredData data={serviceData} />}
      <StructuredData data={breadcrumbData} />
      {children}
    </>
  );
}
