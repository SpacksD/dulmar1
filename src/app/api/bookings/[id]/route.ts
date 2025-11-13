import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

interface DbBookingDetail {
  id: number;
  booking_code: string;
  user_id: number;
  service_id: number;
  service_name: string;
  service_category: string;
  service_description: string;
  duration: number | null;
  capacity: number | null;
  primary_image: string | null;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  preferred_date: string;
  preferred_time: string;
  preferred_days: string | null;
  preferred_times: string | null;
  alternative_dates: string;
  special_requests: string | null;
  status: string;
  original_price: number;
  promotion_id: number | null;
  promotion_title: string | null;
  promotion_code: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_amount: number;
  final_price: number;
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  confirmed_date: string | null;
  confirmed_time: string | null;
  confirmed_by: number | null;
  confirmed_by_first_name: string | null;
  confirmed_by_last_name: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
}

interface DbBooking {
  id: number;
  status: string;
  payment_status: string;
  subscription_id: number | null;
  promotion_id: number | null;
}

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
    const bookingId = parseInt(id);

    let whereClause = 'WHERE b.id = ?';
    const queryParams = [bookingId];

    // If not admin, only show user's own bookings
    if (session.user.role !== 'admin') {
      whereClause += ' AND b.user_id = ?';
      queryParams.push(parseInt(session.user.id));
    }

    // Get booking with related data
    const stmt = db.prepare(`
      SELECT b.*,
             s.name as service_name,
             s.category as service_category,
             s.description as service_description,
             s.duration,
             s.capacity,
             img.file_path as primary_image,
             u.first_name as user_first_name,
             u.last_name as user_last_name,
             u.email as user_email,
             p.title as promotion_title,
             p.discount_type,
             p.discount_value,
             cb.first_name as confirmed_by_first_name,
             cb.last_name as confirmed_by_last_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN promotions p ON b.promotion_id = p.id
      LEFT JOIN users cb ON b.confirmed_by = cb.id
      LEFT JOIN images img ON s.id = img.entity_id AND img.entity_type = 'service' AND img.is_primary = 1
      ${whereClause}
    `);

    const booking = stmt.get(...queryParams) as DbBookingDetail | undefined;

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Process the result
    const processedBooking = {
      ...booking,
      preferred_days: booking.preferred_days ? JSON.parse(booking.preferred_days) : null,
      preferred_times: booking.preferred_times ? JSON.parse(booking.preferred_times) : null,
      user_full_name: `${booking.user_first_name} ${booking.user_last_name}`,
      confirmed_by_name: booking.confirmed_by_first_name
        ? `${booking.confirmed_by_first_name} ${booking.confirmed_by_last_name}`
        : null
    };

    return NextResponse.json({
      booking: processedBooking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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

    // Only admins can update booking status
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden actualizar reservas' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await request.json();
    const { status, admin_notes, cancellation_reason } = body;

    // Verify booking exists
    const booking = db.prepare(`
      SELECT * FROM bookings WHERE id = ?
    `).get(bookingId) as DbBooking | undefined;

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Prepare update fields
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      values.push(admin_notes);
    }

    if (cancellation_reason) {
      updates.push('cancellation_reason = ?');
      values.push(cancellation_reason);
    }

    // Add confirmed_by for confirmed status
    if (status === 'confirmed') {
      updates.push('confirmed_by = ?');
      values.push(session.user.id);
    }

    // Add cancelled_by and cancelled_at for cancelled status
    if (status === 'cancelled') {
      updates.push('cancelled_by = ?');
      values.push(session.user.id);
      updates.push('cancelled_at = datetime(\'now\')');
    }

    updates.push('updated_at = datetime(\'now\')');

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    // Build and execute update query
    values.push(bookingId);
    const updateStmt = db.prepare(`
      UPDATE bookings
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    updateStmt.run(...values);

    // Get updated booking
    const updatedBooking = db.prepare(`
      SELECT b.*,
             s.name as service_name,
             u.first_name as user_first_name,
             u.last_name as user_last_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(bookingId);

    return NextResponse.json({
      message: 'Reserva actualizada exitosamente',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const bookingId = parseInt(id);

    // First, get the booking to verify ownership and status
    let whereClause = 'WHERE id = ?';
    const queryParams = [bookingId];

    // If not admin, only allow deletion of user's own bookings
    if (session.user.role !== 'admin') {
      whereClause += ' AND user_id = ?';
      queryParams.push(Number(session.user.id));
    }

    const booking = db.prepare(`
      SELECT id, status, payment_status, subscription_id, promotion_id
      FROM bookings
      ${whereClause}
    `).get(...queryParams) as DbBooking | undefined;

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending bookings with pending payment
    if (booking.status !== 'pending' || booking.payment_status !== 'pending') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar reservas pendientes sin pago confirmado' },
        { status: 400 }
      );
    }

    // Start transaction-like operations
    try {
      // Delete related invoice items first
      if (booking.subscription_id) {
        db.prepare(`
          DELETE FROM invoice_items
          WHERE invoice_id IN (
            SELECT id FROM invoices WHERE subscription_id = ?
          )
        `).run(booking.subscription_id);

        // Delete related invoices
        db.prepare(`
          DELETE FROM invoices WHERE subscription_id = ?
        `).run(booking.subscription_id);

        // Delete the subscription
        db.prepare(`
          DELETE FROM subscriptions WHERE id = ?
        `).run(booking.subscription_id);
      }

      // Delete the booking
      db.prepare(`DELETE FROM bookings WHERE id = ?`).run(bookingId);

      // If there was a promotion used, decrease the usage count
      if (booking.promotion_id) {
        db.prepare(`
          UPDATE promotions
          SET used_count = COALESCE(used_count, 0) - 1,
              updated_at = datetime('now')
          WHERE id = ? AND used_count > 0
        `).run(booking.promotion_id);
      }

      return NextResponse.json({
        message: 'Reserva eliminada exitosamente'
      });

    } catch (deleteError) {
      console.error('Error during deletion:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la reserva' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}