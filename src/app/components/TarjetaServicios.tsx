import React from 'react';
import { Star, ArrowRight, Clock, Baby, Calendar, Tag } from 'lucide-react';
import ServiceImage from './ServiceImage';

// Definir tipo para el servicio
interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  destacado: boolean;
  rating: number;
  edades: string;
  horario: string;
  hasPromotion?: boolean;
  promotionTitle?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
}

// Definir props del componente
interface ServiceCardProps {
  servicio: Servicio;
  onViewMore: (servicio: Servicio) => void;
  onBookNow?: (servicio: Servicio) => void;
  isHighlighted?: boolean;
  showBookingButton?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  servicio,
  onViewMore,
  onBookNow,
  isHighlighted = false,
  showBookingButton = true
}) => {
  const getDiscountText = () => {
    if (!servicio.hasPromotion || !servicio.discountType || !servicio.discountValue) return '';

    if (servicio.discountType === 'percentage') {
      return `-${servicio.discountValue}%`;
    } else if (servicio.discountType === 'fixed_amount') {
      return `-S/. ${servicio.discountValue}`;
    } else if (servicio.discountType === 'free_service') {
      return 'GRATIS';
    }
    return '';
  };

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border ${
      servicio.hasPromotion ? 'border-pink-300 ring-2 ring-pink-200' : isHighlighted ? 'border-blue-200 hover:scale-105' : 'border-gray-100'
    }`}>
      <div className="relative">
        {servicio.hasPromotion && (
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-4 py-2 absolute z-10 top-4 left-4 rounded-full shadow-lg flex items-center">
            <Tag className="h-3 w-3 mr-1" />
            {servicio.promotionTitle || 'PROMOCIÓN'} {getDiscountText()}
          </div>
        )}
        {servicio.destacado && !servicio.hasPromotion && (
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-4 py-2 absolute z-10 top-4 left-4 rounded-full shadow-sm">
            ⭐ DESTACADO
          </div>
        )}
        <ServiceImage
          src={servicio.imagen}
          alt={servicio.nombre}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800">{servicio.nombre}</h3>
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
            {servicio.categoria}
          </span>
        </div>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">{servicio.descripcion}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Baby className="h-4 w-4 text-blue-500 mr-2" />
            <span className="font-semibold text-gray-700">Edades:</span>
            <span className="ml-2">{servicio.edades}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 text-green-500 mr-2" />
            <span className="font-semibold text-gray-700">Horario:</span>
            <span className="ml-2">{servicio.horario}</span>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center mr-4">
            <Star className="h-4 w-4 text-amber-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1 font-semibold">{servicio.rating}</span>
          </div>
          <span className="text-sm text-gray-500">Centro DULMAR</span>
        </div>

        <div className="space-y-3">
          <div className="text-2xl font-bold text-blue-600">
            S/. {servicio.precio}
            <span className="text-sm font-normal text-gray-500">/mes</span>
          </div>
          
          <div className={`flex gap-2 ${showBookingButton ? 'flex-col sm:flex-row' : ''}`}>
            {showBookingButton && onBookNow && (
              <button 
                onClick={() => onBookNow(servicio)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all shadow-sm hover:shadow-md"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Reservar
              </button>
            )}
            <button 
              onClick={() => onViewMore(servicio)}
              className={`${showBookingButton && onBookNow ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all shadow-sm hover:shadow-md`}
            >
              Ver más
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;

// Exportar también el tipo para usar en otros componentes
export type { Servicio, ServiceCardProps };