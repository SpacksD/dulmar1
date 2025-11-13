import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

// GET - Obtener horarios de atención
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const dayOfWeek = searchParams.get('day_of_week');
    const activeOnly = searchParams.get('active_only') === 'true';

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (serviceId) {
      whereClause += ' AND (ss.service_id = ? OR ss.service_id IS NULL)';
      params.push(parseInt(serviceId));
    }

    if (dayOfWeek) {
      whereClause += ' AND ss.day_of_week = ?';
      params.push(parseInt(dayOfWeek));
    }

    if (activeOnly) {
      whereClause += ' AND ss.is_active = 1';
    }

    const stmt = db.prepare(`
      SELECT ss.*,
             s.name as service_name
      FROM schedule_slots ss
      LEFT JOIN services s ON ss.service_id = s.id
      ${whereClause}
      ORDER BY ss.day_of_week, ss.start_time
    `);

    const slots = stmt.all(...params) as Array<{
      id: number;
      day_of_week: number;
      service_name: string | null;
      [key: string]: unknown;
    }>;

    // Agregar información adicional sobre días
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const slotsWithDayName = slots.map((slot) => ({
      ...slot,
      day_name: daysOfWeek[slot.day_of_week],
      service_name: slot.service_name || 'Todos los servicios'
    }));

    return NextResponse.json({
      slots: slotsWithDayName,
      total: slots.length
    });

  } catch (error) {
    console.error('Error fetching schedule slots:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo horario de atención
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Solo permitir a administradores
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear horarios.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { day_of_week, start_time, end_time, service_id, max_capacity = 1 } = body;

    // Validaciones
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: 'day_of_week debe estar entre 0 (Domingo) y 6 (Sábado)' },
        { status: 400 }
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'start_time y end_time son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de tiempo (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Formato de tiempo inválido. Use HH:MM' },
        { status: 400 }
      );
    }

    // Validar que start_time sea menor que end_time
    if (start_time >= end_time) {
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

    // Verificar conflictos de horario
    const conflictStmt = db.prepare(`
      SELECT id FROM schedule_slots
      WHERE day_of_week = ?
        AND (service_id = ? OR service_id IS NULL OR ? IS NULL)
        AND is_active = 1
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `);

    const conflict = conflictStmt.get(
      day_of_week,
      service_id,
      service_id,
      start_time, start_time,
      end_time, end_time,
      start_time, end_time
    );

    if (conflict) {
      return NextResponse.json(
        { error: 'Ya existe un horario que se superpone con el horario especificado' },
        { status: 400 }
      );
    }

    // Crear el horario
    const stmt = db.prepare(`
      INSERT INTO schedule_slots (
        day_of_week, start_time, end_time, service_id, max_capacity, is_active
      ) VALUES (?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(day_of_week, start_time, end_time, service_id || null, max_capacity);

    // Obtener el horario creado
    const newSlot = db.prepare(`
      SELECT ss.*, s.name as service_name
      FROM schedule_slots ss
      LEFT JOIN services s ON ss.service_id = s.id
      WHERE ss.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Horario creado exitosamente',
      slot: newSlot
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating schedule slot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}