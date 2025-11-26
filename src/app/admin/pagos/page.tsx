'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Eye,
  Search,
  Filter,
  Calendar
} from 'lucide-react';

interface PaymentHistory {
  id: number;
  invoice_id: number;
  invoice_number: string;
  user_full_name: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_proof: string;
  status: string;
  notes: string;
  admin_notes: string;
  confirmed_by_name: string;
  confirmed_at: string;
  created_at: string;
}

export default function AdminPagosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`/api/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchPayments();
  }, [session, status, router, filter, fetchPayments]);

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewPayment = (payment: PaymentHistory) => {
    setSelectedPayment(payment);
    setAdminNotes(payment.admin_notes || '');
    setShowModal(true);
  };

  const handleUpdatePaymentStatus = async (paymentId: number, newStatus: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes
        })
      });

      if (response.ok) {
        await fetchPayments(); // Recargar pagos
        setShowModal(false);
        setSelectedPayment(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar el pago');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error de conexión');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.user_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const statusCounts = {
    pending: payments.filter(p => p.status === 'pending').length,
    confirmed: payments.filter(p => p.status === 'confirmed').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    total: payments.length
  };

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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
              <p className="text-gray-600 mt-1">Administra y confirma los pagos de usuarios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rechazados</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por usuario, factura o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Pagos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pagos Recibidos</h2>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay pagos para mostrar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {payment.invoice_number}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1">{getStatusText(payment.status)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Usuario:</span>
                          <p className="text-gray-900">{payment.user_full_name}</p>
                        </div>
                        <div>
                          <span className="font-medium">Método:</span>
                          <p className="text-gray-900">{payment.payment_method.toUpperCase()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Referencia:</span>
                          <p className="text-gray-900">{payment.payment_reference}</p>
                        </div>
                        <div>
                          <span className="font-medium">Monto:</span>
                          <p className="text-gray-900 font-semibold">{formatPrice(payment.amount)}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Enviado: {formatDate(payment.created_at)}
                        {payment.confirmed_at && (
                          <>
                            <span className="mx-2">•</span>
                            Confirmado: {formatDate(payment.confirmed_at)}
                            {payment.confirmed_by_name && (
                              <span className="ml-1">por {payment.confirmed_by_name}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ml-6">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Revisar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Revisión de Pago */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Revisar Pago - {selectedPayment.invoice_number}
              </h3>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Usuario</label>
                    <p className="text-gray-900">{selectedPayment.user_full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto</label>
                    <p className="text-gray-900 font-semibold">{formatPrice(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                    <p className="text-gray-900">{selectedPayment.payment_method.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Referencia</label>
                    <p className="text-gray-900">{selectedPayment.payment_reference}</p>
                  </div>
                </div>

                {selectedPayment.payment_proof && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante</label>
                    <div className="relative w-full" style={{ minHeight: '200px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api${selectedPayment.payment_proof}`}
                        alt="Comprobante de pago"
                        className="max-w-full h-auto border border-gray-300 rounded-lg"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}

                {selectedPayment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas del Usuario</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedPayment.notes}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del Administrador
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Agregar notas administrativas..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>

                {selectedPayment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'rejected')}
                      disabled={processing}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing ? 'Procesando...' : 'Rechazar'}
                    </button>
                    <button
                      onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'confirmed')}
                      disabled={processing}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? 'Procesando...' : 'Confirmar Pago'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}