'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Gift, Tag, Calendar, Sparkles } from 'lucide-react';
import ServiceImage from './ServiceImage';

interface Promotion {
  id: number;
  title: string;
  short_description: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_service';
  discount_value: number;
  promo_code?: string;
  start_date: string;
  end_date: string;
  max_uses?: number;
  used_count?: number;
  is_featured: boolean;
  primary_image?: string;
}

interface PromotionsModalProps {
  promotions: Promotion[];
  isOpen: boolean;
  onClose: () => void;
}

export default function PromotionsModal({ promotions, isOpen, onClose }: PromotionsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to first promotion when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || promotions.length === 0) return null;

  const currentPromotion = promotions[currentIndex];

  const nextPromotion = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  const prevPromotion = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const getDiscountDisplay = () => {
    if (currentPromotion.discount_type === 'percentage') {
      return `${currentPromotion.discount_value}%`;
    } else if (currentPromotion.discount_type === 'fixed_amount') {
      return `S/. ${currentPromotion.discount_value}`;
    } else {
      return 'GRATIS';
    }
  };

  const getDiscountLabel = () => {
    if (currentPromotion.discount_type === 'percentage') {
      return 'DESCUENTO';
    } else if (currentPromotion.discount_type === 'fixed_amount') {
      return 'DESCUENTO';
    } else {
      return 'SERVICIO';
    }
  };

  const copyPromoCode = async () => {
    if (!currentPromotion.promo_code) return;

    try {
      // Intentar usar la API moderna del portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentPromotion.promo_code);
        alert(`Código ${currentPromotion.promo_code} copiado al portapapeles`);
      } else {
        // Fallback para navegadores que no soportan clipboard API
        fallbackCopyToClipboard(currentPromotion.promo_code);
      }
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      // Usar fallback si falla la API moderna
      fallbackCopyToClipboard(currentPromotion.promo_code);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    try {
      // Crear un elemento de texto temporal
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // Intentar copiar usando execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        alert(`Código ${text} copiado al portapapeles`);
      } else {
        // Si todo falla, mostrar el código para copia manual
        prompt('Copia manualmente este código:', text);
      }
    } catch (error) {
      console.error('Error en fallback copy:', error);
      // Último recurso: mostrar en prompt para copia manual
      prompt('Copia manualmente este código:', text);
    }
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(currentPromotion.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="relative max-w-4xl w-full my-4 sm:my-8 animate-slide-in">
        {/* Close Button - Responsive positioning */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-20 p-2 sm:p-3 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 group shadow-lg"
          aria-label="Cerrar modal"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={prevPromotion}
              className="hidden lg:flex absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/90 rounded-full transition-all duration-200 group shadow-lg items-center justify-center"
              aria-label="Promoción anterior"
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>
            <button
              onClick={nextPromotion}
              className="hidden lg:flex absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/90 rounded-full transition-all duration-200 group shadow-lg items-center justify-center"
              aria-label="Siguiente promoción"
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>
          </>
        )}

        {/* Modal Content */}
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
          {/* Header with sparkles animation */}
          <div className="absolute top-0 left-0 right-0 h-1 sm:h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-75 z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 animate-pulse"></div>
          </div>

          {/* Scrollable content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 overflow-y-auto lg:overflow-visible">
            {/* Image Section - Responsive height */}
            <div className="relative bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center min-h-[250px] sm:min-h-[350px] lg:min-h-[600px] py-8 sm:py-12 lg:py-0">
              {/* Discount Badge - Responsive sizing and positioning */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8 z-10">
                <div className="bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold leading-none">
                    {getDiscountDisplay()}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                    {getDiscountLabel()}
                  </div>
                </div>
              </div>

              {/* Days Remaining Badge - Responsive */}
              {daysRemaining <= 7 && daysRemaining > 0 && (
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-10">
                  <div className="bg-orange-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full flex items-center gap-1 text-xs sm:text-sm font-medium shadow-lg animate-bounce">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{daysRemaining} días restantes</span>
                    <span className="xs:hidden">{daysRemaining}d</span>
                  </div>
                </div>
              )}

              {/* Main Image - Responsive sizing */}
              <div className="w-48 h-48 sm:w-60 sm:h-60 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-2xl border-4 sm:border-6 lg:border-8 border-white/30 backdrop-blur-sm">
                <ServiceImage
                  src={currentPromotion.primary_image}
                  alt={currentPromotion.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  fallbackClassName="bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center"
                  width={320}
                  height={320}
                />
              </div>

              {/* Floating elements - Hidden on mobile for cleaner look */}
              <div className="hidden sm:block absolute top-24 left-24 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-300 rounded-full animate-pulse"></div>
              <div className="hidden sm:block absolute bottom-32 left-16 w-4 h-4 sm:w-6 sm:h-6 bg-pink-300 rounded-full animate-pulse animation-delay-1000"></div>
              <div className="hidden sm:block absolute top-40 right-20 w-2 h-2 sm:w-3 sm:h-3 bg-blue-300 rounded-full animate-pulse animation-delay-2000"></div>
            </div>

            {/* Content Section - Responsive padding and spacing */}
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-4 sm:space-y-5 lg:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                  {currentPromotion.title}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                  {currentPromotion.short_description}
                </p>
                {currentPromotion.description && (
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-2 sm:mt-3 leading-relaxed">
                    {currentPromotion.description}
                  </p>
                )}
              </div>

              {/* Promo Code - Responsive layout */}
              {currentPromotion.promo_code && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">Código promocional:</div>
                        <code className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 tracking-wider break-all">
                          {currentPromotion.promo_code}
                        </code>
                      </div>
                    </div>
                    <button
                      onClick={copyPromoCode}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {/* Validity - Responsive text */}
              <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm lg:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>
                  Válida hasta {new Date(currentPromotion.end_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* CTA Button - Responsive */}
              <div className="pt-2 sm:pt-4">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/servicios';
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
                >
                  ¡Aprovecha esta oferta! 🎉
                </button>
              </div>

              {/* Mobile Navigation Arrows */}
              {promotions.length > 1 && (
                <div className="flex lg:hidden items-center justify-center gap-4 pt-2">
                  <button
                    onClick={prevPromotion}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 shadow-md"
                    aria-label="Promoción anterior"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    {currentIndex + 1} / {promotions.length}
                  </span>
                  <button
                    onClick={nextPromotion}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 shadow-md"
                    aria-label="Siguiente promoción"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dots Indicator - Responsive positioning */}
          {promotions.length > 1 && (
            <div className="hidden lg:flex absolute bottom-4 left-1/2 transform -translate-x-1/2 gap-2 pb-safe">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir a promoción ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Floating Button Component
interface FloatingPromotionsButtonProps {
  onClick: () => void;
  hasPromotions: boolean;
}

export function FloatingPromotionsButton({ onClick, hasPromotions }: FloatingPromotionsButtonProps) {
  if (!hasPromotions) return null;

  return (
    <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-40 animate-bounce-gentle">
      <button
        onClick={onClick}
        className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-200 group relative animate-pulse-glow"
        title="Ver promociones especiales"
        aria-label="Ver promociones especiales"
      >
        <Gift className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform duration-200" />

        {/* Animated ring */}
        <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-red-400 animate-ping opacity-20"></div>

        {/* Badge - Responsive sizing */}
        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold animate-bounce">
          !
        </div>
      </button>
    </div>
  );
}