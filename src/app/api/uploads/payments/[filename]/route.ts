import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { filename } = await params;

    // Verify user has permission to view this file
    const filePath = `/uploads/payments/${filename}`;

    // Check if file exists in payment_history table
    let whereClause = 'WHERE payment_proof = ?';
    const queryParams = [filePath];

    // If not admin, only allow viewing own payment files
    if (session.user.role !== 'admin') {
      whereClause += ' AND user_id = ?';
      queryParams.push(session.user.id);
    }

    const payment = db.prepare(`
      SELECT * FROM payment_history
      ${whereClause}
    `).get(...queryParams);

    if (!payment) {
      return NextResponse.json(
        { error: 'Archivo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Read and serve the file
    const fullPath = path.join(process.cwd(), 'uploads', 'payments', filename);

    try {
      const fileBuffer = await readFile(fullPath);

      // Convert Node Buffer to a Uint8Array to ensure a compatible BodyInit type
      const uint8Body = new Uint8Array(fileBuffer);

      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';

      switch (ext) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
      }

      return new NextResponse(uint8Body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json(
        { error: 'Error al leer el archivo' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error serving payment file:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}