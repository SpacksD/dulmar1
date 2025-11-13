import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const role = searchParams.get('role');
    const active = searchParams.get('active');

    let query = 'SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, created_at, last_login FROM users WHERE 1=1';
    const params: (string | number)[] = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (active !== null) {
      query += ' AND is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = db.prepare(query).all(...params);
    
    const countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1' + 
      (role ? ' AND role = ?' : '') + 
      (active !== null ? ' AND is_active = ?' : '');
    
    const countParams = [];
    if (role) countParams.push(role);
    if (active !== null) countParams.push(active === 'true' ? 1 : 0);
    
    const totalResult = db.prepare(countQuery).get(...countParams) as { total: number };
    const total = totalResult.total;

    return NextResponse.json({
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, first_name, last_name, phone, role, is_active = true } = body;

    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, first_name, last_name, role' },
        { status: 400 }
      );
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const result = db.prepare(`
      INSERT INTO users (email, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).run(email, first_name, last_name, phone, role, is_active ? 1 : 0);

    const newUser = db.prepare(`
      SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, created_at, last_login
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}