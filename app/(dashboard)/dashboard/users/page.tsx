'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { USER_ROUTES } from '@/lib/config/routes';
import { UserRow, UserFormData, RoleOption } from '@/lib/types/user.types';
import { useState, useEffect, useCallback } from 'react';
import {
    Loader2,
    Plus,
    Pencil,
    X,
    Search,
    Check,
    Ban,
    UserCircle,
} from 'lucide-react';

const EMPTY_FORM: UserFormData = {
    name: '',
    email: '',
    password: '',
    roleId: '',
    active: true,
};

export default function UsersPage() {
    const { isLoading: authLoading } = useAuth();

    const [users, setUsers] = useState<UserRow[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(USER_ROUTES.LIST, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setUsers(json.data.users);
            else setError(json.error || 'Failed to load users');
        } catch {
            setError('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        try {
            const res = await fetch('/api/roles', { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setRoles(json.data.roles);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchUsers(); fetchRoles(); }, [fetchUsers, fetchRoles]);

    // ── Filter ────────────────────────────────────────────────────────
    const filtered = users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.name.toLowerCase().includes(q);
    });

    // ── Modal handlers ────────────────────────────────────────────────
    const openCreate = () => { setEditingUser(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true); };

    const openEdit = (u: UserRow) => {
        setEditingUser(u);
        setForm({ name: u.name, email: u.email, password: '', roleId: u.role.id, active: u.active });
        setFormError(null);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingUser(null); setForm(EMPTY_FORM); setFormError(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
            const isEdit = !!editingUser;
            const url = isEdit ? USER_ROUTES.UPDATE(editingUser!.id) : USER_ROUTES.CREATE;
            const body: Record<string, unknown> = { name: form.name, email: form.email, roleId: form.roleId };
            if (isEdit) body.active = form.active;
            if (form.password) body.password = form.password;

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok) { setFormError(json.error || 'Something went wrong'); return; }
            closeModal();
            fetchUsers();
        } catch { setFormError('Network error'); } finally { setSubmitting(false); }
    };

    const toggleActive = async (u: UserRow) => {
        try {
            await fetch(USER_ROUTES.UPDATE(u.id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ active: !u.active }),
            });
            fetchUsers();
        } catch { /* silent */ }
    };

    if (authLoading) {
        return (<div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>);
    }

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Usuarios</h1>
                        <p className="text-sm text-gray-400">Gestión de cuentas de usuario</p>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer">
                        <Plus className="w-4 h-4" /> Agregar Usuario
                    </button>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Buscar usuario..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none text-sm text-gray-700 placeholder-gray-300" />
                </div>

                {error && (<div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>)}

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <UserCircle className="w-8 h-8 mb-2" />
                            <p className="text-sm">{searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Usuario</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((u) => (
                                        <tr key={u.id} className={`transition-colors ${!u.active ? 'bg-gray-50/40 hover:bg-gray-50/70' : 'hover:bg-gray-50/50'}`}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${u.active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-800 truncate max-w-[180px]">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs truncate max-w-[250px] hidden md:table-cell">{u.email}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 text-xs font-medium">{u.role.name}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {u.active ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium"><Check className="w-3.5 h-3.5" /> Activo</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium"><Ban className="w-3.5 h-3.5" /> Inactivo</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Editar">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => toggleActive(u)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.active ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'}`} title={u.active ? 'Desactivar' : 'Activar'}>
                                                        {u.active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Modal ──────────────────────────────── */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{formError}</div>)}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Nombre completo" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                                <input type="email" required value={form.email} onChange={(e) => setForm((d) => ({ ...d, email: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="correo@ejemplo.com" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Contraseña {editingUser && <span className="text-gray-300 font-normal">(dejar vacío para no cambiar)</span>}
                                </label>
                                <input type="password" required={!editingUser} value={form.password} onChange={(e) => setForm((d) => ({ ...d, password: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="••••••" minLength={6} />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rol</label>
                                <select required value={form.roleId} onChange={(e) => setForm((d) => ({ ...d, roleId: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                    <option value="">Seleccionar rol...</option>
                                    {roles.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                                </select>
                            </div>

                            {editingUser && (
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-600">Activo</label>
                                    <button type="button" role="switch" aria-checked={form.active} onClick={() => setForm((d) => ({ ...d, active: !d.active }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${form.active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
