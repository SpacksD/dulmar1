import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, markSessionAbsent } from '@/lib/db-staff';
import { markAbsentSchema, validateRequest } from '@/lib/validations/staff';

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
    const validation = validateRequest(markAbsentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { session_id, absence_reason } = validation.data;
    const db = getStaffDB();

    try {
      const attendance = markSessionAbsent(db, session_id, absence_reason);
      return NextResponse.json({ success: true, data: attendance, message: 'Ausencia registrada' });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error in mark absent API:', error);
    return NextResponse.json({ success: false, error: 'Error al marcar ausencia' }, { status: 500 });
  }
}
