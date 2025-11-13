export interface Promotion {
  id: number;
  title: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  min_age?: number;
  max_age?: number;
  applicable_services: number[];
  promo_code?: string;
  start_date: string;
  end_date: string;
  max_uses?: number;
  used_count?: number;
  is_active: boolean;
}

interface DiscountCalculation {
  original_price: number;
  discount_amount: number;
  final_price: number;
  promotion: Promotion;
  is_free_service: boolean;
}

export interface PromotionValidationResult {
  valid: boolean;
  error?: string;
  promotion?: Promotion;
  discount?: DiscountCalculation;
}

export function validatePromotionEligibility(
  promotion: Promotion,
  serviceId: number,
  childAge: number
): { valid: boolean; error?: string } {
  // Check if promotion is active
  if (!promotion.is_active) {
    return { valid: false, error: 'La promoción no está activa' };
  }

  // Check date validity
  const now = new Date();
  const startDate = new Date(promotion.start_date);
  const endDate = new Date(promotion.end_date);

  if (now < startDate) return { valid: false, error: 'La promoción aún no ha comenzado' };
  if (now > endDate) return { valid: false, error: 'La promoción ha expirado' };

  // Check usage limits
  if (promotion.max_uses && promotion.used_count && promotion.used_count >= promotion.max_uses) {
    return { valid: false, error: 'Se ha alcanzado el límite de usos para esta promoción' };
  }

  // Check applicable services
  if (
    promotion.applicable_services.length > 0 &&
    !promotion.applicable_services.includes(serviceId)
  ) {
    return { valid: false, error: 'Esta promoción no es aplicable a este servicio' };
  }

  // Check age limits
  if (childAge !== undefined) {
    if (promotion.min_age && childAge < promotion.min_age)
      return { valid: false, error: `Esta promoción es para niños de ${promotion.min_age} meses en adelante` };
    if (promotion.max_age && childAge > promotion.max_age)
      return { valid: false, error: `Esta promoción es para niños hasta ${promotion.max_age} meses` };
  }

  return { valid: true };
}

export function calculateDiscount(
  promotion: Promotion, 
  originalPrice: number
): DiscountCalculation {
  let discountAmount = 0;
  let finalPrice = originalPrice;
  let isFreeService = false;

  switch (promotion.discount_type) {
    case 'percentage':
      discountAmount = (originalPrice * promotion.discount_value) / 100;
      finalPrice = originalPrice - discountAmount;
      break;
      
    case 'fixed_amount':
      discountAmount = Math.min(promotion.discount_value, originalPrice);
      finalPrice = originalPrice - discountAmount;
      break;
      
    case 'free_service':
      discountAmount = originalPrice;
      finalPrice = 0;
      isFreeService = true;
      break;
  }

  // Ensure final price is never negative
  finalPrice = Math.max(0, finalPrice);
  discountAmount = originalPrice - finalPrice;

  return {
    original_price: originalPrice,
    discount_amount: discountAmount,
    final_price: finalPrice,
    promotion,
    is_free_service: isFreeService
  };
}

export function formatDiscountDisplay(promotion: Promotion): string {
  switch (promotion.discount_type) {
    case 'percentage':
      return `${promotion.discount_value}% de descuento`;
    case 'fixed_amount':
      return `S/. ${promotion.discount_value} de descuento`;
    case 'free_service':
      return 'Servicio gratuito';
    default:
      return 'Descuento aplicado';
  }
}

export function getPromotionSavings(discountCalculation: DiscountCalculation): string {
  if (discountCalculation.is_free_service) {
    return `¡Ahorra S/. ${discountCalculation.original_price.toFixed(2)}!`;
  }
  return `¡Ahorra S/. ${discountCalculation.discount_amount.toFixed(2)}!`;
}

export function isPromotionExpiringSoon(promotion: Promotion, daysThreshold: number = 7): boolean {
  const now = new Date();
  const endDate = new Date(promotion.end_date);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays > 0;
}

export function getPromotionStatus(promotion: Promotion): 'active' | 'expired' | 'scheduled' | 'inactive' {
  if (!promotion.is_active) return 'inactive';
  
  const now = new Date();
  const startDate = new Date(promotion.start_date);
  const endDate = new Date(promotion.end_date);
  
  if (now < startDate) return 'scheduled';
  if (now > endDate) return 'expired';
  
  return 'active';
}