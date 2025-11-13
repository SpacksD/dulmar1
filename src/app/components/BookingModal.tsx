'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import BookingForm from './BookingForm';

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

interface BookingResponse {
  booking_code: string;
  service_name: string;
  child_name: string;
  preferred_date: string;
  preferred_time: string;
  final_price: number;
  discount_amount?: number;
}

interface BookingModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ service, isOpen, onClose }: BookingModalProps) {
  const { data: session } = useSession();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBookingSuccess = (newBooking: BookingResponse) => {
    setBooking(newBooking);
    setShowSuccess(true);
  };

  const handleClose = () => {
    setBooking(null);
    setShowSuccess(false);
    onClose();
  };

  const handleLoginRedirect = () => {
    window.location.href = `/login?redirect=/servicios#book-${service?.id}`;
  };

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="relative max-h-screen overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        {showSuccess ? (
          // Success Message
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Creada!</h3>
            <p className="text-gray-600 mb-6">
              Su reserva ha sido creada exitosamente. Recibirá un email de confirmación en breve.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Detalles de su reserva:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Código de reserva:</span>
                  <span className="font-mono font-bold text-blue-600">{booking?.booking_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicio:</span>
                  <span className="font-medium">{booking?.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Niño/a:</span>
                  <span className="font-medium">{booking?.child_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha preferida:</span>
                  <span className="font-medium">
                    {booking?.preferred_date && new Date(booking.preferred_date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium">{booking?.preferred_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="font-bold text-lg">S/. {booking?.final_price?.toFixed(2)}</span>
                </div>
                {booking?.discount_amount && booking.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento aplicado:</span>
                    <span className="font-medium">-S/. {booking.discount_amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="font-medium text-yellow-800 mb-1">¿Qué sigue?</p>
                <p className="text-yellow-700">
                  Nuestro equipo revisará su solicitud y se pondrá en contacto con usted para 
                  confirmar la fecha y hora, así como coordinar el método de pago.
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : !session ? (
          // Login Required
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión Requerido</h3>
            <p className="text-gray-600 mb-6">
              Debe iniciar sesión para poder realizar una reserva.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={handleClose}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          // Booking Form
          <BookingForm 
            service={service}
            onBookingSuccess={handleBookingSuccess}
            onCancel={handleClose}
          />
        )}
      </div>
    </div>
  );
}