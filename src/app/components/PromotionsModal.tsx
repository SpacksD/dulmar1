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
    <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="relative max-w-4xl w-full max-h-screen animate-slide-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-20 p-3 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 group shadow-lg"
        >
          <X className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Navigation Arrows */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={prevPromotion}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/90 rounded-full transition-all duration-200 group shadow-lg"
            >
              <ChevronLeft className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>
            <button
              onClick={nextPromotion}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/90 rounded-full transition-all duration-200 group shadow-lg"
            >
              <ChevronRight className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>
          </>
        )}

        {/* Modal Content */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Header with sparkles animation */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-75">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 h-[600px]">
            {/* Image Section */}
            <div className="relative bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
              {/* Discount Badge */}
              <div className="absolute top-8 left-8 z-10">
                <div className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="text-3xl font-bold leading-none">
                    {getDiscountDisplay()}
                  </div>
                  <div className="text-xs font-medium uppercase tracking-wide">
                    {getDiscountLabel()}
                  </div>
                </div>
              </div>

              {/* Days Remaining Badge */}
              {daysRemaining <= 7 && daysRemaining > 0 && (
                <div className="absolute top-8 right-8 z-10">
                  <div className="bg-orange-500 text-white px-3 py-2 rounded-full flex items-center gap-1 text-sm font-medium shadow-lg animate-bounce">
                    <Sparkles className="h-4 w-4" />
                    {daysRemaining} días restantes
                  </div>
                </div>
              )}

              {/* Main Image */}
              <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl border-8 border-white/30 backdrop-blur-sm">
                <ServiceImage
                  src={currentPromotion.primary_image}
                  alt={currentPromotion.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  fallbackClassName="bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center"
                />
              </div>

              {/* Floating elements */}
              <div className="absolute top-24 left-24 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
              <div className="absolute bottom-32 left-16 w-6 h-6 bg-pink-300 rounded-full animate-pulse animation-delay-1000"></div>
              <div className="absolute top-40 right-20 w-3 h-3 bg-blue-300 rounded-full animate-pulse animation-delay-2000"></div>
            </div>

            {/* Content Section */}
            <div className="p-8 flex flex-col justify-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                  {currentPromotion.title}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {currentPromotion.short_description}
                </p>
                {currentPromotion.description && (
                  <p className="text-gray-500 mt-3 leading-relaxed">
                    {currentPromotion.description}
                  </p>
                )}
              </div>

              {/* Promo Code */}
              {currentPromotion.promo_code && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="h-6 w-6 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600 font-medium">Código promocional:</div>
                        <code className="text-2xl font-bold text-blue-600 tracking-wider">
                          {currentPromotion.promo_code}
                        </code>
                      </div>
                    </div>
                    <button
                      onClick={copyPromoCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {/* Validity */}
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-5 w-5" />
                <span>
                  Válida hasta {new Date(currentPromotion.end_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/servicios';
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  ¡Aprovecha esta oferta! 🎉
                </button>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          {promotions.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
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
    <div className="fixed top-20 right-4 z-40 animate-bounce-gentle">
      <button
        onClick={onClick}
        className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 group relative animate-pulse-glow"
        title="Ver promociones especiales"
      >
        <Gift className="h-6 w-6 group-hover:rotate-12 transition-transform duration-200" />
        
        {/* Animated ring */}
        <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-20"></div>
        
        {/* Badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold animate-bounce">
          !
        </div>
      </button>
    </div>
  );
}