/**
 * Sistema de confirmación de itinerarios por email
 */

import { sendEmail } from './email';

interface SubscriptionData {
  id: number;
  subscription_code: string;
  child_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  sessions_per_month: number;
  preferred_days: string[];
  preferred_times: string[];
  start_month: number;
  start_year: number;
  service_name: string;
  final_monthly_price: number;
}

interface AppointmentData {
  appointment_date: string;
  start_time: string;
  end_time: string;
  day_name: string;
  child_name: string;
  service_name: string;
}

/**
 * Genera el contenido HTML para el email de confirmación de suscripción
 */
export function generateSubscriptionConfirmationHTML(subscription: SubscriptionData): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const startMonth = monthNames[subscription.start_month - 1];
  const preferredDaysText = subscription.preferred_days.join(', ');
  const preferredTimesText = subscription.preferred_times.join(', ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Suscripción - Centro Infantil DULMAR</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; }
            .info-box { background: #f8f9ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
            .schedule-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin: 15px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .highlight { color: #667eea; font-weight: bold; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 ¡Suscripción Confirmada!</h1>
                <p>Centro Infantil DULMAR</p>
            </div>

            <div class="content">
                <h2>Estimado/a ${subscription.parent_name},</h2>

                <p>Nos complace confirmar que hemos recibido tu solicitud de suscripción mensual para <strong>${subscription.child_name}</strong>. A continuación encontrarás todos los detalles de tu reserva:</p>

                <div class="info-box">
                    <h3>📋 Detalles de la Suscripción</h3>
                    <ul>
                        <li><strong>Código de suscripción:</strong> <span class="highlight">${subscription.subscription_code}</span></li>
                        <li><strong>Servicio:</strong> ${subscription.service_name}</li>
                        <li><strong>Niño/a:</strong> ${subscription.child_name}</li>
                        <li><strong>Sesiones por mes:</strong> ${subscription.sessions_per_month}</li>
                        <li><strong>Inicio:</strong> ${startMonth} ${subscription.start_year}</li>
                        <li><strong>Precio mensual:</strong> <span class="highlight">S/ ${subscription.final_monthly_price.toFixed(2)}</span></li>
                    </ul>
                </div>

                <div class="schedule-box">
                    <h3>📅 Preferencias de Horario</h3>
                    <p><strong>Días preferidos:</strong> ${preferredDaysText}</p>
                    <p><strong>Horarios preferidos:</strong> ${preferredTimesText}</p>
                    <p><em>Nota: Nuestro equipo se pondrá en contacto contigo para coordinar el horario específico de las sesiones.</em></p>
                </div>

                <div class="info-box">
                    <h3>📞 Próximos Pasos</h3>
                    <ol>
                        <li>Confirmaremos contigo los horarios específicos de las sesiones</li>
                        <li>Te enviaremos el calendario detallado con las fechas de cada sesión</li>
                        <li>Recibirás la factura mensual en los primeros días de cada mes</li>
                        <li>Podrás gestionar tus pagos desde tu dashboard en nuestra plataforma</li>
                    </ol>
                </div>

                <p>Si tienes alguna pregunta o necesitas hacer algún cambio, no dudes en contactarnos:</p>

                <ul>
                    <li>📱 WhatsApp: <a href="https://wa.me/51987654321">+51 987 654 321</a></li>
                    <li>📧 Email: info@centroinfantildulmar.com</li>
                    <li>📞 Teléfono: +51 987 654 321</li>
                </ul>

                <p>¡Esperamos comenzar esta hermosa experiencia de desarrollo y aprendizaje junto a ${subscription.child_name}!</p>

                <p>Con cariño,<br>
                <strong>Equipo del Centro Infantil DULMAR</strong></p>
            </div>

            <div class="footer">
                <p>Centro Infantil DULMAR - Brindamos seguridad, aprendizaje y salud infantil</p>
                <p>Jr. Los Tulipanes 456, San Juan de Miraflores, Lima</p>
                <p style="font-size: 12px; color: #666;">Este es un email automático, por favor no responder directamente.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Genera el contenido HTML para confirmación de citas específicas
 */
export function generateAppointmentConfirmationHTML(
  appointments: AppointmentData[],
  subscription: SubscriptionData
): string {
  const appointmentsList = appointments.map(apt => `
    <div class="appointment-item">
        <div class="appointment-date">${formatDate(apt.appointment_date)}</div>
        <div class="appointment-time">${apt.start_time} - ${apt.end_time}</div>
        <div class="appointment-day">${apt.day_name}</div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Citas - Centro Infantil DULMAR</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; }
            .appointment-item { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; padding: 15px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
            .appointment-date { font-weight: bold; color: #15803d; }
            .appointment-time { color: #059669; }
            .appointment-day { color: #374151; font-size: 14px; }
            .info-box { background: #f8f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .highlight { color: #059669; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📅 Itinerario Confirmado</h1>
                <p>Centro Infantil DULMAR</p>
            </div>

            <div class="content">
                <h2>Estimado/a ${subscription.parent_name},</h2>

                <p>Te confirmamos el itinerario de sesiones para <strong>${subscription.child_name}</strong> en el servicio de <strong>${subscription.service_name}</strong>:</p>

                <div class="info-box">
                    <h3>📅 Próximas Citas Programadas</h3>
                    ${appointmentsList}
                </div>

                <div class="info-box">
                    <h3>📝 Recordatorios Importantes</h3>
                    <ul>
                        <li>Llega 5 minutos antes de cada cita</li>
                        <li>Trae ropa cómoda para ${subscription.child_name}</li>
                        <li>Si necesitas cancelar o reprogramar, avísanos con 24 horas de anticipación</li>
                        <li>En caso de enfermedad, por favor no asistas y contacta para reprogramar</li>
                    </ul>
                </div>

                <p>Para cualquier consulta o cambio, contáctanos:</p>
                <ul>
                    <li>📱 WhatsApp: <a href="https://wa.me/51987654321">+51 987 654 321</a></li>
                    <li>📧 Email: info@centroinfantildulmar.com</li>
                </ul>

                <p>¡Esperamos ver a ${subscription.child_name} en sus sesiones!</p>

                <p>Con cariño,<br>
                <strong>Equipo del Centro Infantil DULMAR</strong></p>
            </div>

            <div class="footer">
                <p>Centro Infantil DULMAR - Brindamos seguridad, aprendizaje y salud infantil</p>
                <p>Jr. Los Tulipanes 456, San Juan de Miraflores, Lima</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Formatea una fecha para mostrar en español
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} de ${month} de ${year}`;
}

/**
 * Envía email de confirmación de suscripción
 */
export async function sendSubscriptionConfirmation(subscription: SubscriptionData): Promise<{success: boolean, error?: string}> {
  try {
    const htmlContent = generateSubscriptionConfirmationHTML(subscription);

    console.log('📧 Enviando confirmación de suscripción a:', subscription.parent_email);

    // Usar el servicio de email real
    const emailSent = await sendEmail({
      to: subscription.parent_email,
      subject: `Confirmación de Suscripción #${subscription.subscription_code} - DULMAR`,
      html: htmlContent
    });

    if (!emailSent) {
      throw new Error('No se pudo enviar el email');
    }

    console.log('✅ Confirmación de suscripción enviada exitosamente');
    return { success: true };

  } catch (error) {
    console.error('Error enviando confirmación de suscripción:', error);
    return { success: false, error: 'Error al enviar email de confirmación' };
  }
}

/**
 * Envía email de confirmación de itinerario
 */
export async function sendAppointmentConfirmation(
  appointments: AppointmentData[],
  subscription: SubscriptionData
): Promise<{success: boolean, error?: string}> {
  try {
    const htmlContent = generateAppointmentConfirmationHTML(appointments, subscription);

    console.log('📧 Enviando confirmación de itinerario a:', subscription.parent_email);
    console.log('Número de citas:', appointments.length);

    // Usar el servicio de email real
    const emailSent = await sendEmail({
      to: subscription.parent_email,
      subject: `Itinerario de ${subscription.service_name} - ${subscription.child_name} - DULMAR`,
      html: htmlContent
    });

    if (!emailSent) {
      throw new Error('No se pudo enviar el email');
    }

    console.log('✅ Confirmación de itinerario enviada exitosamente');
    return { success: true };

  } catch (error) {
    console.error('Error enviando confirmación de itinerario:', error);
    return { success: false, error: 'Error al enviar email de confirmación' };
  }
}