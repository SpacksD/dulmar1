'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, CreditCard, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/app/components/ServiceImage';

interface BookingDetails {
  id: number;
  booking_code: string;
  subscription_id?: number;
  service_name: string;
  service_category: string;
  service_description: string;
  primary_image: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;

  // Campos de subscripción
  start_month?: number;
  start_year?: number;
  preferred_days?: string[];
  preferred_times?: string[];
  sessions_per_month?: number;

  // Campos legacy
  preferred_date?: string;
  preferred_time?: string;

  special_requests: string;
  status: string;
  original_price: number;
  discount_amount: number;
  final_price: number;
  payment_status: string;
  created_at: string;
  confirmed_at?: string;
}

interface Session {
  id: number;
  session_date: string;
  session_time: string;
  session_number: number;
  status: string;
  duration_minutes: number;
  session_notes?: string;
  attendance_confirmed: boolean;
}

export default function ReservaDetallePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reservaId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
const fetchBookingDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/${reservaId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);

        // Si es una subscripción, obtener las sesiones
        if (data.booking.subscription_id) {
          fetchSessions(data.booking.subscription_id);
        }
      } else {
        setError('Reserva no encontrada');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError('Error al cargar los detalles de la reserva');
    } finally {
      setLoading(false);
    }
  }, [reservaId]);
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchBookingDetails();
  }, [session, status, router, reservaId, fetchBookingDetails]);

  

  const fetchSessions = async (subscriptionId: number) => {
    try {
      const response = await fetch(`/api/sessions?subscription_id=${subscriptionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const formatAge = (months: number): string => {
    if (months < 12) return `${months} meses`;
    if (months === 12) return '1 año';
    if (months < 24) return `1 año ${months - 12} meses`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths === 0 ? `${years} años` : `${years} años ${remainingMonths} meses`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'active': return 'Activa';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const getSessionStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'confirmed': return 'Confirmada';
      case 'scheduled': return 'Programada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reserva no encontrada</h1>
          <p className="text-gray-600 mt-2">{error || 'La reserva que buscas no existe o no está disponible'}</p>
          <Link href="/dashboard/mis-reservas" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">
            Volver a Mis Reservas
          </Link>
        </div>
      </div>
    );
  }

  const isSubscription = booking.subscription_id && booking.preferred_days;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard/mis-reservas"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver a Mis Reservas
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isSubscription ? 'Detalle de Subscripción' : 'Detalle de Reserva'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contenido Principal */}
          <div className="lg:col-span-2">

            {/* Información del Servicio */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-start space-x-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <ServiceImage
                    src={booking.primary_image}
                    alt={booking.service_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.service_name}</h2>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
                    {booking.service_category}
                  </span>
                  <p className="text-gray-600 leading-relaxed">{booking.service_description}</p>
                </div>
              </div>
            </div>

            {/* Información del Niño y Contacto */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Información del Niño y Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información del Niño/a
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nombre:</span>
                      <span className="ml-2 font-medium text-gray-900">{booking.child_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Edad:</span>
                      <span className="ml-2 font-medium text-gray-900">{formatAge(booking.child_age)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Información de Contacto
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Padre/Madre:</span>
                      <span className="ml-2 font-medium text-gray-900">{booking.parent_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium text-gray-900">{booking.parent_email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="ml-2 font-medium text-gray-900">{booking.parent_phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de la Subscripción o Reserva */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {isSubscription ? 'Configuración de Subscripción' : 'Fecha y Hora'}
              </h3>

              {isSubscription ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Período</h4>
                    <p className="text-gray-900">
                      {monthNames[booking.start_month! - 1]} {booking.start_year}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Sesiones por mes</h4>
                    <p className="text-gray-900">{booking.sessions_per_month} sesiones</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Días preferidos</h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.preferred_days?.map((day, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Horarios preferidos</h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.preferred_times?.map((time, index) => (
                        <span key={index} className="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-medium text-gray-900">
                        {booking.preferred_date ? formatDate(booking.preferred_date) : 'No especificada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Hora</p>
                      <p className="font-medium text-gray-900">{booking.preferred_time || 'No especificada'}</p>
                    </div>
                  </div>
                </div>
              )}

              {booking.special_requests && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Solicitudes Especiales</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{booking.special_requests}</p>
                </div>
              )}
            </div>

            {/* Sesiones (solo para subscripciones) */}
            {isSubscription && sessions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sesiones Programadas</h3>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Sesión #{session.session_number}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                          {getSessionStatusText(session.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(session.session_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {session.session_time} ({session.duration_minutes} min)
                        </div>
                        <div className="flex items-center">
                          {session.attendance_confirmed ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              <span className="text-green-600">Asistencia confirmada</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                              <span>Pendiente de confirmación</span>
                            </>
                          )}
                        </div>
                      </div>

                      {session.session_notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Notas del terapeuta:</strong> {session.session_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">

            {/* Información de la Reserva */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isSubscription ? 'Información de Subscripción' : 'Información de Reserva'}
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Código</p>
                  <p className="font-medium text-gray-900">{booking.booking_code}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha de creación</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.created_at)}</p>
                </div>

                {booking.confirmed_at && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha de confirmación</p>
                    <p className="font-medium text-gray-900">{formatDate(booking.confirmed_at)}</p>
                  </div>
                )}
              </div>

              {/* Información de Precios */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio original:</span>
                    <span className="text-gray-900">{formatPrice(booking.original_price)}</span>
                  </div>
                  {booking.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="text-green-600">-{formatPrice(booking.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">{formatPrice(booking.final_price)}</span>
                  </div>
                </div>
              </div>

              {/* Estado de Pago */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado de pago:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>

                {booking.payment_status === 'unpaid' && (
                  <Link
                    href="/dashboard/pagos"
                    className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ver Pagos y Recibos
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}