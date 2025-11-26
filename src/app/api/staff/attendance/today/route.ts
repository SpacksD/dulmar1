import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, getTodaySessions } from '@/lib/db-staff';

export async function GET() {
  try {
    // Auth check
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Check if user is staff or admin
    if (session.user.role !== 'staff' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos de staff' },
        { status: 403 }
      );
    }

    const db = getStaffDB();

    try {
      // Get staff ID from session (null for admin to see all)
      const staffId = session.user.role === 'staff' ? parseInt(session.user.id) : undefined;

      // Get today's sessions with attendance info
      const rawSessions = getTodaySessions(db, staffId);

      // Type assertion for the actual structure returned
      interface TodaySession {
        attendance_id?: number;
        check_in_time?: string;
        absence_reason?: string;
        [key: string]: unknown;
      }
      const sessions = rawSessions as unknown as TodaySession[];

      // Calculate summary
      const summary = {
        total: sessions.length,
        checked_in: sessions.filter(s => s.attendance_id && s.check_in_time).length,
        absent: sessions.filter(s => s.attendance_id && s.absence_reason).length,
        pending: sessions.filter(s => !s.attendance_id || (!s.check_in_time && !s.absence_reason)).length,
      };

      return NextResponse.json({
        success: true,
        data: {
          sessions,
          summary,
        },
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error in attendance today API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener asistencia de hoy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
