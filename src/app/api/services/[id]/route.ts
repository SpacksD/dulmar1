import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { slugify } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stmt = db.prepare(`
      SELECT s.*,
             GROUP_CONCAT(
               CASE WHEN i.is_primary = 1 THEN i.file_path END
             ) as primary_image,
             GROUP_CONCAT(i.file_path) as images,
             p.id as promotion_id,
             p.title as promotion_title,
             p.description as promotion_description,
             p.discount_type,
             p.discount_value,
             p.promo_code,
             p.start_date as promotion_start_date,
             p.end_date as promotion_end_date
      FROM services s
      LEFT JOIN images i ON s.id = i.entity_id AND i.entity_type = 'service'
      LEFT JOIN promotions p ON (
        p.is_active = 1
        AND date('now') BETWEEN p.start_date AND p.end_date
        AND (p.applicable_services LIKE '%' || s.id || '%' OR p.applicable_services IS NULL)
        AND (p.max_uses IS NULL OR p.used_count < p.max_uses)
      )
      WHERE s.id = ? AND s.is_active = 1
      GROUP BY s.id
    `);

    const service = stmt.get(id);

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });

  } catch (error) {
    console.error('Error obteniendo servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const {
      name,
      description,
      short_description,
      category,
      age_range_min,
      age_range_max,
      duration,
      capacity,
      price,
      sessions_included,
      pricing_type,
      is_active,
      is_featured,
      meta_title,
      meta_description
    } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el servicio existe
    const existingService = db.prepare('SELECT id, slug FROM services WHERE id = ?').get(id) as {
      id: number;
      slug: string;
    } | undefined;
    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    const slug = slugify(name);

    // Verificar si el nuevo slug ya existe (excepto el actual)
    if (slug !== existingService.slug) {
      const slugExists = db.prepare('SELECT id FROM services WHERE slug = ? AND id != ?').get(slug, id);
      if (slugExists) {
        return NextResponse.json(
          { error: 'Ya existe un servicio con este nombre' },
          { status: 400 }
        );
      }
    }

    const stmt = db.prepare(`
      UPDATE services SET
        name = ?, slug = ?, description = ?, short_description = ?,
        category = ?, age_range_min = ?, age_range_max = ?,
        duration = ?, capacity = ?, price = ?, sessions_included = ?,
        pricing_type = ?, is_active = ?, is_featured = ?, meta_title = ?,
        meta_description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      name,
      slug,
      description || null,
      short_description || null,
      category,
      age_range_min || null,
      age_range_max || null,
      duration || null,
      capacity || null,
      price || null,
      sessions_included || 8,
      pricing_type || 'sessions',
      is_active ? 1 : 0,
      is_featured ? 1 : 0,
      meta_title || null,
      meta_description || null,
      id
    );

    return NextResponse.json({
      message: 'Servicio actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar si el servicio existe
    const existingService = db.prepare('SELECT id FROM services WHERE id = ?').get(id);
    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // En lugar de eliminar, marcar como inactivo
    const stmt = db.prepare('UPDATE services SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);

    return NextResponse.json({
      message: 'Servicio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}