import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, checkOutSession } from '@/lib/db-staff';
import { checkOutSchema, validateRequest } from '@/lib/validations/staff';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (session.user.role !== 'staff' && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No tienes permisos' }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateRequest(checkOutSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { session_id, check_out_time, notes } = validation.data;
    const db = getStaffDB();

    try {
      const attendance = checkOutSession(db, session_id, parseInt(session.user.id), check_out_time);
      if (notes) {
        db.prepare('UPDATE attendance_records SET notes = ? WHERE session_id = ?').run(notes, session_id);
      }
      return NextResponse.json({ success: true, data: attendance, message: 'Check-out realizado' });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error in checkout API:', error);
    return NextResponse.json({ success: false, error: 'Error al realizar check-out' }, { status: 500 });
  }
}
