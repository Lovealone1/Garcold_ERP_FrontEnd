"use client";
import { useCallback, useState } from "react";
import { deleteTransaccion } from "@/services/sales/transaccion.api";

export function useDeleteTransaccion() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remove = useCallback(async (transaccionId: number): Promise<string> => {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteTransaccion(transaccionId);
            return res.mensaje;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Error desconocido";
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    return { remove, loading, error };
}
