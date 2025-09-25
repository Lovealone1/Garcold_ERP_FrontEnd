"use client";
import { useCallback, useState } from "react";
import type { TransaccionCreate, TransaccionCreated } from "@/types/transacciones";
import { createTransaccion } from "@/services/sales/transaccion.api";

export function useCreateTransaccion() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = useCallback(async (payload: TransaccionCreate): Promise<TransaccionCreated> => {
        setLoading(true);
        setError(null);
        try {
            return await createTransaccion(payload);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Error desconocido";
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    return { create, loading, error };
}
