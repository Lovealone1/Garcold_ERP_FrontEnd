"use client";
import { useState } from "react";
import { deleteGasto } from "@/services/sales/gastos.api";

export function useDeleteGasto(onDeleted?: () => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function remove(id: number) {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteGasto(id);
            onDeleted?.();
            return res;
        } catch (e: any) {
            setError(e?.message ?? "Error eliminando gasto");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading, error };
}
