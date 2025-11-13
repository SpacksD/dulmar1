import jsPDF from 'jspdf';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_name?: string;
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

export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
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

  const getPaymentStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return { text: 'Pagado' };
      case 'pending':
        return { text: 'Pendiente' };
      case 'overdue':
        return { text: 'Vencido' };
      case 'cancelled':
        return { text: 'Cancelado' };
      default:
        return { text: status };
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

  // Footer
  currentY = pageHeight - 25;
  addLine(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  addText('Gracias por confiar en DULMAR - Centro de Estimulación Temprana', margin, currentY);
  currentY += 4;
  addText(`Generado el ${formatDateTime(invoice.created_at)}`, margin, currentY);

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  return pdfBuffer;
}