import { MetadataRoute } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.centrodulmar.com';

  // Rutas estáticas principales
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/servicios`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Conectar a la base de datos para obtener servicios dinámicos
    const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
    const db = new Database(dbPath);

    // Obtener todos los servicios activos
    const services = db.prepare(`
      SELECT id, slug, updated_at
      FROM services
      WHERE status = 'active'
    `).all() as Array<{ id: number; slug: string; updated_at: string }>;

    // Agregar cada servicio al sitemap
    const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${baseUrl}/servicios/${service.id}`,
      lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    db.close();

    return [...routes, ...serviceRoutes];
  } catch (error) {
    console.error('Error generando sitemap:', error);
    // Si hay error, devolver solo las rutas estáticas
    return routes;
  }
}
