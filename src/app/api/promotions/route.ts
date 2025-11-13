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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const active = searchParams.get('active') !== 'false';
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    
    if (active) {
      whereClause += ' AND is_active = ? AND start_date <= date(\'now\') AND end_date >= date(\'now\')';
      params.push(1);
    }
    
    if (featured) {
      whereClause += ' AND is_featured = ?';
      params.push(featured === 'true' ? 1 : 0);
    }
    
    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR promo_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Contar total de registros
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM promotions 
      ${whereClause}
    `);
    const { total } = countStmt.get(...params) as { total: number };

    // Obtener promociones con paginación
    const stmt = db.prepare(`
      SELECT p.*, 
             GROUP_CONCAT(
               CASE WHEN i.is_primary = 1 THEN i.file_path END
             ) as primary_image,
             GROUP_CONCAT(i.file_path) as images
      FROM promotions p
      LEFT JOIN images i ON p.id = i.entity_id AND i.entity_type = 'promotion'
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const promotions = stmt.all(...params, limit, offset) as Array<{
      id: number;
      primary_image: string | null;
      images: string | null;
      is_active: number;
      is_featured: number;
      applicable_services: string | null;
      [key: string]: unknown;
    }>;

    // Procesar imágenes
    const processedPromotions = promotions.map((promotion) => ({
      ...promotion,
      primary_image: promotion.primary_image || null,
      images: promotion.images ? promotion.images.split(',').filter(Boolean) : [],
      is_active: Boolean(promotion.is_active),
      is_featured: Boolean(promotion.is_featured),
      applicable_services: promotion.applicable_services ? JSON.parse(promotion.applicable_services) : []
    }));

    return NextResponse.json({
      promotions: processedPromotions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

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
      is_active = true,
      is_featured = false,
      terms_conditions
    } = await request.json();

    if (!title || !discount_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Campos requeridos: título, tipo de descuento, fecha de inicio y fin' },
        { status: 400 }
      );
    }

    // Generar slug
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Verificar slug único
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existing = db.prepare('SELECT id FROM promotions WHERE slug = ?').get(finalSlug);
      if (!existing) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Verificar código promocional único si se proporciona
    if (promo_code) {
      const existingCode = db.prepare('SELECT id FROM promotions WHERE promo_code = ?').get(promo_code);
      if (existingCode) {
        return NextResponse.json(
          { error: 'El código promocional ya existe' },
          { status: 400 }
        );
      }
    }

    const stmt = db.prepare(`
      INSERT INTO promotions (
        title, slug, description, short_description, discount_type, discount_value,
        min_age, max_age, applicable_services, promo_code, start_date, end_date,
        max_uses, is_active, is_featured, terms_conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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
      terms_conditions || null
    );

    const newPromotion = {
      id: result.lastInsertRowid,
      title,
      slug: finalSlug,
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
    };

    return NextResponse.json({
      message: 'Promoción creada exitosamente',
      promotion: newPromotion
    });

  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}