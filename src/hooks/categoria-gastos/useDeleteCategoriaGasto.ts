"use client";
import { useState } from "react";
import { deleteCategoriaGastos } from "@/services/sales/categoria-gastos.api";

export function useDeleteCategoriaGasto(onDeleted?: (id: number) => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function remove(id: number) {
        setLoading(true);
        setError(null);
        try {
            await deleteCategoriaGastos(id);
            onDeleted?.(id);
        } catch (e: any) {
            setError(e?.message ?? "Error eliminando categoría");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading, error };
}