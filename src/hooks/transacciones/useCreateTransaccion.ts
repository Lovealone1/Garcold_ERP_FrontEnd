"use client";
import { useCallback, useState } from "react";
import type { TransactionCreate, TransactionCreated } from "@/types/transaction";
import { createTransaction } from "@/services/sales/transaction.api";

export function useCreateTransaction() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = useCallback(async (payload: TransactionCreate): Promise<TransactionCreated> => {
        setLoading(true);
        setError(null);
        try {
            return await createTransaction(payload);
        } catch (e: unknown) {
            const msg =
                (e as any)?.response?.data?.detail ??
                (e instanceof Error ? e.message : "Error al crear la transacción");
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    return { create, loading, error };
}
