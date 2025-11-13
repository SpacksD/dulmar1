import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, code: string, firstName: string) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Código de Verificación - Dulmar Estimulación Temprana',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Bienvenido/a ${firstName}!</h2>
        <p>Gracias por registrarte en Dulmar Estimulación Temprana.</p>
        <p>Para completar tu registro, por favor usa el siguiente código de verificación:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #1f2937; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expirará en 10 minutos.</p>
        <p>Si no solicitaste este registro, puedes ignorar este email.</p>
        <br>
        <p>Saludos,<br>Equipo Dulmar</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error };
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Función genérica para enviar emails
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || []
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}

export async function sendInvoiceEmail(
  email: string,
  firstName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  pdfBuffer: Buffer
) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: `Recibo #${invoiceNumber} - DULMAR Centro de Estimulación Temprana`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🏰 DULMAR</h1>
          <h2 style="color: #666; font-size: 18px; margin: 0;">Centro de Estimulación Temprana</h2>
        </div>

        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin: 0 0 15px 0;">Nuevo Recibo Generado</h3>
          <p style="margin: 5px 0;"><strong>Estimado/a ${firstName},</strong></p>
          <p style="margin: 15px 0;">Se ha generado un nuevo recibo mensual para tu suscripción en DULMAR.</p>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="color: #374151; margin-top: 0;">Detalles del Recibo:</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Número de Recibo:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">#${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Monto Total:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #059669; font-size: 18px;">${amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Fecha de Vencimiento:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #dc2626;">${dueDate}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>💡 Recordatorio:</strong> Puedes realizar el pago a través de tu panel de usuario
            o contactarnos para coordinar otros métodos de pago.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/pagos"
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Ver mis Recibos
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Adjunto encontrarás el recibo detallado en formato PDF.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <br>
          <p><strong>DULMAR - Centro de Estimulación Temprana</strong></p>
          <p>📧 info@dulmar.com | 📞 (01) 234-5678</p>
          <p>📍 Av. Principal 123, Lima, Perú</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Recibo_${invoiceNumber}_DULMAR.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error enviando recibo por email:', error);
    return { success: false, error };
  }
}