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

export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT
        ss.*,
        s.name as service_name
      FROM schedule_slots ss
      LEFT JOIN services s ON ss.service_id = s.id
      ORDER BY ss.day_of_week, ss.start_time
    `);

    const slots = stmt.all().map((slot) => {
      const slotRow = slot as ScheduleSlotRow;
      return {
        ...slotRow,
        day_name: daysOfWeek[slotRow.day_of_week],
        is_active: Boolean(slotRow.is_active)
      };
    });

    return NextResponse.json({ slots });

  } catch (error) {
    console.error('Error obteniendo schedule slots:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const {
      day_of_week,
      start_time,
      end_time,
      service_id,
      max_capacity
    } = await request.json();

    // Validaciones
    if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: 'Día de la semana inválido (0-6)' },
        { status: 400 }
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'Hora de inicio y fin son requeridas' },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser menor que la hora de fin' },
        { status: 400 }
      );
    }

    // Verificar que no haya conflicto de horarios
    const conflictStmt = db.prepare(`
      SELECT id FROM schedule_slots
      WHERE day_of_week = ?
        AND is_active = 1
        AND (
          (start_time < ? AND end_time > ?) OR
          (start_time < ? AND end_time > ?) OR
          (start_time >= ? AND end_time <= ?)
        )
        AND (service_id = ? OR service_id IS NULL OR ? IS NULL)
    `);

    const conflict = conflictStmt.get(
      day_of_week,
      end_time, start_time,
      end_time, start_time,
      start_time, end_time,
      service_id, service_id
    );

    if (conflict) {
      return NextResponse.json(
        { error: 'Ya existe un horario que se solapa con este' },
        { status: 400 }
      );
    }

    // Insertar el schedule slot
    const stmt = db.prepare(`
      INSERT INTO schedule_slots (
        day_of_week, start_time, end_time, service_id, max_capacity, is_active
      ) VALUES (?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      day_of_week,
      start_time,
      end_time,
      service_id || null,
      max_capacity || 1
    );

    const newSlot = {
      id: result.lastInsertRowid,
      day_of_week,
      day_name: daysOfWeek[day_of_week],
      start_time,
      end_time,
      service_id,
      max_capacity: max_capacity || 1,
      is_active: true
    };

    return NextResponse.json({
      message: 'Horario creado exitosamente',
      slot: newSlot
    });

  } catch (error) {
    console.error('Error creando schedule slot:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
