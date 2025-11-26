import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, getTodaySessions, getDashboardStats, getDashboardAlerts } from '@/lib/db-staff';

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

    // Dashboard is only for staff, not admin
    if (session.user.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Solo el staff puede acceder al dashboard' },
        { status: 403 }
      );
    }

    const db = getStaffDB();

    try {
      // Get staff ID from session (always staff at this point)
      const staffId = parseInt(session.user.id);

      // Get today's sessions
      const sessions = getTodaySessions(db, staffId);

      // Get dashboard statistics
      const stats = getDashboardStats(db, staffId);

      // Get alerts
      const alerts = getDashboardAlerts(db, staffId);

      return NextResponse.json({
        success: true,
        data: {
          sessions,
          stats,
          alerts,
        },
        message: 'Dashboard data retrieved successfully',
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error in staff dashboard API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos del dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
