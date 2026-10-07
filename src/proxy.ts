import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { sanitizeCallbackPath } from '@/lib/auth/safe-redirect';
import { applyContentSecurityPolicy } from '@/lib/security/csp';

const PUBLIC_PATHS = ['/', '/login'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (process.env.E2E_CSP_FIXTURE === '1' && pathname === '/test/csp-fixture') {
    return true;
  }
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname === '/api/auth/register') return true;
  return false;
}

function withSecurityHeaders(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applyContentSecurityPolicy(requestHeaders, response.headers);
  return response;
}

function withSecurityHeadersRedirect(response: NextResponse): NextResponse {
  applyContentSecurityPolicy(new Headers(), response.headers);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === '/login') {
      const session = await auth();
      if (session?.user) {
        const callbackUrl = sanitizeCallbackPath(
          request.nextUrl.searchParams.get('callbackUrl')
        );
        return withSecurityHeadersRedirect(
          NextResponse.redirect(new URL(callbackUrl, request.url))
        );
      }
    }
    return withSecurityHeaders(request);
  }

  const session = await auth();
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', sanitizeCallbackPath(pathname));
    return withSecurityHeadersRedirect(NextResponse.redirect(loginUrl));
  }

  return withSecurityHeaders(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
