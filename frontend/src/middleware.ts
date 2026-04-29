import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/checkout', '/orders', '/profile'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

function applyNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Vary', 'Cookie');
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return applyNoStoreHeaders(NextResponse.redirect(loginUrl));
  }

  return applyNoStoreHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*', '/profile/:path*'],
};
