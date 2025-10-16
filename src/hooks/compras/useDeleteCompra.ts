"use client";
import { useState } from "react";
import { deleteCompra } from "@/services/sales/compras.api";

export function useDeleteCompra() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete(id: number) {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteCompra(id);
            return res;
        } catch (e: any) {
            const msg = e?.response?.data?.detail ?? e?.message ?? "Error eliminando compra";
            setError(msg);
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { deleteCompra: handleDelete, loading, error };
}
