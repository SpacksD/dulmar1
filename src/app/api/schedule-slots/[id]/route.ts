import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

// GET - Obtener horario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    const stmt = db.prepare(`
      SELECT ss.*,
             s.name as service_name
      FROM schedule_slots ss
      LEFT JOIN services s ON ss.service_id = s.id
      WHERE ss.id = ?
    `);

    const slot = stmt.get(id) as {
      day_of_week: number;
      service_name?: string;
      [key: string]: unknown;
    } | undefined;

    if (!slot) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const slotWithDayName = {
      ...slot,
      day_name: daysOfWeek[slot.day_of_week],
      service_name: slot.service_name || 'Todos los servicios'
    };

    return NextResponse.json({ slot: slotWithDayName });

  } catch (error) {
    console.error('Error fetching schedule slot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar horario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Solo permitir a administradores
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden modificar horarios.' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { day_of_week, start_time, end_time, service_id, max_capacity, is_active } = body;

    // Verificar que el horario existe
    const existingSlot = db.prepare('SELECT * FROM schedule_slots WHERE id = ?').get(id) as {
      start_time: string;
      end_time: string;
      day_of_week: number;
      service_id: number | null;
      [key: string]: unknown;
    } | undefined;
    if (!existingSlot) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    if (day_of_week !== undefined && (day_of_week < 0 || day_of_week > 6)) {
      return NextResponse.json(
        { error: 'day_of_week debe estar entre 0 (Domingo) y 6 (Sábado)' },
        { status: 400 }
      );
    }

    // Validar formato de tiempo si se proporcionan
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (start_time && !timeRegex.test(start_time)) {
      return NextResponse.json(
        { error: 'Formato de start_time inválido. Use HH:MM' },
        { status: 400 }
      );
    }

    if (end_time && !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Formato de end_time inválido. Use HH:MM' },
        { status: 400 }
      );
    }

    // Validar que start_time sea menor que end_time
    const finalStartTime = start_time || existingSlot.start_time;
    const finalEndTime = end_time || existingSlot.end_time;

    if (finalStartTime >= finalEndTime) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser menor que la hora de fin' },
        { status: 400 }
      );
    }

    // Verificar si el servicio existe (si se especifica)
    if (service_id) {
      const serviceExists = db.prepare('SELECT id FROM services WHERE id = ?').get(service_id);
      if (!serviceExists) {
        return NextResponse.json(
          { error: 'El servicio especificado no existe' },
          { status: 400 }
        );
      }
    }

    // Verificar conflictos de horario (excluyendo el actual)
    if (day_of_week !== undefined || start_time || end_time || service_id !== undefined) {
      const finalDayOfWeek = day_of_week !== undefined ? day_of_week : existingSlot.day_of_week;
      const finalServiceId = service_id !== undefined ? service_id : existingSlot.service_id;

      const conflictStmt = db.prepare(`
        SELECT id FROM schedule_slots
        WHERE id != ?
          AND day_of_week = ?
          AND (service_id = ? OR service_id IS NULL OR ? IS NULL)
          AND is_active = 1
          AND (
            (start_time <= ? AND end_time > ?) OR
            (start_time < ? AND end_time >= ?) OR
            (start_time >= ? AND end_time <= ?)
          )
      `);

      const conflict = conflictStmt.get(
        id,
        finalDayOfWeek,
        finalServiceId,
        finalServiceId,
        finalStartTime, finalStartTime,
        finalEndTime, finalEndTime,
        finalStartTime, finalEndTime
      );

      if (conflict) {
        return NextResponse.json(
          { error: 'Ya existe un horario que se superpone con el horario especificado' },
          { status: 400 }
        );
      }
    }

    // Construir la query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    if (day_of_week !== undefined) {
      updateFields.push('day_of_week = ?');
      updateValues.push(day_of_week);
    }

    if (start_time) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
    }

    if (end_time) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }

    if (service_id !== undefined) {
      updateFields.push('service_id = ?');
      updateValues.push(service_id || null);
    }

    if (max_capacity !== undefined) {
      updateFields.push('max_capacity = ?');
      updateValues.push(max_capacity);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `
      UPDATE schedule_slots
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const stmt = db.prepare(updateQuery);
    stmt.run(...updateValues);

    // Obtener el horario actualizado
    const updatedSlot = db.prepare(`
      SELECT ss.*, s.name as service_name
      FROM schedule_slots ss
      LEFT JOIN services s ON ss.service_id = s.id
      WHERE ss.id = ?
    `).get(id);

    return NextResponse.json({
      message: 'Horario actualizado exitosamente',
      slot: updatedSlot
    });

  } catch (error) {
    console.error('Error updating schedule slot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar horario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Solo permitir a administradores
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar horarios.' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Verificar que el horario existe
    const existingSlot = db.prepare('SELECT * FROM schedule_slots WHERE id = ?').get(id);
    if (!existingSlot) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si hay citas programadas que usan este horario
    const appointmentsCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE schedule_slot_id = ?
        AND status IN ('scheduled', 'confirmed')
    `).get(id) as { count: number };

    if (appointmentsCount.count > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el horario. Hay ${appointmentsCount.count} cita(s) programada(s) que usan este horario.` },
        { status: 400 }
      );
    }

    // Eliminar el horario
    const stmt = db.prepare('DELETE FROM schedule_slots WHERE id = ?');
    stmt.run(id);

    return NextResponse.json({
      message: 'Horario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting schedule slot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}