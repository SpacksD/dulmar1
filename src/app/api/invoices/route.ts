import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    // If not admin, only show user's own invoices
    if (session.user.role !== 'admin') {
      whereClause += ' AND i.user_id = ?';
      params.push(session.user.id);
    } else if (userId) {
      whereClause += ' AND i.user_id = ?';
      params.push(userId);
    }

    if (status) {
      whereClause += ' AND i.payment_status = ?';
      params.push(status);
    }

    // Count total invoices
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM invoices i
      ${whereClause}
    `);
    const { total } = countStmt.get(...params) as { total: number };

    // Get invoices with related data
    const stmt = db.prepare(`
      SELECT i.*,
             s.name as service_name,
             u.first_name as user_first_name,
             u.last_name as user_last_name,
             u.email as user_email,
             ii.description
      FROM invoices i
      LEFT JOIN subscriptions sub ON i.subscription_id = sub.id
      LEFT JOIN services s ON sub.service_id = s.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const invoices = stmt.all(...params, limit, offset) as Record<string, unknown>[];

    // Process the results
    const processedInvoices = invoices.map((invoice) => ({
      ...invoice,
      user_full_name: `${invoice.user_first_name} ${invoice.user_last_name}`,
      service_name: invoice.service_name || 'Servicio General'
    }));

    return NextResponse.json({
      invoices: processedInvoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}