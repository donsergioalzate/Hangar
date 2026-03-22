import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const requestedPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
      const loginUrl = `/mi-cuenta?redirect=${encodeURIComponent(requestedPath)}`;
      return NextResponse.redirect(new URL(loginUrl, req.url));
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
