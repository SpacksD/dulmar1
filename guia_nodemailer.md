# 📧 GUÍA COMPLETA: IMPLEMENTACIÓN DE NODEMAILER

> Documentación completa de la implementación de Nodemailer en Centro Infantil DULMAR
>
> Fecha: Noviembre 2025
> Versión: 1.0

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Dependencias](#dependencias)
4. [Configuración Principal](#configuración-principal)
5. [Variables de Entorno](#variables-de-entorno)
6. [Cómo Obtener Credenciales de Google](#cómo-obtener-credenciales-de-google)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Integración en Nuevo Proyecto](#integración-en-nuevo-proyecto)
9. [Troubleshooting](#troubleshooting)
10. [Endpoints que Envían Emails](#endpoints-que-envían-emails)
11. [Servicios Profesionales](#servicios-profesionales-para-producción)
12. [Resumen de Pasos](#resumen-de-pasos-para-replicar)

---

## 📊 RESUMEN EJECUTIVO

Este proyecto tiene una implementación completa de Nodemailer con las siguientes características:

✅ **4 tipos de emails diferentes:**
- Código de verificación (registro de usuarios)
- Confirmación de suscripción
- Recibos/facturas con PDF adjunto
- Itinerarios de citas programadas

✅ **Templates HTML profesionales** con diseño responsive

✅ **Adjuntos PDF** para facturas y recibos

✅ **Configuración actual**: Gmail SMTP (`develop.spacks@gmail.com`)

✅ **Manejo de errores** robusto con logs

---

## 🗂️ ESTRUCTURA DE ARCHIVOS

```
dulmar/
├── .env.local                              # ⚙️ Configuración de desarrollo
├── .env.example                            # 📝 Template para producción
├── package.json                            # 📦 Dependencias
├── guia_nodemailer.md                      # 📖 Esta guía
│
├── src/
│   ├── lib/
│   │   ├── email.ts                       # ⭐ ARCHIVO PRINCIPAL
│   │   │                                   # Contiene: transporter, sendEmail(),
│   │   │                                   # sendVerificationEmail(), sendInvoiceEmail()
│   │   │
│   │   └── email-confirmation.ts          # 📧 Templates de confirmación
│   │                                       # Contiene: sendSubscriptionConfirmation(),
│   │                                       # sendAppointmentConfirmation()
│   │
│   └── app/api/
│       ├── auth/
│       │   └── register/route.ts          # 🔐 Envía código de verificación
│       │
│       ├── subscriptions/route.ts         # 📝 Envía confirmación + recibo
│       │
│       ├── sessions/route.ts              # 📅 Envía itinerario de citas
│       │
│       └── invoices/
│           └── generate-monthly/route.ts  # 💰 Facturación mensual automática
```

---

## 📦 DEPENDENCIAS

### package.json

```json
{
  "dependencies": {
    "nodemailer": "^6.10.1"
  },
  "devDependencies": {
    "@types/nodemailer": "^7.0.1"
  }
}
```

### Instalación

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

**Versión actual:** `nodemailer 6.10.1`

---

## ⚙️ CONFIGURACIÓN PRINCIPAL

### Archivo: `src/lib/email.ts`

Este es el archivo central de toda la configuración de Nodemailer.

```typescript
import nodemailer from 'nodemailer';

// ============================================
// CONFIGURACIÓN DEL TRANSPORTER
// ============================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,           // smtp.gmail.com
  port: Number(process.env.SMTP_PORT),   // 587
  secure: false,                         // false para TLS (puerto 587)
                                         // true para SSL (puerto 465)
  auth: {
    user: process.env.SMTP_USER,         // tu-email@gmail.com
    pass: process.env.SMTP_PASS,         // contraseña de aplicación (16 chars)
  },
});

// ============================================
// FUNCIÓN GENÉRICA PARA ENVIAR EMAILS
// ============================================

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Centro Infantil DULMAR" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [],
    });

    console.log('✅ Email enviado exitosamente a:', options.to);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
}

// ============================================
// FUNCIONES ESPECÍFICAS
// ============================================

// 1. Generar código de verificación de 6 dígitos
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 2. Enviar email de verificación (Registro)
export async function sendVerificationEmail(
  email: string,
  code: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verificación de Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0"
                   style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                           padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">
                    ¡Bienvenido/a ${firstName}!
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                    Gracias por registrarte en Centro Infantil DULMAR. Para completar tu registro,
                    por favor verifica tu correo electrónico usando el siguiente código:
                  </p>

                  <!-- Código de Verificación -->
                  <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px;
                              padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;
                              text-transform: uppercase; letter-spacing: 1px;">
                      Tu Código de Verificación
                    </p>
                    <p style="color: #667eea; font-size: 36px; font-weight: bold; margin: 0;
                              letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${code}
                    </p>
                  </div>

                  <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                    Este código expirará en <strong>10 minutos</strong>.
                    Si no solicitaste este código, puedes ignorar este mensaje.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center;
                           border-radius: 0 0 8px 8px;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Centro Infantil DULMAR. Todos los derechos reservados.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const sent = await sendEmail({
      to: email,
      subject: 'Verifica tu correo electrónico - DULMAR',
      html,
    });

    return sent
      ? { success: true }
      : { success: false, error: 'Error al enviar el email' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// 3. Enviar email de recibo/factura con PDF adjunto
export async function sendInvoiceEmail(
  email: string,
  firstName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  pdfBuffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recibo ${invoiceNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background-color: #ffffff; border-radius: 8px;">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                           padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0;">Recibo #${invoiceNumber}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                    Hola ${firstName},
                  </p>
                  <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                    Te enviamos tu recibo de pago. A continuación los detalles:
                  </p>

                  <!-- Detalles del Recibo -->
                  <table width="100%" cellpadding="10"
                         style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                    <tr>
                      <td style="color: #666666; font-size: 14px;">Número de Recibo:</td>
                      <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">
                        ${invoiceNumber}
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #666666; font-size: 14px;">Monto:</td>
                      <td style="color: #667eea; font-size: 18px; font-weight: bold; text-align: right;">
                        ${amount}
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #666666; font-size: 14px;">Fecha de Vencimiento:</td>
                      <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">
                        ${dueDate}
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 14px; color: #666666; margin: 20px 0;">
                    El recibo completo está adjunto en formato PDF. Puedes ver todos tus recibos
                    en tu panel de control.
                  </p>

                  <!-- Botón -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}/dashboard/recibos"
                       style="background-color: #667eea; color: #ffffff; padding: 12px 30px;
                              text-decoration: none; border-radius: 6px; display: inline-block;
                              font-size: 16px;">
                      Ver Mis Recibos
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center;
                           border-radius: 0 0 8px 8px;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                    ¿Tienes alguna pregunta? Contáctanos
                  </p>
                  <p style="color: #667eea; font-size: 14px; margin: 0;">
                    info@centrodulmar.com | +51 123 456 789
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const sent = await sendEmail({
      to: email,
      subject: `Recibo #${invoiceNumber} - DULMAR`,
      html,
      attachments: [
        {
          filename: `Recibo_${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return sent
      ? { success: true }
      : { success: false, error: 'Error al enviar el email' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
```

---

## 🔐 VARIABLES DE ENTORNO

### Archivo: `.env.local` (Desarrollo)

```env
# ============================================
# EMAIL CONFIGURATION
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=develop.spacks@gmail.com
SMTP_PASS=qlkabhzaeaskgshj

# ============================================
# NEXTAUTH (para links en emails)
# ============================================
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=tu-secret-key-muy-segura-aqui
```

### Archivo: `.env` (Producción)

```env
# ============================================
# EMAIL CONFIGURATION
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@centrodulmar.com
SMTP_PASS=tu-contraseña-de-aplicacion-16-chars

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_URL=https://www.centrodulmar.com
NEXTAUTH_SECRET=tu-secret-key-de-produccion
```

### ⚠️ NOTA IMPORTANTE

El archivo `.env.example` usa nombres diferentes (`EMAIL_*`), pero el código usa `SMTP_*`. **Debes usar los nombres `SMTP_*`** para que funcione correctamente:

- ✅ `SMTP_HOST` (correcto)
- ❌ `EMAIL_HOST` (no funcionará)

---

## 🔑 CÓMO OBTENER CREDENCIALES DE GOOGLE

### Paso 1: Activar Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com
2. Click en **"Seguridad"** en el menú lateral
3. Busca la sección **"Cómo inicias sesión en Google"**
4. Click en **"Verificación en dos pasos"**
5. Click en **"Empezar"**
6. Sigue los pasos (necesitarás tu teléfono móvil)
7. Completa la configuración

### Paso 2: Generar Contraseña de Aplicación

1. Una vez activada la verificación en 2 pasos, regresa a **"Seguridad"**
2. En la sección **"Cómo inicias sesión en Google"**, busca **"Contraseñas de aplicaciones"**
3. Click en **"Contraseñas de aplicaciones"**
4. Puede pedirte que inicies sesión de nuevo (es normal)
5. En **"Seleccionar app"**: Elige **"Correo"**
6. En **"Seleccionar dispositivo"**: Elige **"Otro (nombre personalizado)"**
7. Escribe un nombre descriptivo: **"Nodemailer DULMAR"**
8. Click en **"Generar"**
9. Google te mostrará una contraseña de **16 caracteres** (sin espacios)
10. **¡COPIA ESTA CONTRASEÑA INMEDIATAMENTE!** - No la volverás a ver

### Ejemplo de Contraseña Generada

Google mostrará algo como:
```
abcd efgh ijkl mnop
```

**Úsala en .env SIN espacios:**
```env
SMTP_PASS=abcdefghijklmnop
```

### ⚠️ IMPORTANTE

- ❌ NO uses tu contraseña normal de Gmail
- ✅ USA la contraseña de aplicación (16 caracteres)
- 🔒 NO compartas esta contraseña con nadie
- 🔄 Si la pierdes, genera una nueva (la anterior dejará de funcionar)

---

## 💻 EJEMPLOS DE USO

### Ejemplo 1: Enviar Email de Verificación

```typescript
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';

// En tu route de registro (/api/auth/register)
export async function POST(request: NextRequest) {
  const { email, firstName } = await request.json();

  // Generar código de 6 dígitos
  const verificationCode = generateVerificationCode(); // "123456"

  // Guardar código en la base de datos
  // ... tu lógica aquí ...

  // Enviar email con el código
  const result = await sendVerificationEmail(
    email,
    verificationCode,
    firstName
  );

  if (result.success) {
    console.log('✅ Email de verificación enviado');
    return NextResponse.json({
      success: true,
      message: 'Código enviado a tu email'
    });
  } else {
    console.error('❌ Error:', result.error);
    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 500 });
  }
}
```

### Ejemplo 2: Enviar Recibo con PDF

```typescript
import { sendInvoiceEmail } from '@/lib/email';
import { generateInvoicePDF } from '@/lib/pdf-generator';

// En tu route de creación de recibos
export async function POST(request: NextRequest) {
  const invoiceData = await request.json();

  // Generar PDF del recibo
  const pdfBuffer = await generateInvoicePDF(invoiceData);

  // Formatear monto y fecha
  const formattedAmount = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(invoiceData.total);

  const formattedDueDate = new Date(invoiceData.dueDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Enviar email con PDF adjunto
  const result = await sendInvoiceEmail(
    invoiceData.parentEmail,     // 'padre@example.com'
    invoiceData.parentFirstName, // 'María'
    invoiceData.invoiceNumber,   // 'INV123456'
    formattedAmount,             // 'S/ 150.00'
    formattedDueDate,            // '15 de marzo de 2025'
    pdfBuffer                    // Buffer del PDF
  );

  if (result.success) {
    console.log('✅ Recibo enviado con PDF adjunto');
    return NextResponse.json({
      success: true,
      message: 'Recibo enviado por email'
    });
  } else {
    console.error('❌ Error enviando recibo:', result.error);
    // No fallar la operación por error de email
    return NextResponse.json({
      success: true,
      warning: 'Recibo creado pero no se pudo enviar email'
    });
  }
}
```

### Ejemplo 3: Enviar Email Genérico

```typescript
import { sendEmail } from '@/lib/email';

// Enviar cualquier tipo de email personalizado
const sent = await sendEmail({
  to: 'destino@example.com',
  subject: '¡Bienvenido a DULMAR!',
  html: `
    <h1>¡Hola!</h1>
    <p>Este es un email de prueba con HTML.</p>
    <p style="color: blue;">Puedes usar estilos inline.</p>
  `,
  attachments: [
    {
      filename: 'documento.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    },
    {
      filename: 'imagen.png',
      content: imageBuffer,
      contentType: 'image/png'
    }
  ]
});

if (sent) {
  console.log('✅ Email enviado correctamente');
} else {
  console.error('❌ Error enviando email');
}
```

---

## 🚀 INTEGRACIÓN EN NUEVO PROYECTO

### Paso 1: Instalar Dependencias

```bash
cd tu-proyecto
npm install nodemailer
npm install -D @types/nodemailer
```

### Paso 2: Copiar Archivo de Configuración

Copia el archivo `src/lib/email.ts` a tu nuevo proyecto:

```bash
# Desde el proyecto DULMAR
cp src/lib/email.ts ../tu-proyecto/src/lib/email.ts
```

O crea el archivo manualmente con el código mostrado en [Configuración Principal](#configuración-principal).

### Paso 3: Configurar Variables de Entorno

Crea o edita tu archivo `.env.local`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-app-16-chars

# NextAuth (si usas NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key
```

### Paso 4: Obtener Credenciales de Google

Sigue los pasos en [Cómo Obtener Credenciales de Google](#cómo-obtener-credenciales-de-google).

### Paso 5: Probar el Envío

Crea un archivo de prueba `test-email.ts`:

```typescript
import { sendEmail } from '@/lib/email';

async function testEmail() {
  console.log('🧪 Probando envío de email...');

  const sent = await sendEmail({
    to: 'tu-email@gmail.com',
    subject: 'Test de Nodemailer',
    html: '<h1>¡Funciona!</h1><p>Si recibes este email, la configuración es correcta.</p>'
  });

  if (sent) {
    console.log('✅ Email enviado correctamente');
  } else {
    console.error('❌ Error enviando email');
  }
}

testEmail();
```

Ejecuta:
```bash
npx tsx test-email.ts
```

### Paso 6: Usar en tus Rutas API

```typescript
// app/api/tu-ruta/route.ts
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { email, name } = await request.json();

  const code = generateVerificationCode();
  const result = await sendVerificationEmail(email, code, name);

  if (result.success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
```

---

## 🐛 TROUBLESHOOTING

### Error: "Invalid login"

```
❌ Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Causas comunes:**
- No has activado la verificación en 2 pasos
- Estás usando tu contraseña normal en lugar de la contraseña de aplicación
- La contraseña de aplicación está mal copiada (con espacios)

**Solución:**
1. ✅ Activa la verificación en 2 pasos en tu cuenta de Google
2. ✅ Genera una nueva contraseña de aplicación
3. ✅ Cópiala SIN espacios en tu `.env.local`
4. ✅ Reinicia tu servidor de desarrollo

### Error: "Connection timeout"

```
❌ Error: Connection timeout
```

**Causas comunes:**
- Puerto incorrecto
- Firewall bloqueando la conexión
- Configuración `secure` incorrecta

**Solución:**
```env
SMTP_PORT=587              # Puerto correcto para TLS
```

```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,           // false para puerto 587 (TLS)
  // secure: true,         // true solo para puerto 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

### Emails no llegan a la bandeja de entrada

**Solución:**
1. 🔍 Revisa la carpeta de **SPAM/Correo no deseado**
2. ⏰ Espera unos minutos (puede tardar 1-5 minutos)
3. ✉️ Verifica que el email remitente sea válido
4. 📧 Prueba enviando a otro proveedor (Gmail, Outlook, etc.)
5. 🔒 Para producción, considera usar un servicio profesional

### Error: "Daily sending quota exceeded"

```
❌ Error: 550 Daily sending quota exceeded
```

**Causa:**
Gmail limita a **500 emails por día** para cuentas gratuitas.

**Solución:**
- Para desarrollo: Espera 24 horas o usa otra cuenta
- Para producción: Usa un servicio profesional (SendGrid, AWS SES, Mailgun)

### Emails se envían pero con errores en HTML

**Solución:**
- Usa estilos **inline** en lugar de CSS externo
- Usa **tablas** para el layout (más compatibilidad)
- Evita JavaScript y CSS avanzado
- Prueba en múltiples clientes de email

---

## 📊 ENDPOINTS QUE ENVÍAN EMAILS

| Endpoint | Función de Email | Tipo de Email | Adjuntos |
|----------|------------------|---------------|----------|
| `POST /api/auth/register` | `sendVerificationEmail()` | Código de verificación (6 dígitos) | ❌ No |
| `POST /api/subscriptions` | `sendSubscriptionConfirmation()`<br>`sendInvoiceEmail()` | Confirmación de suscripción<br>Recibo inicial | ❌ No<br>✅ PDF |
| `POST /api/sessions` | `sendAppointmentConfirmation()` | Itinerario de citas programadas | ❌ No |
| `POST /api/invoices/generate-monthly` | `sendInvoiceEmail()` | Recibo mensual (batch) | ✅ PDF |

### Flujo Completo: Registro de Usuario

```
1. Usuario llena formulario de registro
   ↓
2. POST /api/auth/register
   ↓
3. Se validan datos
   ↓
4. Se crea usuario en BD (con verification_code)
   ↓
5. Se genera código de 6 dígitos
   ↓
6. Se envía email con código (sendVerificationEmail)
   ↓
7. Si falla el email, se elimina el usuario
   ↓
8. Usuario recibe email y verifica código
```

### Flujo Completo: Creación de Suscripción

```
1. Padre crea suscripción (datos del niño)
   ↓
2. POST /api/subscriptions
   ↓
3. Se valida servicio y capacidad
   ↓
4. Se calcula precio (con descuentos si aplica)
   ↓
5. Se crea suscripción en BD
   ↓
6. Se genera recibo automáticamente
   ↓
7. Se genera PDF del recibo
   ↓
8. Se envían 2 emails:
   a) Confirmación de suscripción (sendSubscriptionConfirmation)
   b) Recibo con PDF adjunto (sendInvoiceEmail)
```

---

## 🌐 SERVICIOS PROFESIONALES (PARA PRODUCCIÓN)

### ¿Por qué usar un servicio profesional?

Gmail es excelente para desarrollo, pero tiene limitaciones:
- ❌ Límite de 500 emails/día
- ❌ Puede ser bloqueado como spam
- ❌ No tiene analytics avanzado
- ❌ No tiene templates profesionales

### 1. SendGrid

**Características:**
- ✅ 100 emails/día gratis (40,000/mes en plan pagado desde $19.95/mes)
- ✅ 99% deliverability
- ✅ Analytics avanzado
- ✅ Templates drag & drop
- ✅ Validación de emails

**Configuración:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-api-key-de-sendgrid
```

**Registro:** https://sendgrid.com

### 2. AWS SES (Amazon Simple Email Service)

**Características:**
- ✅ $0.10 por cada 1,000 emails
- ✅ Muy económico para alto volumen
- ✅ Altamente escalable
- ✅ Integración con AWS

**Configuración:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=tu-access-key-id
SMTP_PASS=tu-secret-access-key
```

**Registro:** https://aws.amazon.com/ses/

### 3. Mailgun

**Características:**
- ✅ 5,000 emails/mes gratis (primer mes)
- ✅ Muy flexible
- ✅ Excelente documentación
- ✅ API muy completa

**Configuración:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu-smtp-password
```

**Registro:** https://www.mailgun.com

### 4. Resend (Moderno)

**Características:**
- ✅ 3,000 emails/mes gratis
- ✅ Diseñado para developers
- ✅ React Email support
- ✅ Muy fácil de usar

**Configuración:**
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=tu-api-key
```

**Registro:** https://resend.com

### Comparación Rápida

| Servicio | Plan Gratuito | Precio | Mejor Para |
|----------|---------------|--------|------------|
| Gmail | 500/día | Gratis | Desarrollo local |
| SendGrid | 100/día | $19.95/mes | Startups, Marketing |
| AWS SES | 62,000/mes* | $0.10/1000 | Alto volumen, Empresas |
| Mailgun | 5,000/mes** | $35/mes | APIs, Developers |
| Resend | 3,000/mes | $20/mes | Apps modernas, React |

\* Con AWS Free Tier
\** Solo primer mes

---

## ✅ RESUMEN DE PASOS PARA REPLICAR

### Checklist Rápida

- [ ] **1. Instalar dependencias**
  ```bash
  npm install nodemailer
  npm install -D @types/nodemailer
  ```

- [ ] **2. Copiar archivo de configuración**
  - Copiar `src/lib/email.ts` a tu proyecto
  - Adaptar templates HTML a tu marca

- [ ] **3. Obtener credenciales de Google**
  - Activar verificación en 2 pasos
  - Generar contraseña de aplicación (16 caracteres)

- [ ] **4. Configurar variables de entorno**
  - Crear/editar `.env.local`
  - Agregar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

- [ ] **5. Probar envío**
  - Crear script de prueba
  - Enviar email a tu cuenta
  - Verificar recepción

- [ ] **6. Integrar en rutas API**
  - Importar funciones de email
  - Agregar lógica de envío
  - Manejar errores correctamente

- [ ] **7. Testing**
  - Probar con diferentes proveedores (Gmail, Outlook, etc.)
  - Verificar bandeja de spam
  - Probar en móvil y desktop

- [ ] **8. Producción (opcional)**
  - Considerar servicio profesional (SendGrid, AWS SES)
  - Configurar dominio personalizado
  - Implementar analytics

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial

- [Nodemailer Docs](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [NextAuth.js](https://next-auth.js.org/)

### Templates de Email

- [Really Good Emails](https://reallygoodemails.com/)
- [Email on Acid Templates](https://www.emailonacid.com/blog/)
- [Litmus Community](https://litmus.com/community/templates)

### Testing de Emails

- [Mailtrap](https://mailtrap.io/) - Testing inbox
- [Litmus](https://litmus.com/) - Preview en múltiples clientes
- [Email on Acid](https://www.emailonacid.com/) - Testing avanzado

---

## 🎯 MEJORAS RECOMENDADAS

1. **Implementar cola de emails** (usando Bull o BullMQ)
   - Evita bloquear requests
   - Permite reintentos automáticos
   - Mejor manejo de errores

2. **Agregar rate limiting**
   - Prevenir abuso
   - Proteger tu cuenta de Gmail
   - Mejor UX

3. **Implementar templates con Handlebars**
   - Separar lógica de presentación
   - Reutilizar templates
   - Más fácil de mantener

4. **Logging y monitoreo**
   - Registrar todos los emails enviados
   - Guardar errores en BD
   - Implementar alertas

5. **Testing automatizado**
   - Tests unitarios para funciones de email
   - Tests de integración con Mailtrap
   - CI/CD para validar cambios

---

## 📝 NOTAS FINALES

Esta guía está basada en la implementación real del proyecto Centro Infantil DULMAR. La configuración ha sido probada y está funcionando en producción.

**Contacto del proyecto:**
- Email actual: `develop.spacks@gmail.com`
- Contraseña de app: `qlkabhzaeaskgshj`

**Versión de esta guía:** 1.0
**Última actualización:** Noviembre 2025

---

## 🤝 CONTRIBUCIONES

Si encuentras errores o mejoras para esta guía, por favor:
1. Documenta el cambio
2. Actualiza esta guía
3. Comparte con el equipo

---

**¡Listo para implementar Nodemailer en tu proyecto!** 🚀

Si tienes preguntas o necesitas ayuda adicional, consulta la documentación oficial de Nodemailer o los recursos mencionados arriba.
