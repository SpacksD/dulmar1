'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Baby, AlertCircle, Eye, XCircle, CheckCircle2, Tag } from 'lucide-react';
import ServiceImage from '@/app/components/ServiceImage';

interface Booking {
  id: number;
  booking_code: string;
  service_name: string;
  service_category: string;
  child_name: string;
  child_age: number;
  preferred_date: string;
  preferred_time: string;
  alternative_dates: string[];
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  original_price: number;
  promotion_code?: string;
  discount_amount: number;
  final_price: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  confirmed_date?: string;
  confirmed_time?: string;
  admin_notes?: string;
  created_at: string;
  service_images?: string[];
}

export default function MisReservasPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        user_id: session!.user.id.toString(),
        limit: '50'
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/bookings?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [session, filter]);

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [session, router, filter, fetchBookings]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('¿Está seguro de que desea cancelar esta reserva?')) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Cancelado por el usuario'
        }),
      });

      if (response.ok) {
        fetchBookings();
        if (selectedBooking?.id === bookingId) {
          setShowDetails(false);
          setSelectedBooking(null);
        }
        alert('Reserva cancelada exitosamente');
      } else {
        const result = await response.json();
        alert(result.error || 'Error al cancelar la reserva');
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert('Error al cancelar la reserva');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
      no_show: 'No asistió'
    };

    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle2,
      cancelled: XCircle,
      completed: CheckCircle2,
      no_show: XCircle
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mis Reservas</h1>
            <p className="text-gray-600">Gestiona tus reservas de servicios</p>
          </div>
          <div className="text-sm text-gray-600">
            Total: {filteredBookings.length} reservas
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { key: 'all', label: 'Todas', count: bookings.length },
            { key: 'pending', label: 'Pendientes', count: bookings.filter(b => b.status === 'pending').length },
            { key: 'confirmed', label: 'Confirmadas', count: bookings.filter(b => b.status === 'confirmed').length },
            { key: 'completed', label: 'Completadas', count: bookings.filter(b => b.status === 'completed').length },
            { key: 'cancelled', label: 'Canceladas', count: bookings.filter(b => b.status === 'cancelled').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No tienes reservas' : `No tienes reservas ${filter === 'pending' ? 'pendientes' : filter === 'confirmed' ? 'confirmadas' : filter === 'completed' ? 'completadas' : 'canceladas'}`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? 'Explora nuestros servicios y haz tu primera reserva.' 
              : 'Cambia el filtro para ver otras reservas.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => router.push('/servicios')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Servicios
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <ServiceImage
                          src={booking.service_images?.[0]}
                          alt={booking.service_name}
                          className="w-full h-full object-cover"
                          fallbackClassName="bg-gradient-to-br from-blue-100 to-blue-200"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.service_name}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-gray-600">{booking.service_category}</p>
                        <p className="text-xs font-mono text-blue-600 mt-1">
                          #{booking.booking_code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Niño/a</div>
                        <div className="font-medium flex items-center gap-1">
                          <Baby className="h-4 w-4 text-gray-400" />
                          {booking.child_name} ({booking.child_age}m)
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 mb-1">Fecha preferida</div>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(booking.preferred_date)}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 mb-1">Hora</div>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {booking.preferred_time}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 mb-1">Total</div>
                        <div className="font-semibold text-lg text-gray-900">
                          S/. {booking.final_price.toFixed(2)}
                          {booking.discount_amount > 0 && (
                            <span className="text-sm text-green-600 ml-1">
                              (-S/. {booking.discount_amount.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {booking.confirmed_date && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Reserva confirmada</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Fecha confirmada: {formatDate(booking.confirmed_date)} a las {booking.confirmed_time}
                        </p>
                      </div>
                    )}

                    {booking.promotion_code && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Tag className="h-4 w-4" />
                            <span className="font-medium">Promoción aplicada</span>
                          </div>
                          <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                            {booking.promotion_code}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetails(true);
                      }}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalles
                    </button>

                    {['pending', 'confirmed'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                Reserva creada el {formatDateTime(booking.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Reserva #{selectedBooking.booking_code}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex justify-between items-center">
                  {getStatusBadge(selectedBooking.status)}
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total pagado/a pagar</div>
                    <div className="text-xl font-bold text-gray-900">
                      S/. {selectedBooking.final_price.toFixed(2)}
                    </div>
                    {selectedBooking.discount_amount > 0 && (
                      <div className="text-sm text-green-600">
                        Ahorro: S/. {selectedBooking.discount_amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Servicio</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <ServiceImage
                        src={selectedBooking.service_images?.[0]}
                        alt={selectedBooking.service_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-lg">{selectedBooking.service_name}</div>
                      <div className="text-gray-600">{selectedBooking.service_category}</div>
                    </div>
                  </div>
                </div>

                {/* Child Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Información del Niño/a</h4>
                  <div className="flex items-center gap-2">
                    <Baby className="h-5 w-5 text-gray-400" />
                    <span className="font-medium">{selectedBooking.child_name}</span>
                    <span className="text-gray-600">({selectedBooking.child_age} meses)</span>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Fecha y Hora</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Fecha preferida:</span>
                      <span>{formatDate(selectedBooking.preferred_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Hora preferida:</span>
                      <span>{selectedBooking.preferred_time}</span>
                    </div>
                    
                    {selectedBooking.confirmed_date && (
                      <div className="mt-3 p-3 bg-green-100 rounded-lg">
                        <div className="text-green-800 font-medium mb-1">Fecha confirmada:</div>
                        <div className="text-green-700">
                          {formatDate(selectedBooking.confirmed_date)} a las {selectedBooking.confirmed_time}
                        </div>
                      </div>
                    )}

                    {selectedBooking.alternative_dates.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium text-gray-800 mb-1">Fechas alternativas:</div>
                        <div className="text-gray-600 text-sm">
                          {selectedBooking.alternative_dates.map(date => formatDate(date)).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Solicitudes Especiales</h4>
                    <p className="text-gray-700">{selectedBooking.special_requests}</p>
                  </div>
                )}

                {/* Promotion */}
                {selectedBooking.promotion_code && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Promoción Aplicada</h4>
                    <div className="flex justify-between items-center">
                      <code className="font-mono text-green-600 bg-green-100 px-2 py-1 rounded">
                        {selectedBooking.promotion_code}
                      </code>
                      <div className="text-green-600 font-semibold">
                        -S/. {selectedBooking.discount_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedBooking.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Notas del Centro</h4>
                    <p className="text-gray-700">{selectedBooking.admin_notes}</p>
                  </div>
                )}

                {/* Actions */}
                {['pending', 'confirmed'].includes(selectedBooking.status) && (
                  <div className="flex gap-4 pt-4 border-t">
                    <button
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}