import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email y código son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario con el código de verificación
    const stmt = db.prepare(`
      SELECT id, verification_code, verification_expires
      FROM users
      WHERE email = ? AND email_verified = 0
    `);
    const user = stmt.get(email) as { id: number; verification_code: string; verification_expires: string } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o ya verificado' },
        { status: 404 }
      );
    }

    // Verificar si el código ha expirado
    const now = new Date();
    const expires = new Date(user.verification_expires);
    
    if (now > expires) {
      return NextResponse.json(
        { error: 'El código de verificación ha expirado' },
        { status: 400 }
      );
    }

    // Verificar el código
    if (user.verification_code !== code) {
      return NextResponse.json(
        { error: 'Código de verificación inválido' },
        { status: 400 }
      );
    }

    // Marcar email como verificado
    const updateStmt = db.prepare(`
      UPDATE users 
      SET email_verified = 1, verification_code = NULL, verification_expires = NULL 
      WHERE id = ?
    `);
    updateStmt.run(user.id);

    return NextResponse.json({
      message: 'Email verificado exitosamente'
    });

  } catch (error) {
    console.error('Error en verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario no verificado
    const stmt = db.prepare(`
      SELECT id, first_name
      FROM users
      WHERE email = ? AND email_verified = 0
    `);
    const user = stmt.get(email) as { id: number; first_name: string } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o ya verificado' },
        { status: 404 }
      );
    }

    // Generar nuevo código
    const { generateVerificationCode } = await import('@/lib/email');
    const { sendVerificationEmail } = await import('@/lib/email');
    
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Actualizar código en base de datos
    const updateStmt = db.prepare(`
      UPDATE users 
      SET verification_code = ?, verification_expires = ? 
      WHERE id = ?
    `);
    updateStmt.run(verificationCode, verificationExpires.toISOString(), user.id);

    // Enviar nuevo email
    const emailResult = await sendVerificationEmail(email, verificationCode, user.first_name);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Error enviando el email de verificación' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Nuevo código de verificación enviado'
    });

  } catch (error) {
    console.error('Error reenviando código:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}