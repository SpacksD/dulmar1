import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const stmt = db.prepare('SELECT id, email, first_name, last_name, phone, role, email_verified, created_at FROM users WHERE id = ? AND is_active = 1');
    const user = stmt.get(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { first_name, last_name, phone } = await request.json();

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'Nombre y apellido son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono si se proporciona
    if (phone && phone.length > 0) {
      const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: 'Formato de teléfono inválido' },
          { status: 400 }
        );
      }
    }

    const stmt = db.prepare(`
      UPDATE users
      SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
    `);

    const result = stmt.run(first_name, last_name, phone || null, session.user.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o no se pudo actualizar' },
        { status: 404 }
      );
    }

    // Obtener los datos actualizados
    const updatedStmt = db.prepare('SELECT id, email, first_name, last_name, phone, role, email_verified, created_at FROM users WHERE id = ?');
    const updatedUser = updatedStmt.get(session.user.id);

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}