import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { validatePromotionEligibility, calculateDiscount } from '@/lib/promotions';
import { calculateSessionPricing, calculateReducedSessionPricing } from '@/lib/pricing';
import { sendSubscriptionConfirmation } from '@/lib/email-confirmation';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { sendInvoiceEmail } from '@/lib/email';

interface DbSubscription {
  id: number;
  subscription_code: string;
  user_id: number;
  service_id: number;
  service_name: string;
  service_category: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  start_month: number;
  start_year: number;
  preferred_days: string;
  preferred_times: string;
  sessions_per_month: number;
  base_monthly_price: number;
  promotion_id: number | null;
  promotion_code: string | null;
  discount_amount: number;
  final_monthly_price: number;
  status: string;
  payment_status: string;
  confirmed_by: number | null;
  confirmed_by_first_name: string | null;
  confirmed_by_last_name: string | null;
  created_at: string;
  updated_at: string;
  user_first_name: string;
  user_last_name: string;
}

interface DbService {
  id: number;
  name: string;
  price: number;
  is_active: number;
  capacity: number | null;
}

interface DbPromotion {
  id: number;
  title: string;
  promo_code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  applicable_services: string;
  start_date: string;
  end_date: string;
  min_age?: number;
  max_age?: number;
  max_uses?: number;
  used_count?: number;
  is_active: number;
}

interface DbScheduleSlot {
  id: number;
  start_time: string;
  end_time: string;
  day_of_week: number;
}

interface DbInvoice {
  id: number;
  invoice_number: string;
  user_id: number;
  subscription_id: number | null;
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
  // Related data from joins
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_first_name?: string;
  user_last_name?: string;
  child_name?: string;
  child_age?: number;
  service_name?: string;
  subscription_code?: string;
}

interface SubscriptionData {
  service_id: number;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  start_month: number;
  start_year: number;
  preferred_days?: string[]; // Opcional para compatibilidad hacia atrás
  preferred_times?: string[]; // Opcional para compatibilidad hacia atrás
  weekly_schedule: { [key: number]: number | null }; // Día de la semana -> Schedule Slot ID
  sessions_per_month: number;
  base_monthly_price?: number;
  final_monthly_price?: number;
  special_requests?: string;
  promotion_code?: string;
}

