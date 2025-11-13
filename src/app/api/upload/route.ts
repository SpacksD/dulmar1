import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;
    const altText = formData.get('altText') as string;
    const title = formData.get('title') as string;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    if (!entityType) {
      return NextResponse.json(
        { error: 'Tipo de entidad requerido' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se permiten JPEG, PNG, WebP y GIF' },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images', entityType);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Escribir archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Ruta relativa para la base de datos (sin /public porque Next.js lo sirve automáticamente)
    const dbPath = `/uploads/images/${entityType}/${filename}`;

    // Si es imagen principal, desmarcar otras como principales
    if (isPrimary && entityId) {
      db.prepare(
        'UPDATE images SET is_primary = 0 WHERE entity_type = ? AND entity_id = ?'
      ).run(entityType, entityId);
    }

    // Debug: log user info
    console.log('Upload by user:', { id: session.user.id, email: session.user.email });

    // Verificar si el usuario existe en la base de datos
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(session.user.id));
    const uploadedBy = userExists ? parseInt(session.user.id) : null;
    
    console.log('User exists check:', { userExists: !!userExists, uploadedBy });

    // Guardar en base de datos
    const stmt = db.prepare(`
      INSERT INTO images (
        filename, original_name, file_path, file_size, mime_type,
        alt_text, title, entity_type, entity_id, is_primary, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      filename,
      file.name,
      dbPath,
      file.size,
      file.type,
      altText || null,
      title || null,
      entityType,
      entityId || null,
      isPrimary ? 1 : 0,
      uploadedBy
    );

    return NextResponse.json({
      message: 'Imagen subida exitosamente',
      url: dbPath,
      image: {
        id: result.lastInsertRowid,
        filename,
        originalName: file.name,
        filePath: dbPath,
        fileSize: file.size,
        mimeType: file.type,
        altText,
        title,
        entityType,
        entityId,
        isPrimary
      }
    });

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (entityType) {
      whereClause += ' AND entity_type = ?';
      params.push(entityType);
    }

    if (entityId) {
      whereClause += ' AND entity_id = ?';
      params.push(entityId);
    }

    const stmt = db.prepare(`
      SELECT i.*, 
             u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM images i
      LEFT JOIN users u ON i.uploaded_by = u.id
      ${whereClause}
      ORDER BY i.is_primary DESC, i.sort_order ASC, i.created_at DESC
    `);

    const images = stmt.all(...params);

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}