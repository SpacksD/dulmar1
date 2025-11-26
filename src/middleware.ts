import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Staff routes protection
    if (path.startsWith('/staff')) {
      if (!token || (token.role !== 'staff' && token.role !== 'admin')) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Admin routes protection
    if (path.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Dashboard routes protection (parent access)
    if (path.startsWith('/dashboard')) {
      if (!token || (token.role !== 'parent' && token.role !== 'admin')) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/staff/:path*'],
};
