'use client';

import { Calendar, Tag, Star, Clock } from 'lucide-react';
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

interface PromotionCardProps {
  promotion: Promotion;
  className?: string;
  showDetails?: boolean;
  onApply?: (promoCode: string) => void;
}

export default function PromotionCard({ 
  promotion, 
  className = "", 
  showDetails = false,
  onApply 
}: PromotionCardProps) {
  const getDiscountDisplay = () => {
    if (promotion.discount_type === 'percentage') {
      return `${promotion.discount_value}%`;
    } else if (promotion.discount_type === 'fixed_amount') {
      return `$${promotion.discount_value}`;
    } else {
      return 'GRATIS';
    }
  };

  const getDiscountLabel = () => {
    if (promotion.discount_type === 'percentage') {
      return 'DESCUENTO';
    } else if (promotion.discount_type === 'fixed_amount') {
      return 'DESCUENTO';
    } else {
      return 'SERVICIO';
    }
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(promotion.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {/* Image Section */}
      <div className="relative">
        <div className="h-48 w-full relative">
          <ServiceImage
            src={promotion.primary_image}
            alt={promotion.title}
            className="w-full h-full object-cover"
            fallbackClassName="bg-gradient-to-br from-blue-400 to-purple-500"
          />
        </div>
        
        {/* Discount Badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg">
            <div className="text-2xl font-bold leading-none">
              {getDiscountDisplay()}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide">
              {getDiscountLabel()}
            </div>
          </div>
        </div>
        
        {/* Featured Badge */}
        {promotion.is_featured && (
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
              <Star className="h-3 w-3 fill-current" />
              Destacada
            </div>
          </div>
        )}
        
        {/* Expiry Warning */}
        {(isExpiringSoon || isExpired) && (
          <div className="absolute bottom-4 right-4">
            <div className={`px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium ${
              isExpired 
                ? 'bg-red-100 text-red-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              <Clock className="h-3 w-3" />
              {isExpired ? 'Expirada' : `${daysRemaining} días`}
            </div>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {promotion.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {promotion.short_description}
          </p>
        </div>
        
        {/* Extended Description for detailed view */}
        {showDetails && promotion.description && (
          <div className="mb-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {promotion.description}
            </p>
          </div>
        )}
        
        {/* Promo Code */}
        {promotion.promo_code && (
          <div className="mb-4">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Código:</span>
                <code className="font-mono font-bold text-blue-600 text-sm">
                  {promotion.promo_code}
                </code>
              </div>
              {onApply && (
                <button
                  onClick={() => onApply(promotion.promo_code!)}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Aplicar
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Usage Info */}
        {showDetails && promotion.max_uses && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Usos disponibles</span>
              <span>{(promotion.max_uses - (promotion.used_count || 0))} / {promotion.max_uses}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${Math.min(100, ((promotion.used_count || 0) / promotion.max_uses) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Validity Period */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            Válida hasta {new Date(promotion.end_date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  );
}