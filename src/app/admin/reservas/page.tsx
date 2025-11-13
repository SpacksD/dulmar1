'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search, Calendar, Baby, Phone,
  CheckCircle2, XCircle, Eye
} from 'lucide-react';

interface Booking {
  id: number;
  booking_code: string;
  user_id: number;
  service_id: number;
  service_name: string;
  service_category: string;
  child_name: string;
  child_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
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
  payment_method?: string;
  payment_reference?: string;
  confirmed_date?: string;
  confirmed_time?: string;
  confirmed_by_name?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user_full_name: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ReservasAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_status: '',
    date_from: '',
    date_to: ''
  });

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10'
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/bookings?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setBookings(data.bookings);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    fetchBookings();
  }, [session, router, fetchBookings]);

  const handleStatusUpdate = async (bookingId: number, newStatus: string, additionalData?: { admin_notes?: string; confirmed_date?: string; confirmed_time?: string; cancellation_reason?: string }) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: additionalData?.admin_notes,
          cancellation_reason: additionalData?.cancellation_reason
        }),
      });

      if (response.ok) {
        fetchBookings();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(null);
          setShowDetails(false);
        }
      } else {
        const result = await response.json();
        alert(result.error || 'Error updating booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating booking');
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

    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      pending: 'Pendiente',
      paid: 'Pagado',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Reservas</h1>
            <p className="text-gray-600">Administra todas las reservas del centro infantil</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Total: {pagination.total} reservas</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por código, nombre..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
              <option value="no_show">No asistió</option>
            </select>
          </div>

          <div>
            <select
              value={filters.payment_status}
              onChange={(e) => setFilters(prev => ({ ...prev, payment_status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Estado de pago</option>
              <option value="pending">Pago pendiente</option>
              <option value="paid">Pagado</option>
              <option value="refunded">Reembolsado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Fecha desde"
            />
          </div>

          <div>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Fecha hasta"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
            <p className="text-gray-500">
              {Object.values(filters).some(v => v) 
                ? 'No se encontraron reservas con los filtros aplicados.' 
                : 'Aún no hay reservas registradas.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reserva
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{booking.booking_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDateTime(booking.created_at)}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.parent_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Baby className="h-3 w-3" />
                              {booking.child_name} ({booking.child_age}m)
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.parent_phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.service_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.service_category}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(booking.preferred_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.preferred_time}
                          </div>
                          {booking.confirmed_date && (
                            <div className="text-xs text-green-600 font-medium">
                              Confirmado: {formatDate(booking.confirmed_date)} {booking.confirmed_time}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          {getPaymentStatusBadge(booking.payment_status)}
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            S/. {booking.final_price.toFixed(2)}
                            {booking.discount_amount > 0 && (
                              <span className="text-xs text-green-600 ml-1">
                                (-S/. {booking.discount_amount.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetails(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirmar"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          
                          {['pending', 'confirmed'].includes(booking.status) && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled', {
                                cancellation_reason: 'Cancelado por administrador'
                              })}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} reservas
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalles de Reserva #{selectedBooking.booking_code}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status and Payment */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {getStatusBadge(selectedBooking.status)}
                    {getPaymentStatusBadge(selectedBooking.payment_status)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total a pagar</div>
                    <div className="text-xl font-bold text-gray-900">
                      S/. {selectedBooking.final_price.toFixed(2)}
                    </div>
                    {selectedBooking.discount_amount > 0 && (
                      <div className="text-sm text-green-600">
                        Descuento: -S/. {selectedBooking.discount_amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Servicio</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Servicio</div>
                      <div className="font-medium text-gray-900">{selectedBooking.service_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Categoría</div>
                      <div className="font-medium text-gray-900">{selectedBooking.service_category}</div>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Información del Cliente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Padre/Madre</div>
                      <div className="font-medium text-gray-900">{selectedBooking.parent_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Niño/a</div>
                      <div className="font-medium text-gray-900">{selectedBooking.child_name} ({selectedBooking.child_age} meses)</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-medium text-gray-900">{selectedBooking.parent_email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Teléfono</div>
                      <div className="font-medium text-gray-900">{selectedBooking.parent_phone}</div>
                    </div>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Fecha y Hora</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Fecha preferida</div>
                      <div className="font-medium text-gray-900">{formatDate(selectedBooking.preferred_date)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Hora preferida</div>
                      <div className="font-medium text-gray-900">{selectedBooking.preferred_time}</div>
                    </div>
                    {selectedBooking.confirmed_date && (
                      <>
                        <div>
                          <div className="text-sm text-gray-600">Fecha confirmada</div>
                          <div className="font-medium text-green-600">{formatDate(selectedBooking.confirmed_date)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Hora confirmada</div>
                          <div className="font-medium text-green-600">{selectedBooking.confirmed_time}</div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {selectedBooking.alternative_dates.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600">Fechas alternativas</div>
                      <div className="font-medium text-gray-900">
                        {selectedBooking.alternative_dates.map(date => formatDate(date)).join(', ')}
                      </div>
                    </div>
                  )}
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
                      <div>
                        <div className="font-mono text-sm text-green-600">
                          {selectedBooking.promotion_code}
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold">
                        -S/. {selectedBooking.discount_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedBooking.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Notas del Administrador</h4>
                    <p className="text-gray-700">{selectedBooking.admin_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t">
                  {selectedBooking.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Confirmar Reserva
                    </button>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'completed')}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Marcar como Completada
                    </button>
                  )}
                  
                  {['pending', 'confirmed'].includes(selectedBooking.status) && (
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled', {
                        cancellation_reason: 'Cancelado por administrador'
                      })}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancelar Reserva
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}