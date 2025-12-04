import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

export async function PUT(
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden gestionar pagos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const paymentId = parseInt(id);
    const { status: newStatus, admin_notes } = await request.json();

    if (!['confirmed', 'rejected'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = db.prepare(`
      SELECT ph.*, i.total_amount, i.payment_status as invoice_payment_status, ph.payment_method, ph.payment_reference
      FROM payment_history ph
      LEFT JOIN invoices i ON ph.invoice_id = i.id
      WHERE ph.id = ?
    `).get(paymentId) as { id: number; status: string; invoice_id: number; invoice_payment_status: string; payment_method: string; payment_reference: string } | undefined;

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Este pago ya fue procesado' },
        { status: 400 }
      );
    }

    // Update payment status
    const updatePaymentStmt = db.prepare(`
      UPDATE payment_history
      SET status = ?, admin_notes = ?, confirmed_by = ?, confirmed_at = datetime('now')
      WHERE id = ?
    `);

    updatePaymentStmt.run(newStatus, admin_notes || null, session.user.id, paymentId);

    // If payment is confirmed, update invoice
    if (newStatus === 'confirmed') {
      const updateInvoiceStmt = db.prepare(`
        UPDATE invoices
        SET payment_status = 'paid',
            paid_amount = total_amount,
            paid_at = datetime('now'),
            payment_method = ?,
            payment_reference = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `);

      updateInvoiceStmt.run(
        payment.payment_method,
        payment.payment_reference,
        payment.invoice_id
      );

      // If this was a subscription invoice, activate the subscription
      const subscriptionStmt = db.prepare(`
        UPDATE subscriptions
        SET status = 'active',
            updated_at = datetime('now')
        WHERE id = (
          SELECT subscription_id FROM invoices WHERE id = ?
        ) AND status = 'pending'
      `);

      subscriptionStmt.run(payment.invoice_id);

      // Generar sessions automáticamente para la subscripción activada
      const subscriptionData = db.prepare(`
        SELECT subscription_id FROM invoices WHERE id = ?
      `).get(payment.invoice_id) as { subscription_id: number } | undefined;

      if (subscriptionData?.subscription_id) {
        try {
          const { generateSessionsForSubscription } = await import('@/lib/db-staff');
          const sessionsCreated = generateSessionsForSubscription(db, subscriptionData.subscription_id);
          console.log(`✅ ${sessionsCreated} sesiones generadas para subscripción ${subscriptionData.subscription_id}`);
        } catch (error) {
          console.error('Error generando sesiones:', error);
          // No fallar la verificación del pago si hay error
        }
      }

      // Also update the booking status if it exists
      const bookingStmt = db.prepare(`
        UPDATE bookings
        SET status = 'confirmed',
            payment_status = 'paid',
            updated_at = datetime('now')
        WHERE subscription_id = (
          SELECT subscription_id FROM invoices WHERE id = ?
        ) AND status = 'pending'
      `);

      bookingStmt.run(payment.invoice_id);
    }

    return NextResponse.json({
      message: `Pago ${newStatus === 'confirmed' ? 'confirmado' : 'rechazado'} exitosamente`
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}