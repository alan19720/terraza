import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/services/token.service';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value;

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Verify token for protected routes
    if (isProtectedRoute) {
        if (!token) {
            // Redirect to login if no token
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        try {
            // Verify token
            await verifyAccessToken(token);
            // Token is valid, allow request
            return NextResponse.next();
        } catch (error) {
            // Token is invalid or expired, redirect to login
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect to dashboard if already authenticated and trying to access auth routes
    if (isAuthRoute && token) {
        try {
            await verifyAccessToken(token);
            // Token is valid, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch {
            // Token is invalid, allow access to auth route
            return NextResponse.next();
        }
    }

    // Allow all other requests
    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes (handled separately)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)',
    ],
};
