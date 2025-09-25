"use client";
import { useState } from "react";
import { deleteBanco } from "@/services/sales/bancos.api";

export function useDeleteBanco() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete(id: number) {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteBanco(id);
            return res; // { mensaje }
        } catch (e: any) {
            setError(e?.message ?? "Error eliminando banco");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { deleteBanco: handleDelete, loading, error };
}
