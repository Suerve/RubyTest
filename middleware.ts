

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Allow access to auth pages, API routes, and static assets
    if (
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname === '/restricted-access' ||
      pathname.startsWith('/test-10key') ||
      pathname.startsWith('/tests/practice/') ||
      pathname.startsWith('/test-practice')
    ) {
      return NextResponse.next();
    }

    // Check if user is deactivated
    if (token?.isDeactivated) {
      return NextResponse.redirect(new URL('/restricted-access', req.url));
    }

    // Check if password change is required
    if (token?.requirePasswordChange) {
      // Allow access to change password page
      if (pathname === '/auth/change-password') {
        return NextResponse.next();
      }
      
      // Redirect to change password page
      return NextResponse.redirect(new URL('/auth/change-password', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow public routes without authentication
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/') ||
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/favicon.ico') ||
          pathname === '/restricted-access' ||
          pathname === '/request-access' ||
          pathname.startsWith('/test-10key') ||
          pathname.startsWith('/tests/practice/') ||
          pathname.startsWith('/test-practice')
        ) {
          return true;
        }
        
        // For protected routes, require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
