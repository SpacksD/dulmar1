import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';
import db from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { altText, title, isPrimary, sortOrder } = await request.json();

    // Verificar si la imagen existe
    const existingImage = db.prepare('SELECT * FROM images WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existingImage) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    // Si se marca como principal, desmarcar otras del mismo tipo/entidad
    if (isPrimary && existingImage.entity_type && existingImage.entity_id) {
      db.prepare(
        'UPDATE images SET is_primary = 0 WHERE entity_type = ? AND entity_id = ? AND id != ?'
      ).run(existingImage.entity_type, existingImage.entity_id, id);
    }

    const updateFields = [];
    const updateValues = [];

    if (altText !== undefined) {
      updateFields.push('alt_text = ?');
      updateValues.push(altText);
    }

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }

    if (isPrimary !== undefined) {
      updateFields.push('is_primary = ?');
      updateValues.push(isPrimary ? 1 : 0);
    }

    if (sortOrder !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(sortOrder);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    updateValues.push(id);

    const stmt = db.prepare(`
      UPDATE images SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...updateValues);

    return NextResponse.json({
      message: 'Imagen actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando imagen:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Obtener información de la imagen
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!image) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    try {
      // Eliminar archivo físico
      const filePath = typeof image.file_path === 'string' ? image.file_path : null;
      if (!filePath) {
        console.warn('Ruta de archivo inválida o ausente en la fila de imagen:', image);
      } else {
        const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath; // Remover el '/' inicial si existe
        const fullPath = path.join(process.cwd(), normalizedPath);
        await unlink(fullPath);
      }
    } catch (fileError) {
      console.warn('No se pudo eliminar el archivo físico:', fileError);
      // Continuar con la eliminación en BD aunque el archivo no se pueda eliminar
    }

    // Eliminar de base de datos
    const stmt = db.prepare('DELETE FROM images WHERE id = ?');
    stmt.run(id);

    return NextResponse.json({
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando imagen:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}