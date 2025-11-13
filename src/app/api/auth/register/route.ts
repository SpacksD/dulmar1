import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/database';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';
import { validateEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json();

    // Validaciones
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios son requeridos' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe con este email' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Generar código de verificación
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Insertar usuario
    const stmt = db.prepare(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, 
        verification_code, verification_expires, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'parent')
    `);

    const result = stmt.run(
      email, 
      passwordHash, 
      firstName, 
      lastName, 
      phone || null, 
      verificationCode,
      verificationExpires.toISOString()
    );

    // Enviar email de verificación
    const emailResult = await sendVerificationEmail(email, verificationCode, firstName);

    if (!emailResult.success) {
      // Si falla el email, eliminar el usuario creado
      db.prepare('DELETE FROM users WHERE id = ?').run(result.lastInsertRowid);
      return NextResponse.json(
        { error: 'Error enviando el email de verificación' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Usuario registrado exitosamente. Por favor verifica tu email.',
      userId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}