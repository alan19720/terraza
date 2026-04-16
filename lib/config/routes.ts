/**
 * API Routes Configuration
 * Centralized API endpoint definitions
 */

const API_BASE = '/api';

/**
 * Authentication endpoints
 */
export const AUTH_ROUTES = {
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH: `${API_BASE}/auth/refresh`,
    ME: `${API_BASE}/auth/me`,
} as const;

/**
 * User endpoints (example for future use)
 */
export const USER_ROUTES = {
    ME: `${API_BASE}/users/me`,
    LIST: `${API_BASE}/users`,
    BY_ID: (id: string) => `${API_BASE}/users/${id}`,
    CREATE: `${API_BASE}/users/create`,
} as const;

/**
 * Product endpoints (example for future use)
 */
export const PRODUCT_ROUTES = {
    LIST: `${API_BASE}/products`,
    BY_ID: (id: string) => `${API_BASE}/products/${id}`,
    CREATE: `${API_BASE}/products`,
    UPDATE: (id: string) => `${API_BASE}/products/${id}`,
    DELETE: (id: string) => `${API_BASE}/products/${id}`,
} as const;

/**
 * Table endpoints
 */
export const TABLE_ROUTES = {
    LIST: `${API_BASE}/tables`,
    UPDATE: (id: string) => `${API_BASE}/tables/${id}`,
} as const;

/**
 * Kitchen queue & line-item status
 */
export const KITCHEN_ROUTES = {
    ORDERS: `${API_BASE}/kitchen/orders`,
    UPDATE_ITEM: (orderDetailId: string) => `${API_BASE}/kitchen/items/${orderDetailId}`,
} as const;

/**
 * Order endpoints
 */
export const ORDER_ROUTES = {
    LIST: `${API_BASE}/orders/list`,
    BY_ID: (id: string) => `${API_BASE}/orders/${id}`,
    CREATE: `${API_BASE}/orders/create`,
    UPDATE: (id: string) => `${API_BASE}/orders/${id}`,
    UPDATE_STATUS: (id: string) => `${API_BASE}/orders/${id}/status`,
    ADD_ITEMS: (id: string) => `${API_BASE}/orders/${id}/items`,
} as const;

/**
 * Page routes for navigation
 */
export const PAGE_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    DASHBOARD_KITCHEN: '/dashboard/kitchen',
    PRODUCTS: '/products',
    ORDERS: '/orders',
    USERS: '/users',
} as const;
