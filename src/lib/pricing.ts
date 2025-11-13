/**
 * Utilidades para cálculo de precios por sesiones
 */

export interface PricingCalculation {
  base_sessions: number;
  additional_sessions: number;
  base_price: number;
  additional_price: number;
  total_price: number;
  total_sessions: number;
}

/**
 * Calcula el precio basado en el número de sesiones
 * - 8 sesiones incluidas en el precio base
 * - Cada 4 sesiones adicionales incrementa 20% del precio base
 *
 * @param basePriceForService Precio base del servicio (para 8 sesiones)
 * @param totalSessions Número total de sesiones solicitadas
 * @returns Objeto con el desglose del cálculo
 */
export function calculateSessionPricing(
  basePriceForService: number,
  totalSessions: number
): PricingCalculation {
  const BASE_SESSIONS = 8;
  const ADDITIONAL_SESSION_BLOCKS = 4;
  const ADDITIONAL_PRICE_PERCENTAGE = 0.20; // 20%

  // Validar que las sesiones sean múltiplos de 4
  if (totalSessions % 4 !== 0) {
    throw new Error('El número de sesiones debe ser múltiplo de 4');
  }

  // Validar mínimo de sesiones
  if (totalSessions < 4) {
    throw new Error('El mínimo son 4 sesiones por mes');
  }

  let finalPrice = basePriceForService;
  let additionalSessions = 0;
  let additionalPrice = 0;

  if (totalSessions > BASE_SESSIONS) {
    additionalSessions = totalSessions - BASE_SESSIONS;
    const additionalBlocks = Math.ceil(additionalSessions / ADDITIONAL_SESSION_BLOCKS);
    additionalPrice = basePriceForService * ADDITIONAL_PRICE_PERCENTAGE * additionalBlocks;
    finalPrice = basePriceForService + additionalPrice;
  }

  return {
    base_sessions: Math.min(totalSessions, BASE_SESSIONS),
    additional_sessions: additionalSessions,
    base_price: basePriceForService,
    additional_price: additionalPrice,
    total_price: finalPrice,
    total_sessions: totalSessions
  };
}

/**
 * Obtiene las opciones de sesiones disponibles
 */
export function getSessionOptions(): Array<{value: number, label: string, description: string}> {
  return [
    {
      value: 4,
      label: '4 sesiones',
      description: '1 por semana (50% del precio base)'
    },
    {
      value: 8,
      label: '8 sesiones',
      description: '2 por semana (precio base)'
    },
    {
      value: 12,
      label: '12 sesiones',
      description: '3 por semana (+20% del precio base)'
    },
    {
      value: 16,
      label: '16 sesiones',
      description: '4 por semana (+40% del precio base)'
    },
    {
      value: 20,
      label: '20 sesiones',
      description: '5 por semana (+60% del precio base)'
    }
  ];
}

/**
 * Calcula el precio para menos de 8 sesiones
 */
export function calculateReducedSessionPricing(
  basePriceForService: number,
  totalSessions: number
): PricingCalculation {
  const BASE_SESSIONS = 8;

  if (totalSessions >= BASE_SESSIONS) {
    return calculateSessionPricing(basePriceForService, totalSessions);
  }

  // Para menos de 8 sesiones, precio proporcional
  const pricePerSession = basePriceForService / BASE_SESSIONS;
  const totalPrice = pricePerSession * totalSessions;

  return {
    base_sessions: totalSessions,
    additional_sessions: 0,
    base_price: totalPrice,
    additional_price: 0,
    total_price: totalPrice,
    total_sessions: totalSessions
  };
}

/**
 * Formatea el precio en soles peruanos
 */
export function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`;
}

/**
 * Obtiene descripción del precio según las sesiones
 */
export function getPricingDescription(sessions: number, basePriceForService: number): string {
  if (sessions === 8) {
    return `Precio base: ${formatPrice(basePriceForService)}`;
  } else if (sessions < 8) {
    const calculation = calculateReducedSessionPricing(basePriceForService, sessions);
    const percentage = Math.round((sessions / 8) * 100);
    return `${percentage}% del precio base: ${formatPrice(calculation.total_price)}`;
  } else {
    const calculation = calculateSessionPricing(basePriceForService, sessions);
    const additionalBlocks = Math.ceil((sessions - 8) / 4);
    const additionalPercentage = additionalBlocks * 20;
    return `Precio base + ${additionalPercentage}%: ${formatPrice(calculation.total_price)}`;
  }
}