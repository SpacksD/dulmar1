import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Promotion } from '@/lib/promotions';

import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { validatePromotionEligibility, calculateDiscount } from '@/lib/promotions';

interface DbService {
  id: number;
  name: string;
  price: number;
  is_active: number;
}

interface DbPromotion {
  id: number;
  promo_code: string;
  title: string;
  start_date: string;
  end_date: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service'; // ✅ cambia esto
  discount_value: number;
  applicable_services: string;
  is_active: number;
}

interface DbBooking {
  id: number;
  booking_code: string;
  user_id: number;
  service_id: number;
  service_name: string;
  service_category: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  preferred_date: string;
  preferred_time: string;
  alternative_dates: string;
  special_requests: string | null;
  status: string;
  original_price: number;
  promotion_id: number | null;
  promotion_code: string | null;
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
}

function formatDateForDB(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toISOString().split('T')[0];
}

interface BookingData {
  service_id: number;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  preferred_date: string;
  preferred_time: string;
  alternative_dates?: string[];
  special_requests?: string;
  promotion_code?: string;
}

function generateBookingCode(): string {
  const prefix = 'DULM';
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

    // If not admin, only show user's own bookings
    if (session.user.role !== 'admin') {
      whereClause += ' AND b.user_id = ?';
      params.push(session.user.id);
    } else if (userId) {
      whereClause += ' AND b.user_id = ?';
      params.push(userId);
    }

    if (status) {
      whereClause += ' AND b.status = ?';
      params.push(status);
    }

    // Count total bookings
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM bookings b
      ${whereClause}
    `);
    const { total } = countStmt.get(...params) as { total: number };

    // Get bookings with related data
    const stmt = db.prepare(`
      SELECT b.*,
             s.name as service_name,
             s.category as service_category,
             s.price as service_original_price,
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
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const bookings = stmt.all(...params, limit, offset) as DbBooking[];

    // Process the results
    const processedBookings = bookings.map((booking) => ({
      ...booking,
      alternative_dates: booking.alternative_dates ? JSON.parse(booking.alternative_dates) : [],
      user_full_name: `${booking.user_first_name} ${booking.user_last_name}`,
      confirmed_by_name: booking.confirmed_by_first_name
        ? `${booking.confirmed_by_first_name} ${booking.confirmed_by_last_name}`
        : null
    }));

    return NextResponse.json({
      bookings: processedBookings,
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
    console.error('Error fetching bookings:', error);
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
        { error: 'Debe iniciar sesión para hacer una reserva' },
        { status: 401 }
      );
    }

    const data: BookingData = await request.json();

    // Validate required fields
    const requiredFields = [
      'service_id', 'child_name', 'child_age', 'parent_name',
      'parent_email', 'parent_phone', 'preferred_date', 'preferred_time'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof BookingData]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    // Get service information
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(data.service_id) as DbService | undefined;
    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no disponible' },
        { status: 404 }
      );
    }

    const originalPrice = service.price || 0;
    let promotionId = null;
    let discountAmount = 0;
    let finalPrice = originalPrice;

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

        // ✅ Normalizamos y convertimos a tipo Promotion
        const formattedPromotion: Promotion = {
          id: promotion.id,
          title: promotion.title,
          discount_type: promotion.discount_type,
          discount_value: promotion.discount_value,
          applicable_services: applicableServices,
          promo_code: promotion.promo_code,
          start_date: promotion.start_date,
          end_date: promotion.end_date,
          is_active: promotion.is_active === 1, // 🔁 número → booleano
        };

        const eligibility = validatePromotionEligibility(
          formattedPromotion,
          data.service_id,
          data.child_age,
        );

        if (eligibility.valid) {
          const discount = calculateDiscount(formattedPromotion, originalPrice);
          promotionId = promotion.id;
          discountAmount = discount.discount_amount;
          finalPrice = discount.final_price;
        } else {
          return NextResponse.json({ error: eligibility.error }, { status: 400 });
        }
      } else {
        return NextResponse.json(
          { error: 'Código promocional no válido' },
          { status: 400 }
        );
      }

    }

    // Generate booking code
    const bookingCode = generateBookingCode();

    // Create booking
    const stmt = db.prepare(`
      INSERT INTO bookings (
        booking_code, user_id, service_id, child_name, child_age,
        parent_name, parent_email, parent_phone, preferred_date, preferred_time,
        alternative_dates, special_requests, original_price, promotion_id,
        promotion_code, discount_amount, final_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      bookingCode,
      session.user.id,
      data.service_id,
      data.child_name,
      data.child_age,
      data.parent_name,
      data.parent_email,
      data.parent_phone,
      formatDateForDB(data.preferred_date),
      data.preferred_time,
      data.alternative_dates ? JSON.stringify(data.alternative_dates) : null,
      data.special_requests || null,
      originalPrice,
      promotionId,
      data.promotion_code || null,
      discountAmount,
      finalPrice
    );

    // Record history
    const historyStmt = db.prepare(`
      INSERT INTO booking_history (booking_id, action, new_status, changed_by)
      VALUES (?, 'created', 'pending', ?)
    `);
    historyStmt.run(result.lastInsertRowid, session.user.id);

    // Increment promotion usage if applicable
    if (promotionId) {
      db.prepare(`
        UPDATE promotions 
        SET used_count = COALESCE(used_count, 0) + 1, 
            updated_at = datetime('now')
        WHERE id = ?
      `).run(promotionId);
    }

    const booking = {
      id: result.lastInsertRowid,
      booking_code: bookingCode,
      user_id: session.user.id,
      service_id: data.service_id,
      service_name: service.name,
      child_name: data.child_name,
      child_age: data.child_age,
      parent_name: data.parent_name,
      parent_email: data.parent_email,
      parent_phone: data.parent_phone,
      preferred_date: formatDateForDB(data.preferred_date),
      preferred_time: data.preferred_time,
      alternative_dates: data.alternative_dates || [],
      special_requests: data.special_requests,
      status: 'pending',
      original_price: originalPrice,
      promotion_code: data.promotion_code,
      discount_amount: discountAmount,
      final_price: finalPrice,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Reserva creada exitosamente',
      booking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}