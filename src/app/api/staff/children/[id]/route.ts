import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, getChildProfileById, upsertChildProfile } from '@/lib/db-staff';
import { updateChildProfileSchema, validateRequest } from '@/lib/validations/staff';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (session.user.role !== 'staff' && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No tienes permisos' }, { status: 403 });
    }

    const resolvedParams = await params;
    const db = getStaffDB();

    try {
      const profile = getChildProfileById(db, parseInt(resolvedParams.id));
      if (!profile) {
        return NextResponse.json({ success: false, error: 'Perfil no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: profile });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error in child profile API:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (session.user.role !== 'staff' && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No tienes permisos' }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validation = validateRequest(updateChildProfileSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const db = getStaffDB();

    try {
      // Get existing profile to find subscription_id
      const existing = getChildProfileById(db, parseInt(resolvedParams.id));
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Perfil no encontrado' }, { status: 404 });
      }

      const updated = upsertChildProfile(db, existing.subscription_id, validation.data, parseInt(session.user.id));
      return NextResponse.json({ success: true, data: updated, message: 'Perfil actualizado' });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error updating child profile:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
