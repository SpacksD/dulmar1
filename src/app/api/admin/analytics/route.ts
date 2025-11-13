import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get current date info
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth() + 1;
    const lastMonthYear = lastMonthDate.getFullYear();

    // === USERS STATISTICS ===

    // Total users all time
    const totalUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'user'
    `).get() as { count: number };

    // Users from last month
    const lastMonthUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE role = 'user'
      AND strftime('%Y-%m', created_at) = ?
    `).get(`${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`) as { count: number };

    // Users by month (last 12 months)
    const usersByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'user'
      AND created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all() as { month: string; count: number }[];

    // === BOOKINGS STATISTICS ===

    // Total bookings all time
    const totalBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
    `).get() as { count: number };

    // Bookings from last month
    const lastMonthBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE strftime('%Y-%m', created_at) = ?
    `).get(`${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`) as { count: number };

    // Bookings by month (last 12 months)
    const bookingsByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM bookings
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all() as { month: string; count: number }[];

    // Bookings by status
    const bookingsByStatus = db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM bookings
      GROUP BY status
    `).all() as { status: string; count: number }[];

    // === PAYMENTS STATISTICS ===

    // Total payments all time (confirmed)
    const totalPayments = db.prepare(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payment_history
      WHERE status = 'confirmed'
    `).get() as { count: number; total_amount: number };

    // Payments from last month
    const lastMonthPayments = db.prepare(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payment_history
      WHERE status = 'confirmed'
      AND strftime('%Y-%m', created_at) = ?
    `).get(`${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`) as { count: number; total_amount: number };

    // Payments by month (last 12 months)
    const paymentsByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payment_history
      WHERE status = 'confirmed'
      AND created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all() as { month: string; count: number; total_amount: number }[];

    // Payments by status
    const paymentsByStatus = db.prepare(`
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payment_history
      GROUP BY status
    `).all() as { status: string; count: number; total_amount: number }[];

    // === SERVICES & SUBSCRIPTIONS ===

    // Active subscriptions
    const activeSubscriptions = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'
    `).get() as { count: number };

    // Total services
    const totalServices = db.prepare(`
      SELECT COUNT(*) as count FROM services WHERE is_active = 1
    `).get() as { count: number };

    // Most popular services
    const popularServices = db.prepare(`
      SELECT
        s.name,
        COUNT(sub.id) as subscription_count
      FROM services s
      LEFT JOIN subscriptions sub ON s.id = sub.service_id AND sub.status = 'active'
      WHERE s.is_active = 1
      GROUP BY s.id, s.name
      ORDER BY subscription_count DESC
      LIMIT 5
    `).all() as { name: string; subscription_count: number }[];

    return NextResponse.json({
      users: {
        total: totalUsers.count,
        lastMonth: lastMonthUsers.count,
        byMonth: usersByMonth
      },
      bookings: {
        total: totalBookings.count,
        lastMonth: lastMonthBookings.count,
        byMonth: bookingsByMonth,
        byStatus: bookingsByStatus
      },
      payments: {
        total: {
          count: totalPayments.count,
          amount: totalPayments.total_amount
        },
        lastMonth: {
          count: lastMonthPayments.count,
          amount: lastMonthPayments.total_amount
        },
        byMonth: paymentsByMonth,
        byStatus: paymentsByStatus
      },
      subscriptions: {
        active: activeSubscriptions.count
      },
      services: {
        total: totalServices.count,
        popular: popularServices
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