function generateSubscriptionCode(): string {
  const prefix = 'SUBS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    // If not admin, only show user's own subscriptions
    if (session.user.role !== 'admin') {
      whereClause += ' AND s.user_id = ?';
      params.push(session.user.id);
    } else if (userId) {
      whereClause += ' AND s.user_id = ?';
      params.push(userId);
    }

    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    // Count total subscriptions
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM subscriptions s
      ${whereClause}
    `);
    const { total } = countStmt.get(...params) as { total: number };

    // Get subscriptions with related data
    const stmt = db.prepare(`
      SELECT s.*,
             sv.name as service_name,
             sv.category as service_category,
             sv.price as service_original_price,
             u.first_name as user_first_name,
             u.last_name as user_last_name,
             u.email as user_email,
             p.title as promotion_title,
             p.discount_type,
             p.discount_value,
             cb.first_name as confirmed_by_first_name,
             cb.last_name as confirmed_by_last_name
      FROM subscriptions s
      LEFT JOIN services sv ON s.service_id = sv.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN promotions p ON s.promotion_id = p.id
      LEFT JOIN users cb ON s.confirmed_by = cb.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const subscriptions = stmt.all(...params, limit, offset) as DbSubscription[];

    // Process the results
    const processedSubscriptions = subscriptions.map((subscription) => ({
      ...subscription,
      preferred_days: subscription.preferred_days ? JSON.parse(subscription.preferred_days) : [],
      preferred_times: subscription.preferred_times ? JSON.parse(subscription.preferred_times) : [],
      user_full_name: `${subscription.user_first_name} ${subscription.user_last_name}`,
      confirmed_by_name: subscription.confirmed_by_first_name
        ? `${subscription.confirmed_by_first_name} ${subscription.confirmed_by_last_name}`
        : null
    }));

    return NextResponse.json({
      subscriptions: processedSubscriptions,
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
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para crear una subscripción' },
        { status: 401 }
      );
    }

    const data: SubscriptionData = await request.json();

    // Validate required fields
    const requiredFields = [
      'service_id', 'child_name', 'child_age', 'parent_name',
      'parent_email', 'parent_phone', 'start_month', 'start_year',
      'weekly_schedule', 'sessions_per_month'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof SubscriptionData]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate weekly schedule
    if (!data.weekly_schedule || typeof data.weekly_schedule !== 'object') {
      return NextResponse.json(
        { error: 'Debe proporcionar un horario semanal válido' },
        { status: 400 }
      );
    }

    // Verificar que al menos un día tenga un horario seleccionado
    const selectedSlots = Object.values(data.weekly_schedule).filter(slot => slot !== null && slot !== undefined);
    if (selectedSlots.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un horario para un día de la semana' },
        { status: 400 }
      );
    }

    // Get service information
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(data.service_id) as DbService | undefined;
    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no disponible' },
        { status: 404 }
      );
    }

    // Check capacity - verificar cuántas subscripciones activas hay para este mes
    const activeSubscriptionsStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM subscriptions
      WHERE service_id = ?
        AND start_month = ?
        AND start_year = ?
        AND status IN ('pending', 'active')
    `);

    const { count: activeSubscriptions } = activeSubscriptionsStmt.get(
      data.service_id,
      data.start_month,
      data.start_year
    ) as { count: number };

    // Solo comprobar capacidad si ésta está definida; null indica capacidad ilimitada
    if (service.capacity !== null && activeSubscriptions >= service.capacity) {
      return NextResponse.json(
        { error: `No hay cupos disponibles para ${data.start_month}/${data.start_year}. Capacidad máxima: ${service.capacity}` },
        { status: 400 }
      );
    }

    // Calculate pricing based on sessions
    const baseServicePrice = service.price || 0;
    let pricingCalculation;

    try {
      if (data.sessions_per_month < 8) {
        pricingCalculation = calculateReducedSessionPricing(baseServicePrice, data.sessions_per_month);
      } else {
        pricingCalculation = calculateSessionPricing(baseServicePrice, data.sessions_per_month);
      }
    } catch {
      return NextResponse.json(
        { error: 'Error en el cálculo de precios por sesiones' },
        { status: 400 }
      );
    }

    const monthlyPrice = pricingCalculation.total_price;
    let promotionId = null;
    let discountAmount = 0;
    let finalMonthlyPrice = monthlyPrice;

    // Validate promotion if provided
    if (data.promotion_code) {
      const promotion = db.prepare(`
        SELECT * FROM promotions
        WHERE promo_code = ? AND is_active = 1
      `).get(data.promotion_code) as DbPromotion | undefined;

      if (promotion) {
        const applicableServices = promotion.applicable_services
          ? JSON.parse(promotion.applicable_services)
          : [];

        const promotionData = {
          ...promotion,
          applicable_services: applicableServices,
          is_active: Boolean(promotion.is_active)
        };

        const eligibility = validatePromotionEligibility(
          promotionData,
          data.service_id,
          data.child_age
        );

        if (eligibility.valid) {
          const discount = calculateDiscount(
            promotionData,
            monthlyPrice
          );

          promotionId = promotion.id;
          discountAmount = discount.discount_amount;
          finalMonthlyPrice = discount.final_price;
        } else {
          return NextResponse.json(
            { error: eligibility.error },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Código promocional no válido' },
          { status: 400 }
        );
      }
    }

    // Generate subscription code
    const subscriptionCode = generateSubscriptionCode();

    // Create subscription
    const stmt = db.prepare(`
      INSERT INTO subscriptions (
        subscription_code, user_id, service_id, child_name, child_age,
        parent_name, parent_email, parent_phone, start_month, start_year,
        preferred_days, preferred_times, weekly_schedule, sessions_per_month, special_requests,
        monthly_price, base_monthly_price, final_monthly_price, promotion_code, promotion_discount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Convert weekly_schedule to legacy format for backward compatibility
    const weeklyScheduleData = data.weekly_schedule || {};
    const selectedDays = Object.keys(weeklyScheduleData).filter(day => weeklyScheduleData[parseInt(day)] !== null);
    const legacyPreferredDays = selectedDays.map(day => {
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      return dayNames[parseInt(day)];
    });

    const result = stmt.run(
      subscriptionCode,
      session.user.id,
      data.service_id,
      data.child_name,
      data.child_age,
      data.parent_name,
      data.parent_email,
      data.parent_phone,
      data.start_month,
      data.start_year,
      JSON.stringify(legacyPreferredDays), // preferred_days (para compatibilidad)
      JSON.stringify([]), // preferred_times (para compatibilidad)
      JSON.stringify(weeklyScheduleData), // weekly_schedule
      data.sessions_per_month,
      data.special_requests || null,
      finalMonthlyPrice, // monthly_price (para compatibilidad)
      monthlyPrice, // base_monthly_price
      finalMonthlyPrice, // final_monthly_price
      data.promotion_code || null,
      discountAmount
    );

    const subscriptionId = result.lastInsertRowid as number;

    // Crear child_profile automáticamente
    try {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - data.child_age);
      const birthDateStr = birthDate.toISOString().split('T')[0];

      const createProfileStmt = db.prepare(`
        INSERT INTO child_profiles (
          subscription_id, birth_date, special_needs,
          allergies, medical_conditions, medications,
          emergency_contacts, updated_by
        ) VALUES (?, ?, ?, '[]', '[]', '[]', '[]', ?)
      `);

      createProfileStmt.run(
        subscriptionId,
        birthDateStr,
        data.special_requests || null,
        session.user.id
      );

      console.log(`✅ Child profile creado automáticamente para subscripción ${subscriptionId}`);
    } catch (error) {
      console.error('Error creando child_profile:', error);
      // No fallar la creación de la subscripción si hay error
    }

    // Increment promotion usage if applicable
    if (promotionId) {
      db.prepare(`
        UPDATE promotions
        SET used_count = COALESCE(used_count, 0) + 1,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(promotionId);
    }

    // Create backward-compatible booking record
    // Para mantener compatibilidad, usamos el primer día del mes como fecha placeholder
    const startDate = new Date(data.start_year, data.start_month - 1, 1);
    const placeholderDate = startDate.toISOString().split('T')[0];

    // Obtener el primer horario seleccionado para el placeholder
    let placeholderTime = '09:00';
    for (const slotId of Object.values(weeklyScheduleData)) {
      if (slotId) {
        // Buscar información del schedule slot para obtener la hora
        const slotInfo = db.prepare('SELECT start_time FROM schedule_slots WHERE id = ?').get(slotId) as DbScheduleSlot | undefined;
        if (slotInfo) {
          placeholderTime = slotInfo.start_time;
          break;
        }
      }
    }

    const bookingStmt = db.prepare(`
      INSERT INTO bookings (
        booking_code, user_id, service_id, child_name, child_age,
        parent_name, parent_email, parent_phone, preferred_date, preferred_time,
        subscription_id, start_month, start_year, preferred_days, preferred_times,
        sessions_per_month, special_requests, status, original_price, promotion_id,
        promotion_code, discount_amount, final_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    bookingStmt.run(
      subscriptionCode,
      session.user.id,
      data.service_id,
      data.child_name,
      data.child_age,
      data.parent_name,
      data.parent_email,
      data.parent_phone,
      placeholderDate, // preferred_date (placeholder)
      placeholderTime, // preferred_time (placeholder)
      subscriptionId,
      data.start_month,
      data.start_year,
      JSON.stringify(legacyPreferredDays), // preferred_days (para compatibilidad)
      JSON.stringify([]), // preferred_times (para compatibilidad, vacío en el nuevo modelo)
      data.sessions_per_month,
      data.special_requests || null,
      'pending',
      monthlyPrice,
      promotionId,
      data.promotion_code || null,
      discountAmount,
      finalMonthlyPrice
    );

    // Generar recibo automáticamente
    const invoiceNumber = generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 días para pagar

    const invoiceStmt = db.prepare(`
      INSERT INTO invoices (
        invoice_number, subscription_id, user_id, invoice_type,
        billing_month, billing_year, due_date, subtotal, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const invoiceResult = invoiceStmt.run(
      invoiceNumber,
      subscriptionId,
      session.user.id,
      'registration',
      data.start_month,
      data.start_year,
      dueDate.toISOString().split('T')[0],
      finalMonthlyPrice,
      finalMonthlyPrice
    );

    // Agregar item al recibo
    const invoiceItemStmt = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id, description, quantity, unit_price, total_price,
        service_id, service_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    invoiceItemStmt.run(
      invoiceResult.lastInsertRowid,
      `Subscripción mensual - ${service.name} (${data.start_month}/${data.start_year})`,
      1,
      finalMonthlyPrice,
      finalMonthlyPrice,
      data.service_id,
      service.name
    );

    // Generar y enviar PDF del recibo inicial
    try {
      // Obtener datos completos del recibo para generar PDF
      const completeInvoiceStmt = db.prepare(`
        SELECT i.*,
               u.first_name || ' ' || u.last_name as user_name,
               u.email as user_email,
               u.phone as user_phone,
               s.subscription_code,
               s.child_name,
               sv.name as service_name
        FROM invoices i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN subscriptions s ON i.subscription_id = s.id
        LEFT JOIN services sv ON s.service_id = sv.id
        WHERE i.id = ?
      `);

      const completeInvoice = completeInvoiceStmt.get(invoiceResult.lastInsertRowid) as DbInvoice;

      // Obtener items del recibo
      const itemsStmt = db.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ?
      `);
      const items = itemsStmt.all(invoiceResult.lastInsertRowid) as Array<{
        id: number;
        description: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        service_name?: string;
      }>;

      // Preparar objeto para generar PDF
      const invoiceForPDF = {
        ...completeInvoice,
        items: items || [],
        payment_history: []
      } as never;

      // Generar PDF
      const pdfBuffer = await generateInvoicePDF(invoiceForPDF);

      // Formatear precio para email
      const formattedAmount = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
      }).format(finalMonthlyPrice);

      // Formatear fecha de vencimiento
      const formattedDueDate = dueDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Enviar email con PDF adjunto
      const emailResult = await sendInvoiceEmail(
        data.parent_email,
        data.parent_name.split(' ')[0], // Primer nombre
        invoiceNumber,
        formattedAmount,
        formattedDueDate,
        pdfBuffer
      );

      if (emailResult.success) {
        console.log('✅ PDF del recibo inicial enviado exitosamente');
      } else {
        console.error('❌ Error enviando PDF del recibo inicial:', emailResult.error);
      }

    } catch (pdfError) {
      console.error('❌ Error generando/enviando PDF del recibo inicial:', pdfError);
      // No fallar la creación de suscripción por error de PDF
    }

    const subscription = {
      id: Number(subscriptionId),
      subscription_code: subscriptionCode,
      user_id: session.user.id,
      service_id: data.service_id,
      service_name: service.name,
      child_name: data.child_name,
      child_age: data.child_age,
      parent_name: data.parent_name,
      parent_email: data.parent_email,
      parent_phone: data.parent_phone,
      start_month: data.start_month,
      start_year: data.start_year,
      preferred_days: data.preferred_days,
      preferred_times: data.preferred_times,
      sessions_per_month: data.sessions_per_month,
      special_requests: data.special_requests,
      status: 'pending',
      base_monthly_price: monthlyPrice,
      promotion_code: data.promotion_code,
      promotion_discount: discountAmount,
      final_monthly_price: finalMonthlyPrice,
      created_at: new Date().toISOString()
    };

    // Enviar confirmación por email
    try {
      await sendSubscriptionConfirmation(subscription as never);
      console.log('✅ Email de confirmación enviado exitosamente');
    } catch (emailError) {
      console.error('❌ Error enviando email de confirmación:', emailError);
      // No fallar la creación de suscripción por error de email
    }

    return NextResponse.json({
      message: 'Subscripción creada exitosamente. Te hemos enviado una confirmación por email.',
      subscription
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}