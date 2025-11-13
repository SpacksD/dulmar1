import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { 
  validatePromotionEligibility, 
  calculateDiscount, 
  PromotionValidationResult 
} from '@/lib/promotions';

export async function POST(request: NextRequest) {
  try {
    const { promo_code, service_id, child_age, original_price } = await request.json();

    if (!promo_code || !service_id || original_price === undefined) {
      return NextResponse.json(
        { error: 'Código promocional, ID del servicio y precio original son requeridos' },
        { status: 400 }
      );
    }

    // Find the promotion by code
    const stmt = db.prepare(`
      SELECT p.*,
             GROUP_CONCAT(i.file_path) as images
      FROM promotions p
      LEFT JOIN images i ON p.id = i.entity_id AND i.entity_type = 'promotion'
      WHERE p.promo_code = ? AND p.is_active = 1
      GROUP BY p.id
    `);

    const promotion = stmt.get(promo_code) as {
      id: number;
      title: string;
      promo_code: string;
      applicable_services: string | null;
      is_active: number;
      is_featured: number;
      discount_type: 'percentage' | 'fixed_amount' | 'free_service';
      discount_value: number;
      start_date: string;
      end_date: string;
      min_age?: number;
      max_age?: number;
      max_uses?: number;
      used_count?: number;
      [key: string]: unknown;
    } | undefined;

    if (!promotion) {
      return NextResponse.json({
        valid: false,
        error: 'Código promocional no válido o no encontrado'
      } as PromotionValidationResult);
    }

    // Parse applicable services
    const applicableServices = promotion.applicable_services
      ? JSON.parse(promotion.applicable_services)
      : [];

    const promotionData = {
      id: promotion.id,
      title: promotion.title,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      min_age: promotion.min_age,
      max_age: promotion.max_age,
      applicable_services: applicableServices,
      promo_code: promotion.promo_code,
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      max_uses: promotion.max_uses,
      used_count: promotion.used_count,
      is_active: Boolean(promotion.is_active)
    };

    // Validate eligibility
    const eligibilityCheck = validatePromotionEligibility(
      promotionData,
      service_id,
      child_age
    );

    if (!eligibilityCheck.valid) {
      return NextResponse.json({
        valid: false,
        error: eligibilityCheck.error
      } as PromotionValidationResult);
    }

    // Calculate discount
    const discountCalculation = calculateDiscount(promotionData, original_price);

    return NextResponse.json({
      valid: true,
      promotion: promotionData,
      discount: discountCalculation
    });

  } catch (error) {
    console.error('Error validating promotion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint for applying a promotion (incrementing usage count)
export async function PUT(request: NextRequest) {
  try {
    const { promo_code } = await request.json();

    if (!promo_code) {
      return NextResponse.json(
        { error: 'Código promocional es requerido' },
        { status: 400 }
      );
    }

    // Find and increment usage count
    const promotion = db.prepare('SELECT id, used_count, max_uses FROM promotions WHERE promo_code = ?').get(promo_code) as {
      id: number;
      used_count: number | null;
      max_uses: number | null;
    } | undefined;
    
    if (!promotion) {
      return NextResponse.json(
        { error: 'Código promocional no encontrado' },
        { status: 404 }
      );
    }

    // Check if promotion still has uses available
    const currentUsedCount = promotion.used_count || 0;
    if (promotion.max_uses && currentUsedCount >= promotion.max_uses) {
      return NextResponse.json(
        { error: 'Esta promoción ya ha alcanzado su límite de usos' },
        { status: 400 }
      );
    }

    // Increment usage count
    const updateStmt = db.prepare(`
      UPDATE promotions 
      SET used_count = COALESCE(used_count, 0) + 1, 
          updated_at = datetime('now')
      WHERE promo_code = ?
    `);
    
    updateStmt.run(promo_code);

    return NextResponse.json({
      message: 'Promoción aplicada exitosamente',
      new_used_count: currentUsedCount + 1
    });

  } catch (error) {
    console.error('Error applying promotion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}