import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

interface SessionRow {
  id: number;
  user_id: number;
  session_date: string;
  session_time: string;
  original_date?: string;
  original_time?: string;
  child_name: string;
  parent_name: string;
  service_name: string;
}

interface UpdateFields {
  status?: string;
  attendance_confirmed?: number;
  session_notes?: string;
  parent_feedback?: string;
  original_date?: string;
  original_time?: string;
  session_date?: string;
  session_time?: string;
  rescheduled_reason?: string;
  rescheduled_by?: number;
  rescheduled_at?: string;
}

// GET - Obtener una sesión específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sessionId = parseInt(id);

    const stmt = db.prepare(`
      SELECT s.*,
             sub.child_name,
             sub.parent_name,
             sub.user_id,
             srv.name as service_name
      FROM sessions s
      INNER JOIN subscriptions sub ON s.subscription_id = sub.id
      INNER JOIN services srv ON sub.service_id = srv.id
      WHERE s.id = ?
    `);

    const sessionData = stmt.get(sessionId) as SessionRow | undefined;

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (session.user.role !== 'admin' && sessionData.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { error: 'No autorizado para ver esta sesión' },
        { status: 403 }
      );
    }

    return NextResponse.json({ session: sessionData });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una sesión (cambiar estado, reprogramar, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sessionId = parseInt(id);
    const body = await request.json();

    // Verificar que la sesión existe
    const existingSession = db.prepare(`
      SELECT s.*, sub.user_id
      FROM sessions s
      INNER JOIN subscriptions sub ON s.subscription_id = sub.id
      WHERE s.id = ?
    `).get(sessionId) as SessionRow | undefined;

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (session.user.role !== 'admin' && existingSession.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { error: 'No autorizado para modificar esta sesión' },
        { status: 403 }
      );
    }

    const allowedUpdates: UpdateFields = {};

    // Campos que se pueden actualizar
    if (body.status) allowedUpdates.status = body.status;
    if (body.attendance_confirmed !== undefined) allowedUpdates.attendance_confirmed = body.attendance_confirmed ? 1 : 0;
    if (body.session_notes) allowedUpdates.session_notes = body.session_notes;
    if (body.parent_feedback) allowedUpdates.parent_feedback = body.parent_feedback;

    // Reprogramación (solo admin)
    if (session.user.role === 'admin' && body.reschedule) {
      if (!existingSession.original_date) {
        allowedUpdates.original_date = existingSession.session_date;
        allowedUpdates.original_time = existingSession.session_time;
      }
      allowedUpdates.session_date = body.reschedule.new_date;
      allowedUpdates.session_time = body.reschedule.new_time;
      allowedUpdates.status = 'rescheduled';
      allowedUpdates.rescheduled_reason = body.reschedule.reason;
      allowedUpdates.rescheduled_by = Number(session.user.id);
      allowedUpdates.rescheduled_at = new Date().toISOString();
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos válidos para actualizar' },
        { status: 400 }
      );
    }

    // Construir query dinámicamente
    const setClause = Object.keys(allowedUpdates)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(allowedUpdates), sessionId];

    const updateStmt = db.prepare(`
      UPDATE sessions
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(...values);

    // Obtener la sesión actualizada
    const updatedSession = db.prepare(`
      SELECT s.*,
             sub.child_name,
             sub.parent_name,
             srv.name as service_name
      FROM sessions s
      INNER JOIN subscriptions sub ON s.subscription_id = sub.id
      INNER JOIN services srv ON sub.service_id = srv.id
      WHERE s.id = ?
    `).get(sessionId);

    return NextResponse.json({
      message: 'Sesión actualizada exitosamente',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar una sesión
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Solo administradores pueden eliminar sesiones
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar sesiones.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sessionId = parseInt(id);

    // Verificar que la sesión existe
    const existingSession = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // En lugar de eliminar, cambiar el estado a cancelled
    const updateStmt = db.prepare(`
      UPDATE sessions
      SET status = 'cancelled', updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(sessionId);

    return NextResponse.json({
      message: 'Sesión cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
