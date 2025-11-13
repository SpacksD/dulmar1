'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Users, Phone, Mail, Eye, X, CheckCircle, XCircle, AlertCircle, Filter, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: number;
  booking_code: string;
  service_id: number;
  service_name?: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  preferred_date: string;
  preferred_time: string;
  alternative_dates: string[];
  special_requests: string;
  status: string;
  original_price: number;
  promotion_code?: string;
  discount_amount: number;
  final_price: number;
  payment_status: string;
  confirmed_date?: string;
  confirmed_time?: string;
  admin_notes?: string;
  created_at: string;
}

export default function MisReservasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [session, status, router]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []); // Corregir estructura API
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'no_show': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'refunded': return 'text-blue-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPaymentStatusText = (status: string): string => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'refunded': return 'Reembolsado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    try {
      setDeleting(bookingId);
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh bookings list
        fetchBookings();
        setDeleteConfirmation(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar la reserva');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error al eliminar la reserva');
    } finally {
      setDeleting(null);
    }
  };

  const canDeleteBooking = (booking: Booking): boolean => {
    return booking.status === 'pending' && booking.payment_status === 'pending';
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  });

  const statusOptions = [
    { value: 'all', label: 'Todas las reservas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-24 w-24 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No tienes reservas' : `No tienes reservas ${statusOptions.find(o => o.value === statusFilter)?.label.toLowerCase()}`}
            </h2>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all'
                ? 'Explora nuestros servicios y crea tu primera reserva'
                : 'Cambia el filtro para ver otras reservas'
              }
            </p>
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar Servicios
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header de la Reserva */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.service_name || 'Servicio'}</h3>
                      <p className="text-sm text-gray-600">Código: {booking.booking_code}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{getStatusText(booking.status)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Información Principal */}
                  <div className="space-y-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{booking.child_name} ({formatAge(booking.child_age)})</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {booking.confirmed_date
                          ? new Date(booking.confirmed_date).toLocaleDateString()
                          : new Date(booking.preferred_date).toLocaleDateString()
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {booking.confirmed_time || booking.preferred_time}
                      </span>
                    </div>
                  </div>

                  {/* Precio y Estado de Pago */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(booking.final_price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">Pago:</span>
                      <span className={`text-sm font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                        {getPaymentStatusText(booking.payment_status)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </button>

                      {canDeleteBooking(booking) && (
                        <button
                          onClick={() => setDeleteConfirmation(booking.id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar reserva"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la Reserva</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Información del Servicio */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Servicio</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{selectedBooking.service_name || 'Servicio'}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusIcon(selectedBooking.status)}
                      <span className="ml-1">{getStatusText(selectedBooking.status)}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Código de reserva: {selectedBooking.booking_code}</p>
                  <p className="text-sm text-gray-600">Fecha de solicitud: {new Date(selectedBooking.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Información del Niño/a */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Niño/a</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600"><strong>Nombre:</strong> {selectedBooking.child_name}</p>
                  <p className="text-sm text-gray-600"><strong>Edad:</strong> {formatAge(selectedBooking.child_age)}</p>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de Contacto</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedBooking.parent_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedBooking.parent_email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedBooking.parent_phone}</span>
                  </div>
                </div>
              </div>

              {/* Fechas y Horarios */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fechas y Horarios</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Fecha Preferida:</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(selectedBooking.preferred_date).toLocaleDateString()} a las {selectedBooking.preferred_time}
                      </span>
                    </div>
                  </div>

                  {selectedBooking.confirmed_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fecha Confirmada:</p>
                      <div className="flex items-center mt-1">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(selectedBooking.confirmed_date).toLocaleDateString()} a las {selectedBooking.confirmed_time}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedBooking.alternative_dates && selectedBooking.alternative_dates.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fechas Alternativas:</p>
                      <div className="mt-1 space-y-1">
                        {selectedBooking.alternative_dates.map((date, index) => (
                          <div key={index} className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-600">{new Date(date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Precios */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de Precios</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio original:</span>
                    <span className="text-sm text-gray-900">{formatPrice(selectedBooking.original_price)}</span>
                  </div>
                  {selectedBooking.discount_amount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Descuento:</span>
                        <span className="text-sm text-green-600">-{formatPrice(selectedBooking.discount_amount)}</span>
                      </div>
                      {selectedBooking.promotion_code && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Código de promoción:</span>
                          <span className="text-sm text-gray-900">{selectedBooking.promotion_code}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-medium text-gray-900">Total:</span>
                    <span className="font-semibold text-gray-900">{formatPrice(selectedBooking.final_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estado del pago:</span>
                    <span className={`text-sm font-medium ${getPaymentStatusColor(selectedBooking.payment_status)}`}>
                      {getPaymentStatusText(selectedBooking.payment_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Solicitudes Especiales */}
              {selectedBooking.special_requests && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Solicitudes Especiales</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{selectedBooking.special_requests}</p>
                  </div>
                </div>
              )}

              {/* Notas del Administrador */}
              {selectedBooking.admin_notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notas del Administrador</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{selectedBooking.admin_notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Reserva</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que deseas eliminar esta reserva? Se eliminará permanentemente y no podrás recuperarla.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={deleting === deleteConfirmation}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteBooking(deleteConfirmation)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deleting === deleteConfirmation}
                >
                  {deleting === deleteConfirmation ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}