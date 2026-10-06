import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { sanitizeCallbackPath } from '@/lib/auth/safe-redirect';

const PUBLIC_PATHS = ['/', '/login'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname === '/api/auth/register') return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isPublicPath(pathname)) {
    if (pathname === '/login') {
      const session = await auth();
      if (session?.user) {
        const callbackUrl = sanitizeCallbackPath(
          request.nextUrl.searchParams.get('callbackUrl')
        );
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }
    }
    return response;
  }

  const session = await auth();
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', sanitizeCallbackPath(pathname));
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
