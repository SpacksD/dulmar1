import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { validateEmail, validatePhone } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (priority) {
      whereClause += ' AND priority = ?';
      params.push(priority);
    }

    // Contar total de registros
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM contact_messages 
      ${whereClause}
    `);
    const { total } = countStmt.get(...params) as { total: number };

    // Obtener mensajes con información del usuario asignado
    const stmt = db.prepare(`
      SELECT cm.*, 
             u.first_name as assigned_first_name,
             u.last_name as assigned_last_name
      FROM contact_messages cm
      LEFT JOIN users u ON cm.assigned_to = u.id
      ${whereClause}
      ORDER BY cm.priority DESC, cm.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const messages = stmt.all(...params, limit, offset);

    return NextResponse.json({
      messages,
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
    console.error('Error obteniendo mensajes de contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      child_name,
      child_age,
      subject,
      message,
      interested_services,
      preferred_contact_method
    } = await request.json();

    // Validaciones
    if (!first_name || !last_name || !email || !message) {
      return NextResponse.json(
        { error: 'Nombre, apellido, email y mensaje son requeridos' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Teléfono inválido' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO contact_messages (
        first_name, last_name, email, phone, child_name, child_age,
        subject, message, interested_services, preferred_contact_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      first_name,
      last_name,
      email,
      phone || null,
      child_name || null,
      child_age || null,
      subject || null,
      message,
      interested_services ? JSON.stringify(interested_services) : null,
      preferred_contact_method || 'email'
    );

    return NextResponse.json({
      message: 'Mensaje enviado exitosamente. Nos pondremos en contacto pronto.',
      messageId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error creando mensaje de contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}