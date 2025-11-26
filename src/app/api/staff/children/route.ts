import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, getAllChildProfiles } from '@/lib/db-staff';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (session.user.role !== 'staff' && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No tienes permisos' }, { status: 403 });
    }

    const db = getStaffDB();

    try {
      const profiles = getAllChildProfiles(db);
      return NextResponse.json({ success: true, data: profiles });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error in children API:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener perfiles' }, { status: 500 });
  }
}
