import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  
  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  const publicPaths = ['/login', '/register', '/', '/about', '/contact'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Admin paths
  const isAdminPath = pathname.startsWith('/admin');
  
  // Member paths
  const isMemberPath = pathname.startsWith('/member');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token && !userCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If we have user cookie, parse it
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      
      // Check admin access
      if (isAdminPath && user.role !== 'admin') {
        return NextResponse.redirect(new URL('/member/dashboard', request.url));
      }
      
      // Check member access
      if (isMemberPath && user.role !== 'member') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    } catch (error) {
      // Invalid cookie, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};