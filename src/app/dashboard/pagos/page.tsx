'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Calendar, FileText, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: string;
  billing_month: number;
  billing_year: number;
  due_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  paid_amount: number;
  service_name: string;
  description: string;
  created_at: string;
  has_pending_payment?: boolean;
}

interface PaymentHistory {
  id: number;
  amount: number;
  payment_method: string;
  payment_reference: string;
  status: string;
  created_at: string;
}

export default function PagosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'yape',
    payment_reference: '',
    payment_proof: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchInvoices();
  }, [session, status, router]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();

        // Check for pending payments for each invoice
        const invoicesWithPaymentStatus = await Promise.all(
          data.invoices.map(async (invoice: Invoice) => {
            try {
              const paymentsResponse = await fetch(`/api/payments?invoice_id=${invoice.id}`);
              if (paymentsResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                // Only check for pending payments (not confirmed, as those should update the invoice status)
                const hasPendingPayment = paymentsData.payments.some(
                  (payment: PaymentHistory) => payment.status === 'pending'
                );
                return { ...invoice, has_pending_payment: hasPendingPayment };
              }
            } catch {
              // If error checking payments, default to false
            }
            return { ...invoice, has_pending_payment: false };
          })
        );

        setInvoices(invoicesWithPaymentStatus);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return `S/ ${price.toFixed(2)}`;
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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Sin pagar';
      case 'unpaid': return 'Sin pagar';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'unpaid': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handlePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    setError('');
    setSuccess('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentData(prev => ({ ...prev, payment_proof: file }));
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('invoice_id', selectedInvoice.id.toString());
      formData.append('amount', selectedInvoice.total_amount.toString());
      formData.append('payment_method', paymentData.payment_method);
      formData.append('payment_reference', paymentData.payment_reference);
      if (paymentData.payment_proof) {
        formData.append('payment_proof', paymentData.payment_proof);
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Pago enviado correctamente. Será revisado por nuestro equipo.');
        setShowPaymentModal(false);
        fetchInvoices(); // Recargar facturas
        setPaymentData({
          payment_method: 'yape',
          payment_reference: '',
          payment_proof: null
        });
      } else {
        setError(result.error || 'Error al procesar el pago');
      }
    } catch {
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Pagos y Recibos</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen de Pagos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => inv.payment_status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sin pagar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => inv.payment_status === 'unpaid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Adeudado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(invoices
                    .filter(inv => inv.payment_status === 'unpaid')
                    .reduce((sum, inv) => sum + inv.total_amount, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Recibos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mis Recibos</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tienes recibos disponibles</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoice_number}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.payment_status)}`}>
                            {getStatusIcon(invoice.payment_status)}
                            <span className="ml-1">{getStatusText(invoice.payment_status)}</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-2">{invoice.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Vence: {formatDate(invoice.due_date)}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {invoice.service_name}
                        </div>
                        <div className="flex items-center">
                          {formatPrice(invoice.total_amount)}
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex items-center space-x-3">
                      <Link
                        href={`/dashboard/recibo/${invoice.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalle
                      </Link>

                      {(invoice.payment_status === 'unpaid' || invoice.payment_status === 'overdue') && !invoice.has_pending_payment && (
                        <button
                          onClick={() => handlePayment(invoice)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pagar
                        </button>
                      )}

                      {invoice.has_pending_payment && (
                        <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md">
                          <Clock className="h-4 w-4 mr-2" />
                          Pago en revisión
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Realizar Pago - {selectedInvoice.invoice_number}
              </h3>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={submitPayment}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a Pagar
                  </label>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(selectedInvoice.total_amount)}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    required
                  >
                    <option value="yape">YAPE</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Operación / Referencia *
                  </label>
                  <input
                    type="text"
                    value={paymentData.payment_reference}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Ingresa el número de operación"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de Pago *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sube una imagen o PDF del comprobante de pago
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Procesando...' : 'Enviar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}