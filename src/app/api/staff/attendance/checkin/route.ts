import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, checkInSession } from '@/lib/db-staff';
import { checkInSchema, validateRequest } from '@/lib/validations/staff';

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(checkInSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { session_id, check_in_time, notes } = validation.data;

    const db = getStaffDB();

    try {
      // Perform check-in
      const attendance = checkInSession(
        db,
        session_id,
        parseInt(session.user.id),
        check_in_time
      );

      // Add notes if provided
      if (notes) {
        db.prepare('UPDATE attendance_records SET notes = ? WHERE session_id = ?')
          .run(notes, session_id);
      }

      return NextResponse.json({
        success: true,
        data: attendance,
        message: 'Check-in realizado exitosamente',
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error in check-in API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al realizar check-in',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
