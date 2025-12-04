import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffDB, generateSessionsForSubscription } from '@/lib/db-staff';

export async function POST() {
  try {
    // Auth check
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Only admin can generate sessions
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden generar sesiones' },
        { status: 403 }
      );
    }

    const db = getStaffDB();

    try {
      // Obtener TODAS las subscripciones activas
      const activeSubscriptions = db.prepare(`
        SELECT s.*, srv.duration as service_duration
        FROM subscriptions s
        LEFT JOIN services srv ON s.service_id = srv.id
        WHERE s.status = 'active'
      `).all();

      if (activeSubscriptions.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No hay subscripciones activas para procesar',
          data: {
            subscriptions_processed: 0,
            subscriptions_skipped: 0,
            total_sessions_created: 0,
            details: []
          }
        });
      }

      let totalSessionsCreated = 0;
      let subscriptionsProcessed = 0;
      let subscriptionsSkipped = 0;
      const details: Array<{
        subscription_id: number;
        child_name: string;
        sessions_created: number;
        status: 'success' | 'skipped' | 'error';
        message?: string;
      }> = [];

      // Procesar cada subscripción
      for (const subscription of activeSubscriptions as Array<{
        id: number;
        child_name: string;
        weekly_schedule: string | null;
        service_duration: number;
        [key: string]: unknown;
      }>) {
        try {
          // Verificar si tiene horarios configurados
          const weeklySchedule = subscription.weekly_schedule
            ? JSON.parse(subscription.weekly_schedule)
            : {};

          const hasSlots = Object.values(weeklySchedule).some(slotId => slotId !== null);

          if (!hasSlots) {
            subscriptionsSkipped++;
            details.push({
              subscription_id: subscription.id,
              child_name: subscription.child_name,
              sessions_created: 0,
              status: 'skipped',
              message: 'Sin horarios configurados'
            });
            continue;
          }

          // Generar sesiones
          const sessionsCreated = generateSessionsForSubscription(db, subscription.id);

          if (sessionsCreated > 0) {
            totalSessionsCreated += sessionsCreated;
            subscriptionsProcessed++;
            details.push({
              subscription_id: subscription.id,
              child_name: subscription.child_name,
              sessions_created: sessionsCreated,
              status: 'success'
            });
          } else {
            subscriptionsSkipped++;
            details.push({
              subscription_id: subscription.id,
              child_name: subscription.child_name,
              sessions_created: 0,
              status: 'skipped',
              message: 'Ya tiene sesiones o sin horarios'
            });
          }
        } catch (error) {
          subscriptionsSkipped++;
          details.push({
            subscription_id: subscription.id,
            child_name: subscription.child_name,
            sessions_created: 0,
            status: 'error',
            message: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Generación completada: ${totalSessionsCreated} sesiones creadas`,
        data: {
          subscriptions_processed: subscriptionsProcessed,
          subscriptions_skipped: subscriptionsSkipped,
          total_sessions_created: totalSessionsCreated,
          details
        }
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error generating sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar sesiones',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
