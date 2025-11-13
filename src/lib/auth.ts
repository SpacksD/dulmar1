import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import db from '@/lib/database';

interface DbUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role: string;
  email_verified: number;
  is_active: number;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
          const user = stmt.get(credentials.email) as DbUser | undefined;

          if (!user) {
            return null;
          }

          if (!user.email_verified) {
            throw new Error('Email no verificado');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isPasswordValid) {
            return null;
          }

          // Actualizar último login
          const updateStmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
          updateStmt.run(user.id);

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
            image: null
          };
        } catch (error) {
          console.error('Error en autenticación:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('=== AUTH SESSION CALLBACK ===');
      console.log('Token:', token);
      console.log('Session antes:', session);

      if (token && session.user?.email) {
        // Obtener el ID actual del usuario desde la base de datos
        const stmt = db.prepare('SELECT id, role FROM users WHERE email = ? AND is_active = 1');
        const user = stmt.get(session.user.email) as Pick<DbUser, 'id' | 'role'> | undefined;

        console.log('Usuario de DB:', user);

        if (user) {
          session.user.id = user.id.toString();
          session.user.role = user.role;
          console.log('Role asignado desde DB:', user.role);
        } else {
          session.user.id = token.sub!;
          session.user.role = token.role as string;
          console.log('Role asignado desde token:', token.role);
        }
      }

      console.log('Session después:', session);
      console.log('===============================');
      return session;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
  },
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string | null;
    };
  }
  
  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
  }
}