import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

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
    const invoiceId = parseInt(id);

    // Build WHERE clause based on user role
    let whereClause = 'WHERE i.id = ?';
    const queryParams = [invoiceId];

    // If not admin, only show user's own invoices
    if (session.user.role !== 'admin') {
      whereClause += ' AND i.user_id = ?';
      queryParams.push(parseInt(session.user.id));
    }

    // Get invoice with related data
    const invoiceStmt = db.prepare(`
      SELECT i.*,
             u.first_name || ' ' || u.last_name as user_name,
             u.email as user_email,
             u.phone as user_phone,
             s.subscription_code,
             s.child_name,
             s.child_age,
             sv.name as service_name
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      LEFT JOIN services sv ON s.service_id = sv.id
      ${whereClause}
    `);

    const invoice = invoiceStmt.get(...queryParams) as Record<string, unknown> | undefined;

    if (!invoice) {
      return NextResponse.json(
        { error: 'Recibo no encontrado' },
        { status: 404 }
      );
    }

    // Get invoice items
    const itemsStmt = db.prepare(`
      SELECT ii.*, s.name as service_name
      FROM invoice_items ii
      LEFT JOIN services s ON ii.service_id = s.id
      WHERE ii.invoice_id = ?
      ORDER BY ii.id
    `);

    const items = itemsStmt.all(invoiceId);

    // Get payment history
    const paymentHistoryStmt = db.prepare(`
      SELECT ph.*,
             u.first_name || ' ' || u.last_name as confirmed_by_name
      FROM payment_history ph
      LEFT JOIN users u ON ph.confirmed_by = u.id
      WHERE ph.invoice_id = ?
      ORDER BY ph.created_at DESC
    `);

    const paymentHistory = paymentHistoryStmt.all(invoiceId);

    // Process payment history to map payment_proof to file_path
    const processedPaymentHistory = (paymentHistory as Record<string, unknown>[] || []).map((payment) => ({
      ...payment,
      file_path: payment.payment_proof // Map payment_proof to file_path
    }));

    // Process the invoice
    const processedInvoice = {
      ...invoice,
      items: items || [],
      payment_history: processedPaymentHistory
    };

    return NextResponse.json({
      invoice: processedInvoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}