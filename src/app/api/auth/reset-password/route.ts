import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Buscar el código de recuperación
    const resetCode = db.prepare(`
      SELECT * FROM password_reset_codes
      WHERE email = ? AND code = ? AND is_used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(email, code) as { id: number; user_id: number; email: string; code: string; expires_at: string; is_used: number } | undefined;

    if (!resetCode) {
      return NextResponse.json(
        { error: 'Código inválido o ya fue utilizado' },
        { status: 400 }
      );
    }

    // Verificar si el código ha expirado
    const now = new Date();
    const expiresAt = new Date(resetCode.expires_at);

    if (now > expiresAt) {
      // Marcar como usado
      db.prepare(`
        UPDATE password_reset_codes
        SET is_used = 1
        WHERE id = ?
      `).run(resetCode.id);

      return NextResponse.json(
        { error: 'El código ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = db.prepare(`
      SELECT id FROM users WHERE id = ? AND email = ?
    `).get(resetCode.user_id, email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña del usuario
    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(hashedPassword, user.id);

    // Marcar el código como usado
    db.prepare(`
      UPDATE password_reset_codes
      SET is_used = 1, used_at = datetime('now')
      WHERE id = ?
    `).run(resetCode.id);

    // Invalidar todos los códigos anteriores del usuario
    db.prepare(`
      UPDATE password_reset_codes
      SET is_used = 1
      WHERE user_id = ? AND id != ? AND is_used = 0
    `).run(user.id, resetCode.id);

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
