'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { TABLE_ROUTES } from '@/lib/config/routes';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Search, LayoutGrid } from 'lucide-react';

interface TableRow {
    id: string;
    number: string;
    status: 'AVAILABLE' | 'OCCUPIED';
}

export default function TablesPage() {
    const { isLoading: authLoading } = useAuth();
    
    const [tables, setTables] = useState<TableRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<TableRow | null>(null);
    const [formNumber, setFormNumber] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deletingTable, setDeletingTable] = useState<TableRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTables = useCallback(async () => {
        setIsLoading(true);
        try {
            setError(null);
            const res = await fetch(TABLE_ROUTES.LIST, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setTables(json.data.tables);
            else setError(json.error || 'Failed to load tables');
        } catch {
            setError('Failed to load tables');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    const filtered = tables.filter(t => t.number.toLowerCase().includes(searchQuery.toLowerCase()));

    const openCreate = () => {
        setEditingTable(null);
        setFormNumber('');
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (table: TableRow) => {
        setEditingTable(table);
        setFormNumber(table.number);
        setFormError(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingTable(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!formNumber.trim()) {
            setFormError('El número de mesa es requerido');
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = !!editingTable;
            const url = isEdit ? TABLE_ROUTES.UPDATE(editingTable.id) : TABLE_ROUTES.LIST; // LIST route handles POST as well
            
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ number: formNumber })
            });

            const json = await res.json();
            if (!res.ok) {
                setFormError(json.error || 'Ocurrió un error al guardar');
                setIsSubmitting(false);
                return;
            }

            closeModal();
            fetchTables();
        } catch {
            setFormError('Error de red al guardar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingTable) return;
        setIsDeleting(true);
        try {
            const res = await fetch(TABLE_ROUTES.UPDATE(deletingTable.id), { method: 'DELETE', credentials: 'include' });
            const json = await res.json();
            if (res.ok) {
                setDeletingTable(null);
                fetchTables();
            } else {
                alert(json.error || 'Error al eliminar');
            }
        } catch {
            alert('Error de red');
        } finally {
            setIsDeleting(false);
        }
    };

    if (authLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Gestión de Mesas</h1>
                        <p className="text-sm text-gray-400">Agrega y administra las mesas del restaurante</p>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium">
                        <Plus className="w-4 h-4" /> Nueva Mesa
                    </button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Buscar mesa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm text-gray-700" />
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-100">{error}</div>}

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <LayoutGrid className="w-8 h-8 mb-2" />
                            <p className="text-sm">No hay mesas registradas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                            {filtered.map(table => (
                                <div key={table.id} className="relative bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(table)} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors" title="Editar">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setDeletingTable(table)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center font-bold text-lg ${table.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        M
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800">Mesa {table.number}</h3>
                                    <span className={`mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${table.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {table.status === 'AVAILABLE' ? 'Disponible' : 'Ocupada'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{editingTable ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
                            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{formError}</div>}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Número o Nombre de la Mesa</label>
                                <input type="text" required value={formNumber} onChange={e => setFormNumber(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all" placeholder="Ej: 7 o Terraza 1" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50">
                                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingTable && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingTable(null)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-base font-semibold text-gray-800">Eliminar Mesa</h2>
                        <p className="text-sm text-gray-500">¿Deseas eliminar la mesa <span className="font-medium text-gray-800">{deletingTable.number}</span>?</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeletingTable(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50">
                                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
