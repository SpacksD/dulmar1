'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Clock, User, Baby, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import ServiceImage from './ServiceImage';

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  duration?: number;
  age_range_min?: number;
  age_range_max?: number;
  primary_image?: string;
}

interface BookingFormData {
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  preferred_date: string;
  preferred_time: string;
  alternative_dates: string[];
  special_requests: string;
  promotion_code: string;
}

interface Promotion {
  id: number;
  title: string;
  promo_code: string;
}

interface Discount {
  discount_amount: number;
  final_price: number;
  is_free_service: boolean;
}

interface PromotionValidation {
  valid: boolean;
  error?: string;
  promotion?: Promotion;
  discount?: Discount;
}

interface Booking {
  id: number;
  booking_code: string;
  service_id: number;
  service_name: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  preferred_date: string;
  preferred_time: string;
  final_price: number;
  discount_amount?: number;
  status: string;
}

interface BookingFormProps {
  service: Service;
  onBookingSuccess: (booking: Booking) => void;
  onCancel: () => void;
}

export default function BookingForm({ service, onBookingSuccess, onCancel }: BookingFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [promotionValidation, setPromotionValidation] = useState<PromotionValidation | null>(null);
  const [validatingPromotion, setValidatingPromotion] = useState(false);
  
  const [formData, setFormData] = useState<BookingFormData>({
    child_name: '',
    child_age: 12,
    parent_name: session?.user?.name || '',
    parent_email: session?.user?.email || '',
    parent_phone: '',
    preferred_date: '',
    preferred_time: '09:00',
    alternative_dates: [''],
    special_requests: '',
    promotion_code: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    if (!formData.preferred_date) {
      setFormData(prev => ({
        ...prev,
        preferred_date: minDate
      }));
    }
  }, [formData.preferred_date]);

  const validateField = (name: string, value: string | number | string[]): string => {
    switch (name) {
      case 'child_name':
        return !String(value).trim() ? 'El nombre del niño es requerido' : '';
      case 'child_age': {
        const age = Number(value);
        if (isNaN(age) || age < 1) return 'La edad del niño es requerida';
        if (service.age_range_min && age < service.age_range_min) {
          return `Este servicio es para niños de ${service.age_range_min} meses en adelante`;
        }
        if (service.age_range_max && age > service.age_range_max) {
          return `Este servicio es para niños hasta ${service.age_range_max} meses`;
        }
        return '';
      }
      case 'parent_name':
        return !String(value).trim() ? 'El nombre del padre/madre es requerido' : '';
      case 'parent_email':
        if (!String(value).trim()) return 'El email es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return 'Email inválido';
        return '';
      case 'parent_phone':
        if (!String(value).trim()) return 'El teléfono es requerido';
        if (!/^\+?[\d\s\-\(\)]{9,}$/.test(String(value))) return 'Teléfono inválido';
        return '';
      case 'preferred_date':
        if (!String(value).trim()) return 'La fecha preferida es requerida';
        const selectedDate = new Date(String(value));
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (selectedDate < tomorrow) return 'La fecha debe ser al menos para mañana';
        return '';
      case 'preferred_time':
        return !String(value).trim() ? 'La hora preferida es requerida' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'child_age' ? parseInt(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }

    // Clear promotion validation if child age changes
    if (name === 'child_age' && promotionValidation) {
      setPromotionValidation(null);
    }
  };

  const handleAlternativeDateChange = (index: number, value: string) => {
    const newDates = [...formData.alternative_dates];
    newDates[index] = value;
    setFormData(prev => ({ ...prev, alternative_dates: newDates }));
  };

  const addAlternativeDate = () => {
    if (formData.alternative_dates.length < 3) {
      setFormData(prev => ({
        ...prev,
        alternative_dates: [...prev.alternative_dates, '']
      }));
    }
  };

  const removeAlternativeDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      alternative_dates: prev.alternative_dates.filter((_, i) => i !== index)
    }));
  };

  const validatePromotion = async () => {
    if (!formData.promotion_code.trim()) {
      setPromotionValidation(null);
      return;
    }

    setValidatingPromotion(true);
    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promo_code: formData.promotion_code,
          service_id: service.id,
          child_age: formData.child_age,
          original_price: service.price
        }),
      });

      const result = await response.json();
      setPromotionValidation(result);
    } catch (error) {
      console.error('Error validating promotion:', error);
      setPromotionValidation({
        valid: false,
        error: 'Error al validar la promoción'
      });
    } finally {
      setValidatingPromotion(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'alternative_dates' && key !== 'special_requests' && key !== 'promotion_code') {
        const error = validateField(key, formData[key as keyof BookingFormData]);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const bookingData = {
        service_id: service.id,
        ...formData,
        alternative_dates: formData.alternative_dates.filter(date => date.trim()),
        promotion_code: formData.promotion_code.trim() || undefined
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (response.ok) {
        onBookingSuccess(result.booking);
      } else {
        alert(result.error || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (promotionValidation?.valid && promotionValidation.discount) {
      return {
        original: service.price,
        discount: promotionValidation.discount.discount_amount,
        final: promotionValidation.discount.final_price,
        isFree: promotionValidation.discount.is_free_service
      };
    }
    return {
      original: service.price,
      discount: 0,
      final: service.price,
      isFree: false
    };
  };

  const price = calculatePrice();

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with service info */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/20">
            <ServiceImage
              src={service.primary_image}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{service.name}</h2>
            <p className="text-blue-100">{service.category}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              {service.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{service.duration} min</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="font-semibold">S/. {price.final.toFixed(2)}</span>
                {price.discount > 0 && (
                  <span className="text-blue-200 line-through text-sm ml-2">
                    S/. {price.original.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Child Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Baby className="h-5 w-5 text-blue-500" />
            Información del Niño/a
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo del niño/a *
              </label>
              <input
                type="text"
                name="child_name"
                value={formData.child_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  errors.child_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre del niño/a"
              />
              {errors.child_name && (
                <p className="text-red-600 text-sm mt-1">{errors.child_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad en meses *
              </label>
              <input
                type="number"
                name="child_age"
                value={formData.child_age}
                onChange={handleInputChange}
                min="1"
                max="72"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  errors.child_age ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.child_age && (
                <p className="text-red-600 text-sm mt-1">{errors.child_age}</p>
              )}
              {service.age_range_min || service.age_range_max ? (
                <p className="text-gray-500 text-sm mt-1">
                  Este servicio es para niños de {service.age_range_min || 0} a {service.age_range_max || 72} meses
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Información del Padre/Madre
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  errors.parent_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Su nombre completo"
              />
              {errors.parent_name && (
                <p className="text-red-600 text-sm mt-1">{errors.parent_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  errors.parent_phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+51 993 521 250"
              />
              {errors.parent_phone && (
                <p className="text-red-600 text-sm mt-1">{errors.parent_phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="parent_email"
              value={formData.parent_email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                errors.parent_email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="su@email.com"
            />
            {errors.parent_email && (
              <p className="text-red-600 text-sm mt-1">{errors.parent_email}</p>
            )}
          </div>
        </div>

        {/* Date and Time */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Fecha y Hora Preferida
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha preferida *
              </label>
              <input
                type="date"
                name="preferred_date"
                value={formData.preferred_date}
                onChange={handleInputChange}
                min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  errors.preferred_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.preferred_date && (
                <p className="text-red-600 text-sm mt-1">{errors.preferred_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora preferida *
              </label>
              <select
                name="preferred_time"
                value={formData.preferred_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.preferred_time ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const hour = 8 + i;
                  const time = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <option key={time} value={time}>
                      {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                    </option>
                  );
                })}
              </select>
              {errors.preferred_time && (
                <p className="text-red-600 text-sm mt-1">{errors.preferred_time}</p>
              )}
            </div>
          </div>

          {/* Alternative Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fechas alternativas (opcional)
            </label>
            {formData.alternative_dates.map((date, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleAlternativeDateChange(index, e.target.value)}
                  min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {formData.alternative_dates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAlternativeDate(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            {formData.alternative_dates.length < 3 && (
              <button
                type="button"
                onClick={addAlternativeDate}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar fecha alternativa
              </button>
            )}
          </div>
        </div>

        {/* Promotion Code */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-500" />
            Código Promocional (opcional)
          </h3>
          
          <div className="flex gap-2">
            <input
              type="text"
              name="promotion_code"
              value={formData.promotion_code}
              onChange={handleInputChange}
              onBlur={validatePromotion}
              placeholder="Ingrese su código promocional"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 uppercase"
            />
            <button
              type="button"
              onClick={validatePromotion}
              disabled={validatingPromotion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {validatingPromotion ? 'Validando...' : 'Validar'}
            </button>
          </div>

          {promotionValidation && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              promotionValidation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {promotionValidation.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                {promotionValidation.valid ? (
                  <div>
                    <p className="text-green-800 font-medium">
                      ¡Promoción válida! {promotionValidation.promotion?.title}
                    </p>
                    <p className="text-green-700 text-sm">
                      Descuento: S/. {price.discount.toFixed(2)} - 
                      Total a pagar: S/. {price.final.toFixed(2)}
                      {price.isFree && ' (¡GRATIS!)'}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-800">{promotionValidation.error}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Solicitudes especiales (opcional)
          </label>
          <textarea
            name="special_requests"
            value={formData.special_requests}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            placeholder="Alguna solicitud especial, alergia, o información adicional..."
          />
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Resumen de Precio</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Precio del servicio:</span>
              <span>S/. {price.original.toFixed(2)}</span>
            </div>
            {price.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento promocional:</span>
                <span>-S/. {price.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total a pagar:</span>
              <span className={price.isFree ? 'text-green-600' : 'text-gray-900'}>
                S/. {price.final.toFixed(2)}
                {price.isFree && ' (¡GRATIS!)'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando reserva...' : 'Crear Reserva'}
          </button>
        </div>
      </form>
    </div>
  );
}