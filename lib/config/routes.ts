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
    UPDATE: (id: string) => `${API_BASE}/users/${id}`,
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
 * Meal endpoints
 */
export const MEAL_ROUTES = {
    LIST: `${API_BASE}/meals`,
    CREATE: `${API_BASE}/meals`,
    UPDATE: (id: string) => `${API_BASE}/meals/${id}`,
} as const;

/**
 * Category endpoints
 */
export const CATEGORY_ROUTES = {
    LIST: `${API_BASE}/categories`,
    CREATE: `${API_BASE}/categories`,
    UPDATE: (id: string) => `${API_BASE}/categories/${id}`,
} as const;

/**
 * Table endpoints
 */
export const TABLE_ROUTES = {
    LIST: `${API_BASE}/tables`,
    UPDATE: (id: string) => `${API_BASE}/tables/${id}`,
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
} as const;

/**
 * Inventory endpoints
 */
export const INVENTORY_ROUTES = {
    LIST: `${API_BASE}/inventory`,
    CREATE: `${API_BASE}/inventory`,
    UPDATE: (id: string) => `${API_BASE}/inventory/${id}`,
    DELETE: (id: string) => `${API_BASE}/inventory/${id}`,
    STOCK: `${API_BASE}/inventory/stock`,
    MOVEMENTS: `${API_BASE}/inventory/stock`,
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
