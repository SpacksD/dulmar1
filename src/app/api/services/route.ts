import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { slugify } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const active = searchParams.get('active') !== 'false';
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (active) {
      whereClause += ' AND s.is_active = ?';
      params.push(1);
    }

    if (category) {
      whereClause += ' AND s.category = ?';
      params.push(category);
    }

    if (featured === 'true') {
      whereClause += ' AND s.is_featured = ?';
      params.push(1);
    }

    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.description LIKE ? OR s.short_description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Contar total de registros
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM services s
      ${whereClause}
    `);
    const { total } = countStmt.get(...params) as { total: number };

    // Obtener servicios con paginación e información de promociones
    const stmt = db.prepare(`
      SELECT s.*,
             GROUP_CONCAT(
               CASE WHEN i.is_primary = 1 THEN i.file_path END
             ) as primary_image,
             p.id as promotion_id,
             p.title as promotion_title,
             p.discount_type,
             p.discount_value,
             p.promo_code
      FROM services s
      LEFT JOIN images i ON s.id = i.entity_id AND i.entity_type = 'service'
      LEFT JOIN promotions p ON (
        p.is_active = 1
        AND date('now') BETWEEN p.start_date AND p.end_date
        AND (p.applicable_services LIKE '%' || s.id || '%' OR p.applicable_services IS NULL)
        AND (p.max_uses IS NULL OR p.used_count < p.max_uses)
      )
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.sort_order ASC, s.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const services = stmt.all(...params, limit, offset);

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

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

    const slug = slugify(name);

    // Verificar si el slug ya existe
    const existingStmt = db.prepare('SELECT id FROM services WHERE slug = ?');
    const existing = existingStmt.get(slug);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un servicio con este nombre' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO services (
        name, slug, description, short_description, category,
        age_range_min, age_range_max, duration, capacity, price,
        sessions_included, pricing_type, is_featured, meta_title, meta_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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
      is_featured ? 1 : 0,
      meta_title || null,
      meta_description || null
    );

    const newService = {
      id: result.lastInsertRowid,
      name,
      slug,
      description,
      short_description,
      category,
      age_range_min,
      age_range_max,
      duration,
      capacity,
      price,
      sessions_included: sessions_included || 8,
      pricing_type: pricing_type || 'sessions',
      is_featured
    };

    return NextResponse.json({
      message: 'Servicio creado exitosamente',
      service: newService
    });

  } catch (error) {
    console.error('Error creando servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}