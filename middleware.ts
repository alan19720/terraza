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
            const payload = await verifyAccessToken(token);
            const userRole = payload.role?.name || '';
            
            // RBAC Mapping
            // ADMIN: all routes under /dashboard
            // COCINERO: kitchen, recipes, menu
            // BARTENDER: bartender
            // MESERO: exact /dashboard and /dashboard/cashier
            
            let isAllowed = false;

            if (userRole === 'ADMIN') {
                isAllowed = true;
            } else if (userRole === 'COCINERO') {
                isAllowed = pathname.startsWith('/dashboard/kitchen') ||
                            pathname.startsWith('/dashboard/recipes') ||
                            pathname.startsWith('/dashboard/menu');
            } else if (userRole === 'BARTENDER') {
                isAllowed = pathname.startsWith('/dashboard/bartender');
            } else if (userRole === 'MESERO') {
                isAllowed = pathname === '/dashboard';
            }

            if (!isAllowed) {
                // Redirect to their default allowed route
                let redirectPath = '/login';
                if (userRole === 'COCINERO') redirectPath = '/dashboard/kitchen';
                else if (userRole === 'BARTENDER') redirectPath = '/dashboard/bartender';
                else if (userRole === 'MESERO') redirectPath = '/dashboard';
                else redirectPath = '/dashboard';

                // Prevent infinite redirect loop if default path is somehow not matched above
                if (pathname !== redirectPath) {
                    return NextResponse.redirect(new URL(redirectPath, request.url));
                }
            }

            // Token is valid and role is allowed, allow request
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
