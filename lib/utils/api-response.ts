import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(
    data: T,
    message?: string,
    status: number = 200
): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data,
            message,
        },
        { status }
    );
}

/**
 * Creates an error API response
 */
export function errorResponse(
    error: string,
    status: number = 400
): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}

/**
 * Creates a validation error response
 */
export function validationError(
    errors: Record<string, string[]>
): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error: 'Validation failed',
            data: errors,
        },
        { status: 400 }
    );
}
