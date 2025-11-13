import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { sendEmail } from '@/lib/email';

// Generar código aleatorio de 6 dígitos
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const user = db.prepare(`
      SELECT id, email, first_name, last_name FROM users WHERE email = ?
    `).get(email) as { id: number; email: string; first_name: string; last_name: string } | undefined;

    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return NextResponse.json({
        message: 'Si el correo existe en nuestro sistema, recibirás un código de recuperación.'
      });
    }

    // Generar código de 6 dígitos
    const code = generateCode();

    // El código expira en 30 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Invalidar códigos anteriores no usados del mismo usuario
    db.prepare(`
      UPDATE password_reset_codes
      SET is_used = 1
      WHERE user_id = ? AND is_used = 0
    `).run(user.id);

    // Guardar el nuevo código en la base de datos
    db.prepare(`
      INSERT INTO password_reset_codes (user_id, email, code, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(user.id, email, code, expiresAt.toISOString());

    // Enviar email con el código
    const emailSent = await sendEmail({
      to: email,
      subject: 'Código de Recuperación de Contraseña - DULMAR',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .code-box {
              background: white;
              border: 2px solid #667eea;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 5px;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.first_name} ${user.last_name}</strong>,</p>

              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en DULMAR - Centro de Estimulación Temprana.</p>

              <p>Tu código de verificación es:</p>

              <div class="code-box">
                <div class="code">${code}</div>
                <p style="color: #6b7280; margin-top: 10px; font-size: 14px;">
                  Este código expira en 30 minutos
                </p>
              </div>

              <p>Ingresa este código en la página de recuperación de contraseña para continuar.</p>

              <div class="warning">
                <strong>⚠️ Importante:</strong> Si no solicitaste restablecer tu contraseña, ignora este correo. Tu cuenta permanecerá segura.
              </div>

              <p>Por tu seguridad:</p>
              <ul>
                <li>No compartas este código con nadie</li>
                <li>El código solo se puede usar una vez</li>
                <li>Caduca automáticamente en 30 minutos</li>
              </ul>
            </div>
            <div class="footer">
              <p>
                © ${new Date().getFullYear()} DULMAR - Centro de Estimulación Temprana<br>
                <a href="${process.env.NEXTAUTH_URL}" style="color: #667eea;">www.dulmar.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Error al enviar el correo electrónico' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Si el correo existe en nuestro sistema, recibirás un código de recuperación.'
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
