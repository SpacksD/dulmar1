import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

const daysOfWeek = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

interface ScheduleSlotRow {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  service_id: number | null;
  max_capacity: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  service_name: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stmt = db.prepare(`
      SELECT
        ss.*,
        s.name as service_name
      FROM schedule_slots ss
      LEFT JOIN services s ON ss.service_id = s.id
      WHERE ss.id = ?
    `);

    const slot = stmt.get(id);

    if (!slot) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    const slotRow = slot as ScheduleSlotRow;
    const slotData = {
      ...slotRow,
      day_name: daysOfWeek[slotRow.day_of_week],
      is_active: Boolean(slotRow.is_active)
    };

    return NextResponse.json({ slot: slotData });

  } catch (error) {
    console.error('Error obteniendo schedule slot:', error);
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
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      day_of_week,
      start_time,
      end_time,
      service_id,
      max_capacity,
      is_active
    } = body;

    // Verificar que el slot existe
    const checkStmt = db.prepare('SELECT id FROM schedule_slots WHERE id = ?');
    const existing = checkStmt.get(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    // Si se está actualizando solo is_active
    if (is_active !== undefined && Object.keys(body).length === 1) {
      const updateStmt = db.prepare(`
        UPDATE schedule_slots
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(is_active ? 1 : 0, id);

      return NextResponse.json({
        message: 'Estado actualizado exitosamente'
      });
    }

    // Validaciones completas
    if (day_of_week !== undefined && (day_of_week < 0 || day_of_week > 6)) {
      return NextResponse.json(
        { error: 'Día de la semana inválido (0-6)' },
        { status: 400 }
      );
    }

    if (start_time && end_time && start_time >= end_time) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser menor que la hora de fin' },
        { status: 400 }
      );
    }

    // Verificar conflictos si se actualiza el horario
    if (day_of_week !== undefined || start_time || end_time) {
      const currentStmt = db.prepare('SELECT * FROM schedule_slots WHERE id = ?');
      const current = currentStmt.get(id) as ScheduleSlotRow;

      const checkDay = day_of_week !== undefined ? day_of_week : current.day_of_week;
      const checkStart = start_time || current.start_time;
      const checkEnd = end_time || current.end_time;
      const checkService = service_id !== undefined ? service_id : current.service_id;

      const conflictStmt = db.prepare(`
        SELECT id FROM schedule_slots
        WHERE id != ?
          AND day_of_week = ?
          AND is_active = 1
          AND (
            (start_time < ? AND end_time > ?) OR
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND end_time <= ?)
          )
          AND (service_id = ? OR service_id IS NULL OR ? IS NULL)
      `);

      const conflict = conflictStmt.get(
        id,
        checkDay,
        checkEnd, checkStart,
        checkEnd, checkStart,
        checkStart, checkEnd,
        checkService, checkService
      );

      if (conflict) {
        return NextResponse.json(
          { error: 'Ya existe un horario que se solapa con este' },
          { status: 400 }
        );
      }
    }

    // Construir query de actualización dinámicamente
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (day_of_week !== undefined) {
      updates.push('day_of_week = ?');
      values.push(day_of_week);
    }
    if (start_time) {
      updates.push('start_time = ?');
      values.push(start_time);
    }
    if (end_time) {
      updates.push('end_time = ?');
      values.push(end_time);
    }
    if (service_id !== undefined) {
      updates.push('service_id = ?');
      values.push(service_id || null);
    }
    if (max_capacity !== undefined) {
      updates.push('max_capacity = ?');
      values.push(max_capacity);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updateStmt = db.prepare(`
      UPDATE schedule_slots
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    updateStmt.run(...values);

    return NextResponse.json({
      message: 'Horario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando schedule slot:', error);
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
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el slot existe
    const checkStmt = db.prepare('SELECT id FROM schedule_slots WHERE id = ?');
    const existing = checkStmt.get(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    const deleteStmt = db.prepare('DELETE FROM schedule_slots WHERE id = ?');
    deleteStmt.run(id);

    return NextResponse.json({
      message: 'Horario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando schedule slot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
