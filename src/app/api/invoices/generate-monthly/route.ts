import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { sendInvoiceEmail } from '@/lib/email';

// Type for the complete invoice from database
interface InvoiceForPDF {
  id: number;
  invoice_number: string;
  subscription_id?: number;
  user_id: number;
  invoice_type: string;
  billing_month: number;
  billing_year: number;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  service_name?: string;
  child_name?: string;
  child_age?: number;
  subscription_code?: string;
  items: Array<{
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    service_name?: string;
  }>;
  payment_history?: Array<{
    id: number;
    payment_method: string;
    payment_reference: string;
    amount: number;
    status: 'pending' | 'confirmed' | 'rejected';
    file_path?: string;
    admin_notes?: string;
    confirmed_by_name?: string;
    created_at: string;
    confirmed_at?: string;
  }>;
}

function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

interface ActiveSubscription {
  id: number;
  subscription_code: string;
  user_id: number;
  service_id: number;
  child_name: string;
  child_age: number;
  monthly_price: number;
  final_monthly_price: number;
  start_month: number;
  start_year: number;
  created_at: string;

  // User info
  user_name: string;
  user_email: string;
  user_phone: string;
  user_first_name: string;

  // Service info
  service_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin users
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden generar recibos mensuales.' },
        { status: 401 }
      );
    }

    const { targetMonth, targetYear } = await request.json();

    // Validate inputs
    if (!targetMonth || !targetYear) {
      return NextResponse.json(
        { error: 'Se requieren targetMonth y targetYear' },
        { status: 400 }
      );
    }

    // Get all active subscriptions
    const subscriptionsStmt = db.prepare(`
      SELECT s.*,
             u.first_name || ' ' || u.last_name as user_name,
             u.first_name as user_first_name,
             u.email as user_email,
             u.phone as user_phone,
             sv.name as service_name
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN services sv ON s.service_id = sv.id
      WHERE s.status = 'active'
        AND s.user_id IS NOT NULL
        AND u.email IS NOT NULL
      ORDER BY s.created_at ASC
    `);

    const activeSubscriptions = subscriptionsStmt.all() as ActiveSubscription[];

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({
        message: 'No hay suscripciones activas para generar recibos.',
        generatedCount: 0,
        emailsSent: 0
      });
    }

    let generatedCount = 0;
    let emailsSent = 0;
    const errors: string[] = [];

    // Process each active subscription
    for (const subscription of activeSubscriptions) {
      try {
        // Check if subscription should be billed for this month
        const subscriptionStart = new Date(subscription.start_year, subscription.start_month - 1, 1);
        const targetDate = new Date(targetYear, targetMonth - 1, 1);

        // Only bill if target month is after or equal to start month
        if (targetDate < subscriptionStart) {
          continue;
        }

        // Check if invoice already exists for this month (any type: registration or monthly)
        // This prevents duplicating invoices when registration already created one for this month
        const existingInvoice = db.prepare(`
          SELECT id, invoice_type FROM invoices
          WHERE subscription_id = ?
            AND billing_month = ?
            AND billing_year = ?
        `).get(subscription.id, targetMonth, targetYear) as { id: number; invoice_type: string } | undefined;

        if (existingInvoice) {
          console.log(`⏭️ Saltando suscripción ${subscription.id} - Ya existe recibo tipo '${existingInvoice.invoice_type}' para ${targetMonth}/${targetYear}`);
          continue; // Skip if invoice already exists (registration or monthly)
        }

        // Calculate due date (7 days from now for monthly invoices)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        // Generate invoice
        const invoiceNumber = generateInvoiceNumber();

        const invoiceStmt = db.prepare(`
          INSERT INTO invoices (
            invoice_number, subscription_id, user_id, invoice_type,
            billing_month, billing_year, due_date, subtotal, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const invoiceResult = invoiceStmt.run(
          invoiceNumber,
          subscription.id,
          subscription.user_id,
          'monthly',
          targetMonth,
          targetYear,
          dueDate.toISOString().split('T')[0],
          subscription.final_monthly_price,
          subscription.final_monthly_price
        );

        // Add invoice item
        const invoiceItemStmt = db.prepare(`
          INSERT INTO invoice_items (
            invoice_id, description, quantity, unit_price, total_price,
            service_id, service_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const monthName = monthNames[targetMonth - 1];

        invoiceItemStmt.run(
          invoiceResult.lastInsertRowid,
          `Mensualidad ${subscription.service_name} - ${monthName} ${targetYear}`,
          1,
          subscription.final_monthly_price,
          subscription.final_monthly_price,
          subscription.service_id,
          subscription.service_name
        );

        generatedCount++;

        // Get the complete invoice data for PDF generation
        const completeInvoiceStmt = db.prepare(`
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
          WHERE i.id = ?
        `);

        const completeInvoice = completeInvoiceStmt.get(invoiceResult.lastInsertRowid) as Omit<InvoiceForPDF, 'items' | 'payment_history' | 'tax_amount'>;

        // Get invoice items
        const itemsStmt = db.prepare(`
          SELECT ii.*
          FROM invoice_items ii
          WHERE ii.invoice_id = ?
        `);

        const items = itemsStmt.all(invoiceResult.lastInsertRowid) as InvoiceForPDF['items'];

        // Prepare invoice object for PDF generation
        const invoiceForPDF: InvoiceForPDF = {
          ...completeInvoice,
          tax_amount: 0, // No tax for now
          items: items || [],
          payment_history: []
        };

        try {
          // Generate PDF
          const pdfBuffer = await generateInvoicePDF(invoiceForPDF);

          // Format price for email
          const formattedAmount = new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2,
          }).format(subscription.final_monthly_price);

          // Format due date for email
          const formattedDueDate = dueDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Send email with PDF attachment
          const emailResult = await sendInvoiceEmail(
            subscription.user_email,
            subscription.user_first_name,
            invoiceNumber,
            formattedAmount,
            formattedDueDate,
            pdfBuffer
          );

          if (emailResult.success) {
            emailsSent++;
          } else {
            errors.push(`Error enviando email a ${subscription.user_email}: ${emailResult.error}`);
          }

        } catch (pdfError) {
          console.error(`Error generando PDF para recibo ${invoiceNumber}:`, pdfError);
          errors.push(`Error generando PDF para ${subscription.user_email}`);
        }

      } catch (subscriptionError) {
        console.error(`Error procesando suscripción ${subscription.id}:`, subscriptionError);
        errors.push(`Error procesando suscripción de ${subscription.user_email}`);
      }
    }

    return NextResponse.json({
      message: `Proceso completado. ${generatedCount} recibos generados, ${emailsSent} emails enviados.`,
      generatedCount,
      emailsSent,
      totalSubscriptions: activeSubscriptions.length,
      errors: errors.length > 0 ? errors : undefined,
      targetMonth,
      targetYear
    });

  } catch (error) {
    console.error('Error en generación de recibos mensuales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET method for testing/status checking
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get count of active subscriptions
    const activeSubscriptionsCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
        AND s.user_id IS NOT NULL
        AND u.email IS NOT NULL
    `).get() as { count: number };

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    return NextResponse.json({
      activeSubscriptions: activeSubscriptionsCount.count,
      currentMonth,
      currentYear,
      message: 'Sistema de facturación mensual listo'
    });

  } catch (error) {
    console.error('Error checking monthly billing status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}