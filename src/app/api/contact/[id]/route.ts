import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

export async function GET(
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

    const stmt = db.prepare(`
      SELECT cm.*,
             u.first_name as assigned_first_name,
             u.last_name as assigned_last_name,
             u.email as assigned_email
      FROM contact_messages cm
      LEFT JOIN users u ON cm.assigned_to = u.id
      WHERE cm.id = ?
    `);

    const message = stmt.get(id);

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Error obteniendo mensaje:', error);
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
    const { status, priority, assigned_to, admin_notes } = await request.json();

    // Verificar si el mensaje existe
    const existingMessage = db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(id);
    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Si se asigna a alguien, verificar que el usuario existe
    if (assigned_to) {
      const userExists = db.prepare('SELECT id FROM users WHERE id = ? AND role IN ("admin", "staff")').get(assigned_to);
      if (!userExists) {
        return NextResponse.json(
          { error: 'Usuario asignado no válido' },
          { status: 400 }
        );
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      if (status === 'responded') {
        updateFields.push('responded_at = CURRENT_TIMESTAMP');
      }
    }

    if (priority) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }

    if (assigned_to !== undefined) {
      updateFields.push('assigned_to = ?');
      updateValues.push(assigned_to);
    }

    if (admin_notes !== undefined) {
      updateFields.push('admin_notes = ?');
      updateValues.push(admin_notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const stmt = db.prepare(`
      UPDATE contact_messages SET 
      ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...updateValues);

    return NextResponse.json({
      message: 'Mensaje actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando mensaje:', error);
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

    // Verificar si el mensaje existe
    const existingMessage = db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(id);
    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar mensaje
    const stmt = db.prepare('DELETE FROM contact_messages WHERE id = ?');
    stmt.run(id);

    return NextResponse.json({
      message: 'Mensaje eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando mensaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}