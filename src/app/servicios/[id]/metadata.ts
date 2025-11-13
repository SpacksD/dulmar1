import { Metadata } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  price: number | null;
  primary_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export async function generateServiceMetadata(id: string): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.centrodulmar.com';

  try {
    const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
    const db = new Database(dbPath);

    const service = db.prepare(`
      SELECT
        id, name, slug, description, short_description,
        category, price, primary_image, meta_title, meta_description
      FROM services
      WHERE id = ?
    `).get(id) as Service | undefined;

    db.close();

    if (!service) {
      return {
        title: 'Servicio no encontrado',
        description: 'El servicio solicitado no está disponible.',
      };
    }

    const title = service.meta_title || `${service.name} - Estimulación Temprana`;
    const description = service.meta_description || service.short_description || service.description;
    const imageUrl = service.primary_image
      ? `${baseUrl}${service.primary_image}`
      : `${baseUrl}/media/logo.png`;

    return {
      title,
      description,
      keywords: [
        service.name,
        service.category,
        'estimulación temprana',
        'desarrollo infantil',
        'educación inicial',
        'centro infantil DULMAR',
      ],
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${baseUrl}/servicios/${id}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: service.name,
          },
        ],
        siteName: 'Centro Infantil DULMAR',
        locale: 'es_ES',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `${baseUrl}/servicios/${id}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Servicio - Centro Infantil DULMAR',
      description: 'Descubre nuestros servicios de estimulación temprana.',
    };
  }
}
