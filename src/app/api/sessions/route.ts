import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { sendAppointmentConfirmation } from '@/lib/email-confirmation';

interface SessionData {
  session_date: string;
  session_time: string;
}

interface SessionRow {
  id: number;
  subscription_id: number;
  session_date: string;
  session_time: string;
  status: string;
  [key: string]: unknown;
}

interface SubscriptionRow {
  id: number;
  subscription_code: string;
  child_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  sessions_per_month: number;
  preferred_days: string;
  preferred_times: string;
  start_month: number;
  start_year: number;
  service_name: string;
  final_monthly_price: number;
  duration: number;
}

interface SessionCountRow {
  count: number;
}

// GET - Obtener sesiones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const status = searchParams.get('status');

    let whereClause = 'WHERE 1=1';
    const params: (number | string)[] = [];

    if (subscriptionId) {
      whereClause += ' AND s.subscription_id = ?';
      params.push(parseInt(subscriptionId));
    }

    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    // Si no es admin, solo puede ver sus propias sesiones
    if (session.user.role !== 'admin') {
      whereClause += ' AND sub.user_id = ?';
      params.push(session.user.id);
    }

    const stmt = db.prepare(`
      SELECT s.*,
             sub.child_name,
             sub.parent_name,
             srv.name as service_name
      FROM sessions s
      INNER JOIN subscriptions sub ON s.subscription_id = sub.id
      INNER JOIN services srv ON sub.service_id = srv.id
      ${whereClause}
      ORDER BY s.session_date, s.session_time
    `);

    const sessions = stmt.all(...params) as SessionRow[];

    return NextResponse.json({
      sessions,
      total: sessions.length
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear sesiones para una suscripción (itinerario)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Solo permitir a administradores
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear sesiones.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription_id, sessions: sessionsData } = body;

    if (!subscription_id || !sessionsData || !Array.isArray(sessionsData)) {
      return NextResponse.json(
        { error: 'subscription_id y sessions son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la suscripción existe
    const subscription = db.prepare(`
      SELECT sub.*,
             srv.name as service_name,
             srv.duration
      FROM subscriptions sub
      INNER JOIN services srv ON sub.service_id = srv.id
      WHERE sub.id = ?
    `).get(subscription_id) as SubscriptionRow | undefined;

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Validar que no existan sesiones duplicadas
    const existingSessionsStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM sessions
      WHERE subscription_id = ?
    `);
    const existingSessions = existingSessionsStmt.get(subscription_id) as SessionCountRow;

    if (existingSessions.count > 0) {
      return NextResponse.json(
        { error: 'Ya existen sesiones creadas para esta suscripción' },
        { status: 400 }
      );
    }

    // Crear sesiones en una transacción
    const insertStmt = db.prepare(`
      INSERT INTO sessions (
        subscription_id,
        session_date,
        session_time,
        session_number,
        duration_minutes,
        status,
        confirmed_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, datetime('now'))
    `);

    const createdSessions: Array<{ id: number | bigint; session_date: string; session_time: string }> = [];

    db.transaction(() => {
      for (let i = 0; i < sessionsData.length; i++) {
        const sessionData = sessionsData[i] as unknown as SessionData;

        const result = insertStmt.run(
          subscription_id,
          sessionData.session_date,
          sessionData.session_time,
          i + 1,
          subscription.duration || 60,
          session.user.id
        );

        createdSessions.push({
          id: result.lastInsertRowid,
          ...sessionData
        });
      }
    })();

    console.log(`✅ ${createdSessions.length} sesiones creadas para suscripción #${subscription_id}`);

    // Preparar datos para el email
    const appointmentsForEmail = createdSessions.map(s => {
      const date = new Date(s.session_date);
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      return {
        appointment_date: s.session_date,
        start_time: s.session_time,
        end_time: calculateEndTime(s.session_time, subscription.duration || 60),
        day_name: daysOfWeek[date.getDay()],
        child_name: subscription.child_name,
        service_name: subscription.service_name
      };
    });

    const subscriptionForEmail = {
      id: subscription.id,
      subscription_code: subscription.subscription_code,
      child_name: subscription.child_name,
      parent_name: subscription.parent_name,
      parent_email: subscription.parent_email,
      parent_phone: subscription.parent_phone,
      sessions_per_month: subscription.sessions_per_month,
      preferred_days: JSON.parse(subscription.preferred_days || '[]'),
      preferred_times: JSON.parse(subscription.preferred_times || '[]'),
      start_month: subscription.start_month,
      start_year: subscription.start_year,
      service_name: subscription.service_name,
      final_monthly_price: subscription.final_monthly_price
    };

    // Enviar email de confirmación de itinerario
    try {
      await sendAppointmentConfirmation(appointmentsForEmail, subscriptionForEmail);
      console.log('✅ Email de confirmación de itinerario enviado exitosamente');
    } catch (emailError) {
      console.error('❌ Error enviando email de confirmación:', emailError);
      // No fallar la creación de sesiones por error de email
    }

    return NextResponse.json({
      message: 'Sesiones creadas exitosamente y confirmación enviada por email',
      sessions: createdSessions,
      total: createdSessions.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para calcular hora de fin
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}
