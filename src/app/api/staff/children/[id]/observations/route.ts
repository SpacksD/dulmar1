import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, getChildObservations, createObservation } from '@/lib/db-staff';
import { createObservationSchema, validateRequest } from '@/lib/validations/staff';

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
      const observations = getChildObservations(db, parseInt(resolvedParams.id));
      return NextResponse.json({ success: true, data: observations });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error in observations API:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener observaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Add child_profile_id and staff_id from params and session
    const dataWithIds = {
      ...body,
      child_profile_id: parseInt(resolvedParams.id),
      staff_id: parseInt(session.user.id),
    };

    const validation = validateRequest(createObservationSchema, dataWithIds);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const db = getStaffDB();

    try {
      const observation = createObservation(db, {
        child_profile_id: validation.data.child_profile_id,
        session_id: validation.data.session_id ?? undefined,
        staff_id: validation.data.staff_id,
        observation_date: validation.data.observation_date,
        category: validation.data.category,
        observation_text: validation.data.observation_text,
        is_important: validation.data.is_important,
        share_with_parent: validation.data.share_with_parent,
      });

      return NextResponse.json({ success: true, data: observation, message: 'Observación creada' });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json({ success: false, error: 'Error al crear observación' }, { status: 500 });
  }
}
