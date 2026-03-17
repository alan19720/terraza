/**
 * User management TypeScript types
 */

export interface UserRow {
    id: string;
    name: string;
    email: string;
    active: boolean;
    role: {
        id: string;
        name: string;
    };
}

export interface UserFormData {
    name: string;
    email: string;
    password: string;
    roleId: string;
    active: boolean;
}

export interface RoleOption {
    id: string;
    name: string;
}
