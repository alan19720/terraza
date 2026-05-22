'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import {
    X, Plus, Minus, Loader2, ShoppingCart,
    UtensilsCrossed,
} from 'lucide-react';
import { ORDER_ROUTES } from '@/lib/config/routes';

type Meal = { id: string; name: string; description: string | null; price: number };
type Category = { id: string; name: string; meals: Meal[] };
type CartItem = { mealId: string; name: string; price: number; quantity: number };

type Props = {
    open: boolean;
    orderId: string;
    tableNumber: string;
    onClose: () => void;
    onSuccess?: () => void;
};

export default function AddItemsToOrderModal({ open, orderId, tableNumber, onClose, onSuccess }: Props) {
    const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());
    const { data: categoriesData, isLoading: loading } = useSWR(open ? '/api/categories' : null, fetcher);
    const categories: Category[] = useMemo(() => categoriesData?.data?.categories ?? [], [categoriesData]);
    const [submitting, setSubmitting] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('');

    useEffect(() => {
        if (!open) return;
        setCart([]);
        setActiveCategory('');
    }, [open]);

    // Auto-select the first category when categories load
    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    const selectedCategory = categories.find((c) => c.id === activeCategory) ?? categories[0] ?? null;
    const meals = selectedCategory?.meals ?? [];

    const addToCart = (meal: Meal, qty = 1) => {
        setCart((prev) => {
            const i = prev.findIndex((x) => x.mealId === meal.id);
            if (i >= 0) {
                return prev.map((item, idx) =>
                    idx === i ? { ...item, quantity: item.quantity + qty } : item
                );
            }
            return [...prev, { mealId: meal.id, name: meal.name, price: Number(meal.price), quantity: qty }];
        });
    };

    const updateQty = (mealId: string, delta: number) => {
        setCart((prev) => {
            const i = prev.findIndex((x) => x.mealId === mealId);
            if (i < 0) return prev;
            const newQty = prev[i].quantity + delta;
            if (newQty <= 0) return prev.filter((x) => x.mealId !== mealId);
            return prev.map((item, idx) =>
                idx === i ? { ...item, quantity: newQty } : item
            );
        });
    };

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

    const handleSubmit = async () => {
        if (!orderId || cart.length === 0) return;
        setSubmitting(true);
        try {
            const res = await fetch(ORDER_ROUTES.ADD_ITEMS(orderId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    items: cart.map((i) => ({ mealId: i.mealId, quantity: i.quantity })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al agregar');
            onSuccess?.();
            onClose();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al agregar');
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Agregar a la orden</h2>
                        <p className="text-xs text-gray-400">Mesa {tableNumber}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex min-h-0">
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {/* Category tabs */}
                            <div className="px-4 pt-3 pb-2 flex gap-1.5 overflow-x-auto shrink-0">
                                {categories.map((cat) => {
                                    const isActive = selectedCategory?.id === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer border ${
                                                isActive
                                                    ? 'bg-primary text-white border-primary shadow-sm'
                                                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'
                                            }`}
                                        >
                                            {cat.name}
                                            <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-300'}`}>
                                                ({cat.meals.length})
                                            </span>
                                        </button>
                                    );
                                })}
                                {categories.length === 0 && (
                                    <p className="text-sm text-gray-400 py-2">No hay categorías</p>
                                )}
                            </div>

                            {/* Meals grid */}
                            <div className="flex-1 overflow-y-auto px-4 py-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {meals.map((meal) => {
                                        const inCart = cart.find((x) => x.mealId === meal.id);
                                        return (
                                            <div
                                                key={meal.id}
                                                onClick={() => addToCart(meal)}
                                                className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                                                    inCart
                                                        ? 'bg-primary/5 border-primary/30'
                                                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                                }`}
                                            >
                                                <p className="text-sm font-medium text-gray-800 leading-snug">{meal.name}</p>
                                                {meal.description && (
                                                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{meal.description}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-semibold text-primary">
                                                        ${Number(meal.price).toFixed(0)}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {inCart && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); updateQty(meal.id, -1); }}
                                                                className="p-1 rounded-md bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors"
                                                            >
                                                                <Minus className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {inCart && (
                                                            <span className="text-xs font-bold min-w-[20px] text-center text-primary">
                                                                {inCart.quantity}
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); addToCart(meal); }}
                                                            className={`p-1 rounded-md cursor-pointer transition-colors ${
                                                                inCart
                                                                    ? 'bg-white border border-gray-200 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'
                                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                                                            }`}
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {meals.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                                        <UtensilsCrossed className="w-8 h-8 mb-2" />
                                        <p className="text-sm">No hay platillos en esta categoría</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-72 border-l border-gray-100 flex flex-col bg-gray-50/70 shrink-0">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-700">Agregar</span>
                                </div>
                                {itemCount > 0 && (
                                    <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                                        {itemCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                                        <ShoppingCart className="w-8 h-8 mb-2" />
                                        <p className="text-sm">Elige platillos</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div
                                            key={item.mealId}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium text-gray-800 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-400">${item.price.toFixed(0)} c/u</p>
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.mealId, -1)}
                                                    className="p-1 rounded-md hover:bg-red-50 hover:text-red-500 text-gray-400 cursor-pointer transition-colors"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-sm font-semibold w-5 text-center text-gray-700">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.mealId, 1)}
                                                    className="p-1 rounded-md hover:bg-emerald-50 hover:text-emerald-500 text-gray-400 cursor-pointer transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 w-14 text-right">
                                                ${(item.price * item.quantity).toFixed(0)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="px-4 py-3 border-t border-gray-200 bg-white space-y-3 shrink-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Subtotal nuevo</span>
                                    <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={cart.length === 0 || submitting}
                                    className="w-full py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Agregar a la orden'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

