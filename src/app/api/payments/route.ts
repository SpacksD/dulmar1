import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para realizar un pago' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const invoiceId = parseInt(formData.get('invoice_id') as string);
    const amount = parseFloat(formData.get('amount') as string);
    const paymentMethod = formData.get('payment_method') as string;
    const paymentReference = formData.get('payment_reference') as string;
    const paymentProofFile = formData.get('payment_proof') as File;

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod || !paymentReference) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verify invoice exists and belongs to user
    const invoice = db.prepare(`
      SELECT * FROM invoices
      WHERE id = ? AND user_id = ? AND payment_status IN ('unpaid', 'overdue')
    `).get(invoiceId, session.user.id) as { id: number; user_id: number; payment_status: string } | undefined;

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada o ya está pagada' },
        { status: 404 }
      );
    }

    // Check if there's already a pending payment for this invoice
    const existingPayment = db.prepare(`
      SELECT * FROM payment_history
      WHERE invoice_id = ? AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(invoiceId) as { id: number; invoice_id: number; status: string } | undefined;

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Ya existe un pago pendiente de revisión para este recibo. Debe esperar a que sea procesado.' },
        { status: 400 }
      );
    }

    // Handle file upload
    let paymentProofPath = null;
    if (paymentProofFile) {
      const bytes = await paymentProofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(paymentProofFile.name);
      const fileName = `payment_${invoiceId}_${timestamp}${fileExtension}`;

      // Save file to uploads directory
      const uploadsDir = path.join(process.cwd(), 'uploads', 'payments');

      // Ensure directory exists
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch {
        // Directory might already exist, ignore error
      }

      paymentProofPath = path.join(uploadsDir, fileName);

      try {
        await writeFile(paymentProofPath, buffer);
        paymentProofPath = `/uploads/payments/${fileName}`;
      } catch (error) {
        console.error('Error saving file:', error);
        return NextResponse.json(
          { error: 'Error al guardar el comprobante' },
          { status: 500 }
        );
      }
    }

    // Create payment history record
    const paymentStmt = db.prepare(`
      INSERT INTO payment_history (
        invoice_id, user_id, amount, payment_method,
        payment_reference, payment_proof, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const paymentResult = paymentStmt.run(
      invoiceId,
      session.user.id,
      amount,
      paymentMethod,
      paymentReference,
      paymentProofPath,
      'pending'
    );

    return NextResponse.json({
      message: 'Pago enviado correctamente. Será revisado por nuestro equipo.',
      payment_id: paymentResult.lastInsertRowid
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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
    const invoiceId = searchParams.get('invoice_id');
    const status = searchParams.get('status');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    // If not admin, only show user's own payments
    if (session.user.role !== 'admin') {
      whereClause += ' AND ph.user_id = ?';
      params.push(session.user.id);
    }

    if (invoiceId) {
      whereClause += ' AND ph.invoice_id = ?';
      params.push(invoiceId);
    }

    if (status) {
      whereClause += ' AND ph.status = ?';
      params.push(status);
    }

    const stmt = db.prepare(`
      SELECT ph.*,
             i.invoice_number,
             i.total_amount as invoice_total,
             u.first_name,
             u.last_name,
             admin.first_name as confirmed_by_first_name,
             admin.last_name as confirmed_by_last_name
      FROM payment_history ph
      LEFT JOIN invoices i ON ph.invoice_id = i.id
      LEFT JOIN users u ON ph.user_id = u.id
      LEFT JOIN users admin ON ph.confirmed_by = admin.id
      ${whereClause}
      ORDER BY ph.created_at DESC
    `);

    const payments = stmt.all(...params) as Array<{
      id: number;
      first_name: string;
      last_name: string;
      confirmed_by_first_name?: string;
      confirmed_by_last_name?: string;
      [key: string]: unknown;
    }>;

    // Process the results
    const processedPayments = payments.map((payment) => ({
      ...payment,
      user_full_name: `${payment.first_name} ${payment.last_name}`,
      confirmed_by_name: payment.confirmed_by_first_name
        ? `${payment.confirmed_by_first_name} ${payment.confirmed_by_last_name}`
        : null
    }));

    return NextResponse.json({
      payments: processedPayments
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}