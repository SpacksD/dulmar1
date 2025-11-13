'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Receipt,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

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

export default function ReciboDetallePage() {
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

  const generatePDF = async (openInNewTab = false) => {
    try {
      if (!invoice) return;

      // Show loading state
      const originalButton = document.querySelector('[data-pdf-button]') as HTMLElement;
      if (originalButton) {
        originalButton.textContent = 'Generando PDF...';
        originalButton.style.opacity = '0.5';
      }

      // Create PDF using jsPDF directly
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;

      // Helper functions
      const addText = (text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right' | 'justify' }) => {
        pdf.text(text, x, y, options);
      };

      const addLine = (x1: number, y1: number, x2: number, y2: number) => {
        pdf.line(x1, y1, x2, y2);
      };

      const addRect = (x: number, y: number, width: number, height: number, fill?: boolean) => {
        if (fill) {
          pdf.rect(x, y, width, height, 'F');
        } else {
          pdf.rect(x, y, width, height);
        }
      };

      // Header Section
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      addText('DULMAR', margin, currentY);
      currentY += 8;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      addText('Centro de Estimulación Temprana', margin, currentY);
      currentY += 6;

      // Company info
      pdf.setFontSize(10);
      addText('RUC: 12345678901', margin, currentY);
      currentY += 4;
      addText('Dirección: Av. Principal 123, Lima, Perú', margin, currentY);
      currentY += 4;
      addText('Teléfono: (01) 234-5678 | Email: info@dulmar.com', margin, currentY);
      currentY += 10;

      // Invoice info box (right side)
      const boxX = pageWidth - margin - 70;
      const boxY = margin;
      const boxWidth = 70;
      const boxHeight = 35;

      pdf.setFillColor(245, 245, 245);
      addRect(boxX, boxY, boxWidth, boxHeight, true);
      pdf.setDrawColor(200, 200, 200);
      addRect(boxX, boxY, boxWidth, boxHeight);

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      addText(getInvoiceTypeText(invoice.invoice_type), boxX + 2, boxY + 8);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      addText(`N°: ${invoice.invoice_number}`, boxX + 2, boxY + 15);
      addText(`Fecha: ${formatDate(invoice.created_at)}`, boxX + 2, boxY + 20);
      addText(`Vencimiento: ${formatDate(invoice.due_date)}`, boxX + 2, boxY + 25);
      addText(`Período: ${getMonthName(invoice.billing_month)} ${invoice.billing_year}`, boxX + 2, boxY + 30);

      currentY += 15;

      // Separator line
      pdf.setDrawColor(200, 200, 200);
      addLine(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // Customer Information
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      addText('INFORMACIÓN DEL CLIENTE', margin, currentY);
      currentY += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      addText(`Cliente: ${invoice.user_name || 'No disponible'}`, margin, currentY);
      currentY += 5;
      addText(`Email: ${invoice.user_email || 'No disponible'}`, margin, currentY);
      currentY += 5;
      addText(`Teléfono: ${invoice.user_phone || 'No disponible'}`, margin, currentY);
      currentY += 5;

      if (invoice.subscription_code) {
        addText(`Código de Suscripción: ${invoice.subscription_code}`, margin, currentY);
        currentY += 5;
      }

      if (invoice.child_name || invoice.service_name) {
        currentY += 3;
        pdf.setFont('helvetica', 'bold');
        addText('INFORMACIÓN DEL SERVICIO', margin, currentY);
        currentY += 6;

        pdf.setFont('helvetica', 'normal');
        if (invoice.child_name) {
          addText(`Niño/a: ${invoice.child_name}${invoice.child_age ? ` (${invoice.child_age} meses)` : ''}`, margin, currentY);
          currentY += 5;
        }
        if (invoice.service_name) {
          addText(`Servicio: ${invoice.service_name}`, margin, currentY);
          currentY += 5;
        }
      }

      currentY += 5;

      // Separator line
      addLine(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // Invoice Items Table
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      addText('DETALLE DE SERVICIOS', margin, currentY);
      currentY += 10;

      // Table header
      const colWidths = [80, 25, 35, 35]; // Description, Qty, Unit Price, Total
      const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
      const rowHeight = 8;

      // Header background
      pdf.setFillColor(240, 240, 240);
      addRect(margin, currentY, contentWidth, rowHeight, true);

      // Header borders
      pdf.setDrawColor(180, 180, 180);
      addRect(margin, currentY, contentWidth, rowHeight);

      // Header text
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      addText('Descripción', colPositions[0] + 2, currentY + 5);
      addText('Cant.', colPositions[1] + 2, currentY + 5);
      addText('P. Unit.', colPositions[2] + 2, currentY + 5);
      addText('Total', colPositions[3] + 2, currentY + 5);

      currentY += rowHeight;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      invoice.items.forEach((item, index) => {
        // Row background (alternating)
        if (index % 2 === 1) {
          pdf.setFillColor(248, 248, 248);
          addRect(margin, currentY, contentWidth, rowHeight, true);
        }

        // Row borders
        pdf.setDrawColor(220, 220, 220);
        addRect(margin, currentY, contentWidth, rowHeight);

        // Cell content
        pdf.setTextColor(0, 0, 0);

        // Description (with service name if available)
        const description = item.service_name ? `${item.description} (${item.service_name})` : item.description;
        const descriptionLines = pdf.splitTextToSize(description, colWidths[0] - 4);
        addText(descriptionLines[0], colPositions[0] + 2, currentY + 5);

        // Quantity
        addText(item.quantity.toString(), colPositions[1] + 2, currentY + 5);

        // Unit price
        addText(formatPrice(item.unit_price), colPositions[2] + 2, currentY + 5);

        // Total
        addText(formatPrice(item.total_price), colPositions[3] + 2, currentY + 5);

        currentY += rowHeight;
      });

      currentY += 5;

      // Totals section
      const totalsX = pageWidth - margin - 60;
      pdf.setFont('helvetica', 'normal');
      addText(`Subtotal: ${formatPrice(invoice.subtotal)}`, totalsX, currentY);
      currentY += 5;

      if (invoice.tax_amount > 0) {
        addText(`IGV (18%): ${formatPrice(invoice.tax_amount)}`, totalsX, currentY);
        currentY += 5;
      }

      // Total line
      addLine(totalsX - 5, currentY, pageWidth - margin, currentY);
      currentY += 3;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      addText(`TOTAL: ${formatPrice(invoice.total_amount)}`, totalsX, currentY);
      currentY += 10;

      // Payment status
      pdf.setFontSize(11);
      const statusInfo = getPaymentStatusInfo(invoice.payment_status);
      const statusColors: { [key: string]: [number, number, number] } = {
        'paid': [22, 163, 74],
        'pending': [202, 138, 4],
        'overdue': [220, 38, 38],
        'cancelled': [107, 114, 128]
      };

      const statusColor = statusColors[invoice.payment_status] || [107, 114, 128];
      pdf.setTextColor(...statusColor);
      addText(`Estado: ${statusInfo.text}`, margin, currentY);
      currentY += 8;

      // Payment information (if paid or has history)
      if (invoice.payment_status === 'paid' || (invoice.payment_history && invoice.payment_history.length > 0)) {
        currentY += 5;

        // Separator line
        addLine(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;

        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        addText('INFORMACIÓN DE PAGOS', margin, currentY);
        currentY += 10;

        if (invoice.payment_status === 'paid') {
          // Confirmed payment box
          pdf.setFillColor(240, 253, 244); // Light green background
          addRect(margin, currentY - 2, contentWidth, 25, true);
          pdf.setDrawColor(34, 197, 94); // Green border
          addRect(margin, currentY - 2, contentWidth, 25);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(22, 163, 74);
          addText('PAGO CONFIRMADO', margin + 5, currentY + 5);

          // Payment details in columns
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);

          const col1X = margin + 5;
          const col2X = margin + (contentWidth / 2);
          let detailY = currentY + 12;

          if (invoice.paid_amount) {
            addText(`Monto Pagado:`, col1X, detailY);
            pdf.setFont('helvetica', 'bold');
            addText(`${formatPrice(invoice.paid_amount)}`, col1X + 35, detailY);
            pdf.setFont('helvetica', 'normal');
          }

          if (invoice.payment_method) {
            addText(`Método:`, col2X, detailY);
            pdf.setFont('helvetica', 'bold');
            addText(`${invoice.payment_method.toUpperCase()}`, col2X + 25, detailY);
            pdf.setFont('helvetica', 'normal');
          }

          detailY += 5;

          if (invoice.paid_at) {
            addText(`Fecha de Pago:`, col1X, detailY);
            addText(`${formatDateTime(invoice.paid_at)}`, col1X + 35, detailY);
          }

          if (invoice.payment_reference) {
            addText(`Referencia:`, col2X, detailY);
            addText(`${invoice.payment_reference}`, col2X + 25, detailY);
          }

          currentY += 28;
        }

        // Payment history
        if (invoice.payment_history && invoice.payment_history.length > 0) {
          currentY += 5;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          addText('HISTORIAL DE PAGOS', margin, currentY);
          currentY += 8;

          invoice.payment_history.forEach((payment) => {
            const boxHeight = payment.admin_notes ? 20 : 15;

            // Payment status colors
            const statusColors: { [key: string]: { bg: [number, number, number], border: [number, number, number], text: [number, number, number] } } = {
              'confirmed': { bg: [240, 253, 244], border: [34, 197, 94], text: [22, 163, 74] },
              'pending': { bg: [254, 249, 195], border: [251, 191, 36], text: [202, 138, 4] },
              'rejected': { bg: [254, 242, 242], border: [239, 68, 68], text: [220, 38, 38] }
            };

            const colors = statusColors[payment.status] || { bg: [249, 250, 251], border: [156, 163, 175], text: [107, 114, 128] };

            // Payment box background
            pdf.setFillColor(...colors.bg);
            addRect(margin, currentY, contentWidth, boxHeight, true);
            pdf.setDrawColor(...colors.border);
            addRect(margin, currentY, contentWidth, boxHeight);

            // Status indicator
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(...colors.text);
            const statusText = payment.status === 'confirmed' ? 'CONFIRMADO' :
                              payment.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE';
            addText(statusText, margin + 3, currentY + 6);

            // Payment details in columns
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);

            const col1X = margin + 35;
            const col2X = margin + (contentWidth * 0.4);
            const col3X = margin + (contentWidth * 0.7);

            // Column 1: Amount and Method
            addText(`Monto: ${formatPrice(payment.amount)}`, col1X, currentY + 6);
            addText(`Método: ${payment.payment_method.toUpperCase()}`, col1X, currentY + 10);

            // Column 2: Reference and Date
            addText(`Ref: ${payment.payment_reference}`, col2X, currentY + 6);
            addText(`Fecha: ${formatDateTime(payment.created_at)}`, col2X, currentY + 10);

            // Column 3: Confirmed info (if applicable)
            if (payment.confirmed_at) {
              addText(`Procesado: ${formatDateTime(payment.confirmed_at)}`, col3X, currentY + 6);
              if (payment.confirmed_by_name) {
                addText(`Por: ${payment.confirmed_by_name}`, col3X, currentY + 10);
              }
            }

            // Admin notes (if any)
            if (payment.admin_notes) {
              pdf.setFont('helvetica', 'italic');
              addText(`Notas: ${payment.admin_notes}`, margin + 3, currentY + 16);
            }

            currentY += boxHeight + 3;
          });
        }
      }

      // Footer
      currentY = pageHeight - 25;
      addLine(margin, currentY, pageWidth - margin, currentY);
      currentY += 5;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      addText('Gracias por confiar en DULMAR - Centro de Estimulación Temprana', margin, currentY);
      currentY += 4;
      addText(`Generado el ${formatDateTime(invoice.created_at)}`, margin, currentY);

      // Generate filename and handle PDF output
      const filename = `Recibo_${invoice.invoice_number}_DULMAR.pdf`;

      if (openInNewTab) {
        // Open PDF in new tab for printing
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(pdfUrl, '_blank');
        if (newWindow) {
          newWindow.onload = () => {
            newWindow.print();
          };
        }
      } else {
        // Download PDF
        pdf.save(filename);
      }

      // Reset button text
      if (originalButton) {
        originalButton.textContent = 'Descargar PDF';
        originalButton.style.opacity = '1';
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');

      // Reset button text
      const originalButton = document.querySelector('[data-pdf-button]') as HTMLElement;
      if (originalButton) {
        originalButton.textContent = 'Descargar PDF';
        originalButton.style.opacity = '1';
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard/pagos"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Pagos
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Receipt className="h-20 w-20 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recibo no encontrado</h1>
          <p className="text-gray-600 mb-6">El recibo solicitado no existe o no tienes acceso a él.</p>
          <Link
            href="/dashboard/pagos"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Pagos
          </Link>
        </div>
      </div>
    );
  }

  const paymentStatusInfo = getPaymentStatusInfo(invoice.payment_status);
  const StatusIcon = paymentStatusInfo.icon;
  const overdueStatus = isOverdue(invoice.due_date, invoice.payment_status);

  return (
    <>
      {/* CSS Styles for PDF generation */}
      <style jsx global>{`
        #invoice-content {
          font-family: system-ui, -apple-system, sans-serif !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          color: #000 !important;
        }

        #invoice-content h1,
        #invoice-content h2,
        #invoice-content h3 {
          color: #000 !important;
          font-weight: bold !important;
        }

        #invoice-content table {
          border-collapse: collapse !important;
          width: 100% !important;
        }

        #invoice-content th,
        #invoice-content td {
          border: 1px solid #333 !important;
          padding: 8px !important;
        }

        #invoice-content .text-green-600 {
          color: #16a34a !important;
        }

        #invoice-content .text-red-600 {
          color: #dc2626 !important;
        }

        #invoice-content .text-yellow-600 {
          color: #ca8a04 !important;
        }

        #invoice-content .bg-gray-50 {
          background-color: #f9fafb !important;
        }

        #invoice-content .bg-green-50 {
          background-color: #f0fdf4 !important;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard/pagos"
                className="flex items-center text-gray-600 hover:text-blue-600 mr-6 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver a Pagos
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalle del Recibo</h1>
                <p className="text-sm text-gray-600"># {invoice.invoice_number}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => generatePDF()}
                data-pdf-button
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </button>

              <button
                onClick={() => generatePDF(true)}
                className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                title="Abrir PDF para imprimir"
              >
                <FileText className="h-4 w-4 mr-2" />
                Imprimir
              </button>

              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${paymentStatusInfo.color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {paymentStatusInfo.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="invoice-content" className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Invoice Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🏰</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">DULMAR</h2>
                    <p className="text-sm text-gray-600">Centro de Estimulación Temprana</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>RUC: 12345678901</p>
                  <p>Dirección: Av. Principal 123, Lima, Perú</p>
                  <p>Teléfono: (01) 234-5678</p>
                  <p>Email: info@dulmar.com</p>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-gray-50 rounded-lg p-4 min-w-[250px]">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {getInvoiceTypeText(invoice.invoice_type)}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número:</span>
                      <span className="font-mono text-gray-900">{invoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="text-gray-900">{formatDate(invoice.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vencimiento:</span>
                      <span className={`font-medium ${overdueStatus ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(invoice.due_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Período:</span>
                      <span className="text-gray-900">
                        {getMonthName(invoice.billing_month)} {invoice.billing_year}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium text-gray-900">{invoice.user_name || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{invoice.user_email || 'No disponible'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium text-gray-900">{invoice.user_phone || 'No disponible'}</p>
                  </div>
                </div>
                {invoice.subscription_code && (
                  <div className="flex items-center">
                    <Receipt className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Código de Suscripción</p>
                      <p className="font-mono text-gray-900">{invoice.subscription_code}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(invoice.child_name || invoice.service_name) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Información del Servicio</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoice.child_name && (
                    <div>
                      <p className="text-sm text-gray-600">Niño/a</p>
                      <p className="font-medium text-gray-900">
                        {invoice.child_name}
                        {invoice.child_age && <span className="text-gray-600"> ({invoice.child_age} meses)</span>}
                      </p>
                    </div>
                  )}
                  {invoice.service_name && (
                    <div>
                      <p className="text-sm text-gray-600">Servicio</p>
                      <p className="font-medium text-gray-900">{invoice.service_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Servicios</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.description}</div>
                          {item.service_name && (
                            <div className="text-sm text-gray-500">{item.service_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900">
                        {formatPrice(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">
                        {formatPrice(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">{formatPrice(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IGV (18%):</span>
                      <span className="text-gray-900">{formatPrice(invoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-xl text-gray-900">{formatPrice(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {(invoice.payment_status === 'paid' || (invoice.payment_history && invoice.payment_history.length > 0)) && (
            <div className="px-6 py-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Pagos</h3>

              {invoice.payment_status === 'paid' && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">Pago Confirmado</p>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {invoice.paid_amount && (
                          <div>
                            <span className="text-green-700">Monto Pagado:</span>
                            <span className="font-medium text-green-900 ml-1">
                              {formatPrice(invoice.paid_amount)}
                            </span>
                          </div>
                        )}
                        {invoice.paid_at && (
                          <div>
                            <span className="text-green-700">Fecha de Pago:</span>
                            <span className="font-medium text-green-900 ml-1">
                              {formatDateTime(invoice.paid_at)}
                            </span>
                          </div>
                        )}
                        {invoice.payment_method && (
                          <div>
                            <span className="text-green-700">Método:</span>
                            <span className="font-medium text-green-900 ml-1 uppercase">
                              {invoice.payment_method}
                            </span>
                          </div>
                        )}
                      </div>
                      {invoice.payment_reference && (
                        <div className="mt-2 text-sm">
                          <span className="text-green-700">Referencia:</span>
                          <span className="font-mono text-green-900 ml-1">
                            {invoice.payment_reference}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {invoice.payment_history && invoice.payment_history.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Historial de Pagos</h4>
                  <div className="space-y-3">
                    {invoice.payment_history.map((payment) => (
                      <div
                        key={payment.id}
                        className={`border rounded-lg p-4 ${
                          payment.status === 'confirmed'
                            ? 'border-green-200 bg-green-50'
                            : payment.status === 'rejected'
                            ? 'border-red-200 bg-red-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              {payment.status === 'confirmed' && (
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              )}
                              {payment.status === 'rejected' && (
                                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              {payment.status === 'pending' && (
                                <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                              )}
                              <span className="font-medium">
                                {payment.status === 'confirmed' && 'Pago Confirmado'}
                                {payment.status === 'rejected' && 'Pago Rechazado'}
                                {payment.status === 'pending' && 'Pago Pendiente'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">Método:</span>
                                <span className="font-medium ml-1 uppercase">
                                  {payment.payment_method}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Referencia:</span>
                                <span className="font-mono ml-1">{payment.payment_reference}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Monto:</span>
                                <span className="font-medium ml-1">{formatPrice(payment.amount)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Fecha:</span>
                                <span className="ml-1">{formatDateTime(payment.created_at)}</span>
                              </div>
                            </div>

                            {payment.confirmed_at && (
                              <div className="mt-2 text-sm">
                                <span className="text-gray-600">
                                  {payment.status === 'confirmed' ? 'Confirmado' : 'Procesado'} el:
                                </span>
                                <span className="ml-1">{formatDateTime(payment.confirmed_at)}</span>
                                {payment.confirmed_by_name && (
                                  <span className="ml-2 text-gray-600">
                                    por {payment.confirmed_by_name}
                                  </span>
                                )}
                              </div>
                            )}

                            {payment.admin_notes && (
                              <div className="mt-2 text-sm">
                                <span className="text-gray-600">Notas:</span>
                                <p className="text-gray-900 mt-1">{payment.admin_notes}</p>
                              </div>
                            )}
                          </div>

                          {payment.file_path && (
                            <div className="ml-4">
                              <button
                                onClick={() => window.open(`/api${payment.file_path}`, '_blank')}
                                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                title="Ver comprobante"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Gracias por confiar en DULMAR</p>
                <p>Centro de Estimulación Temprana</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Generado el {formatDateTime(invoice.created_at)}</p>
                {invoice.updated_at !== invoice.created_at && (
                  <p>Actualizado el {formatDateTime(invoice.updated_at)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/dashboard/pagos"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Volver a Pagos
          </Link>

          {invoice.payment_status === 'pending' && (
            <Link
              href={`/dashboard/pagos?invoice=${invoice.id}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Pagar Ahora
            </Link>
          )}
        </div>
      </div>
    </div>
    </>
  );
}