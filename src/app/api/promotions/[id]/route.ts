import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

function formatDateForDB(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toISOString().split('T')[0];
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const stmt = db.prepare(`
      SELECT p.*,
             GROUP_CONCAT(
               CASE WHEN i.is_primary = 1 THEN i.file_path END
             ) as primary_image,
             GROUP_CONCAT(i.file_path) as images
      FROM promotions p
      LEFT JOIN images i ON p.id = i.entity_id AND i.entity_type = 'promotion'
      WHERE p.id = ?
      GROUP BY p.id
    `);

    const promotion = stmt.get(id) as {
      id: number;
      primary_image: string | null;
      images: string | null;
      is_active: number;
      is_featured: number;
      applicable_services: string | null;
      [key: string]: unknown;
    } | undefined;

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    // Procesar datos
    const processedPromotion = {
      ...promotion,
      primary_image: promotion.primary_image || null,
      images: promotion.images ? promotion.images.split(',').filter(Boolean) : [],
      is_active: Boolean(promotion.is_active),
      is_featured: Boolean(promotion.is_featured),
      applicable_services: promotion.applicable_services ? JSON.parse(promotion.applicable_services) : []
    };

    return NextResponse.json({
      promotion: processedPromotion
    });

  } catch (error) {
    console.error('Error fetching promotion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const {
      title,
      description,
      short_description,
      discount_type,
      discount_value,
      min_age,
      max_age,
      applicable_services,
      promo_code,
      start_date,
      end_date,
      max_uses,
      is_active,
      is_featured,
      terms_conditions
    } = await request.json();

    if (!title || !discount_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Campos requeridos: título, tipo de descuento, fecha de inicio y fin' },
        { status: 400 }
      );
    }

    // Verificar que existe
    const existing = db.prepare('SELECT id, slug, title FROM promotions WHERE id = ?').get(id) as {
      id: number;
      slug: string;
      title: string;
    } | undefined;
    if (!existing) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    // Generar nuevo slug si el título cambió
    let finalSlug = existing.slug;
    if (title !== existing.title) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      finalSlug = slug;
      let counter = 1;
      while (true) {
        const existingSlug = db.prepare('SELECT id FROM promotions WHERE slug = ? AND id != ?').get(finalSlug, id);
        if (!existingSlug) break;
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
    }

    // Verificar código promocional único si se proporciona
    if (promo_code) {
      const existingCode = db.prepare('SELECT id FROM promotions WHERE promo_code = ? AND id != ?').get(promo_code, id);
      if (existingCode) {
        return NextResponse.json(
          { error: 'El código promocional ya existe' },
          { status: 400 }
        );
      }
    }

    const stmt = db.prepare(`
      UPDATE promotions SET
        title = ?, slug = ?, description = ?, short_description = ?, discount_type = ?,
        discount_value = ?, min_age = ?, max_age = ?, applicable_services = ?,
        promo_code = ?, start_date = ?, end_date = ?, max_uses = ?,
        is_active = ?, is_featured = ?, terms_conditions = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      title,
      finalSlug,
      description || null,
      short_description || null,
      discount_type,
      discount_value || null,
      min_age || null,
      max_age || null,
      applicable_services ? JSON.stringify(applicable_services) : null,
      promo_code || null,
      formatDateForDB(start_date),
      formatDateForDB(end_date),
      max_uses || null,
      is_active ? 1 : 0,
      is_featured ? 1 : 0,
      terms_conditions || null,
      id
    );

    return NextResponse.json({
      message: 'Promoción actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = db.prepare('SELECT id FROM promotions WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    // En lugar de eliminar, desactivar la promoción
    db.prepare(`UPDATE promotions SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(id);

    return NextResponse.json({
      message: 'Promoción desactivada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}