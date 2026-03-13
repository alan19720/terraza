import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/services/token.service';
import { errorResponse } from '@/lib/utils/api-response';
import { TokenPayload } from '@/lib/types/auth.types';

type AuthHandler = (
    request: NextRequest,
    user: TokenPayload,
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with JWT authentication.
 * Verifies the access token from cookies and passes the decoded
 * user payload to the handler. Returns 401 if missing or invalid.
 */
export function withAuth(handler: AuthHandler) {
    return async (request: NextRequest) => {
        const token = request.cookies.get('accessToken')?.value;
        if (!token) {
            return errorResponse('Not authenticated', 401);
        }

        try {
            const payload = await verifyAccessToken(token);
            return handler(request, payload);
        } catch (e) {
            if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'ERR_JWT_EXPIRED') {
                return errorResponse('Session expired', 401);
            }
            return errorResponse('Invalid session', 401);
        }
    };
}
