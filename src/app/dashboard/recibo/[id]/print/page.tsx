'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_name?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  subscription_id?: number;
  user_id: number;
  invoice_type: string;
  billing_month: number;
  billing_year: number;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;

  // Related data
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  service_name?: string;
  child_name?: string;
  child_age?: number;
  subscription_code?: string;

  // Invoice items
  items: InvoiceItem[];

  // Payment history
  payment_history?: PaymentHistoryItem[];
}

interface PaymentHistoryItem {
  id: number;
  payment_method: string;
  payment_reference: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  file_path?: string;
  admin_notes?: string;
  confirmed_by_name?: string;
  created_at: string;
  confirmed_at?: string;
}

export default function InvoicePrintPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const invoiceId = params.id as string;
  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Recibo no encontrado');
        } else if (response.status === 403) {
          setError('No tienes permiso para ver este recibo');
        } else {
          setError('Error al cargar el recibo');
        }
        return;
      }

      const data = await response.json();
      setInvoice(data.invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Error al cargar el recibo');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchInvoice();
  }, [session, status, router, invoiceId, fetchInvoice]);

  useEffect(() => {
    // Auto print when component loads and invoice is ready
    if (invoice && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Small delay to ensure rendering is complete

      return () => clearTimeout(timer);
    }
  }, [invoice, loading]);



  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
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

  const getPaymentStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircle,
          text: 'Pagado'
        };
      case 'pending':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: Clock,
          text: 'Pendiente'
        };
      case 'overdue':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: AlertTriangle,
          text: 'Vencido'
        };
      case 'cancelled':
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: XCircle,
          text: 'Cancelado'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: Clock,
          text: status
        };
    }
  };

  const getInvoiceTypeText = (type: string) => {
    switch (type) {
      case 'registration':
        return 'Registro de Suscripción';
      case 'monthly':
        return 'Mensualidad';
      case 'additional':
        return 'Servicio Adicional';
      default:
        return type;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || `Mes ${month}`;
  };

  const isOverdue = (dueDate: string, paymentStatus: string) => {
    if (paymentStatus === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparando recibo para imprimir...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-20 w-20 mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Recibo no encontrado'}</p>
        </div>
      </div>
    );
  }

  const paymentStatusInfo = getPaymentStatusInfo(invoice.payment_status);
  const overdueStatus = isOverdue(invoice.due_date, invoice.payment_status);

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            font-family: 'Times New Roman', serif !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }

          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }

          .no-print {
            display: none !important;
          }

          .page-break {
            page-break-before: always;
          }

          table {
            border-collapse: collapse !important;
          }

          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
        }

        @media screen {
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
            min-height: 100vh;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Invoice Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-3">🏰</div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">DULMAR</h1>
                  <p className="text-lg text-gray-600">Centro de Estimulación Temprana</p>
                </div>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>RUC:</strong> 12345678901</p>
                <p><strong>Dirección:</strong> Av. Principal 123, Lima, Perú</p>
                <p><strong>Teléfono:</strong> (01) 234-5678</p>
                <p><strong>Email:</strong> info@dulmar.com</p>
              </div>
            </div>

            <div className="text-right">
              <div className="border-2 border-gray-300 rounded-lg p-4 min-w-[280px]">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {getInvoiceTypeText(invoice.invoice_type)}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Número:</span>
                    <span className="font-mono">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Fecha:</span>
                    <span>{formatDate(invoice.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Vencimiento:</span>
                    <span className={overdueStatus ? 'font-bold text-red-600' : ''}>
                      {formatDate(invoice.due_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Período:</span>
                    <span>
                      {getMonthName(invoice.billing_month)} {invoice.billing_year}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 mt-3">
                    <span className="font-medium">Estado:</span>
                    <span className={`font-bold ${
                      invoice.payment_status === 'paid' ? 'text-green-600' :
                      invoice.payment_status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {paymentStatusInfo.text.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8 border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            INFORMACIÓN DEL CLIENTE
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Cliente:</p>
                <p className="font-medium text-gray-900">{invoice.user_name || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email:</p>
                <p className="text-gray-900">{invoice.user_email || 'No disponible'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Teléfono:</p>
                <p className="text-gray-900">{invoice.user_phone || 'No disponible'}</p>
              </div>
              {invoice.subscription_code && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Código de Suscripción:</p>
                  <p className="font-mono text-gray-900">{invoice.subscription_code}</p>
                </div>
              )}
            </div>
          </div>

          {(invoice.child_name || invoice.service_name) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                {invoice.child_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Niño/a:</p>
                    <p className="font-medium text-gray-900">
                      {invoice.child_name}
                      {invoice.child_age && <span className="text-gray-600"> ({invoice.child_age} meses)</span>}
                    </p>
                  </div>
                )}
                {invoice.service_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Servicio:</p>
                    <p className="font-medium text-gray-900">{invoice.service_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">DETALLE DE SERVICIOS</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">
                  DESCRIPCIÓN
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-bold">
                  CANT.
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-bold">
                  P. UNITARIO
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-bold">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{item.description}</div>
                      {item.service_name && (
                        <div className="text-sm text-gray-600">{item.service_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                    {formatPrice(item.unit_price)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold">
                    {formatPrice(item.total_price)}
                  </td>
                </tr>
              ))}

              {/* Empty rows for spacing */}
              <tr>
                <td className="border border-gray-300 px-4 py-3" colSpan={4}>&nbsp;</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-80">
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Subtotal:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                      {formatPrice(invoice.subtotal)}
                    </td>
                  </tr>
                  {invoice.tax_amount > 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">IGV (18%):</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {formatPrice(invoice.tax_amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-100">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-lg">TOTAL:</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-bold text-xl">
                      {formatPrice(invoice.total_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {invoice.payment_status === 'paid' && (
          <div className="mb-8 border border-green-300 rounded-lg p-4 bg-green-50">
            <h3 className="text-lg font-bold text-green-900 mb-4">INFORMACIÓN DE PAGO</h3>
            <div className="grid grid-cols-2 gap-4">
              {invoice.paid_amount && (
                <div>
                  <p className="text-sm font-medium text-green-700">Monto Pagado:</p>
                  <p className="font-bold text-green-900">{formatPrice(invoice.paid_amount)}</p>
                </div>
              )}
              {invoice.paid_at && (
                <div>
                  <p className="text-sm font-medium text-green-700">Fecha de Pago:</p>
                  <p className="font-medium text-green-900">{formatDateTime(invoice.paid_at)}</p>
                </div>
              )}
              {invoice.payment_method && (
                <div>
                  <p className="text-sm font-medium text-green-700">Método de Pago:</p>
                  <p className="font-medium text-green-900 uppercase">{invoice.payment_method}</p>
                </div>
              )}
              {invoice.payment_reference && (
                <div>
                  <p className="text-sm font-medium text-green-700">Referencia:</p>
                  <p className="font-mono text-green-900">{invoice.payment_reference}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div>
              <p className="font-bold text-gray-900">Gracias por confiar en DULMAR</p>
              <p className="text-sm text-gray-600">Centro de Estimulación Temprana</p>
              <p className="text-xs text-gray-500 mt-2">
                Este documento es válido sin firma ni sello
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-600">
                <strong>Generado:</strong> {formatDateTime(invoice.created_at)}
              </p>
              {invoice.updated_at !== invoice.created_at && (
                <p className="text-gray-600">
                  <strong>Actualizado:</strong> {formatDateTime(invoice.updated_at)}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Recibo #{invoice.invoice_number}
              </p>
            </div>
          </div>
        </div>

        {/* Print Instructions - Only visible on screen */}
        <div className="no-print mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-center text-gray-600">
            Esta es la versión para imprimir del recibo.
            Use Ctrl+P (Windows) o Cmd+P (Mac) para imprimir o guardar como PDF.
          </p>
        </div>
      </div>
    </>
  );
}