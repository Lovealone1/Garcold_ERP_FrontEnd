"use client";
import { useCallback, useState } from "react";
import { deleteTransaction } from "@/services/sales/transaction.api";

export function useDeleteTransaction() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remove = useCallback(async (transactionId: number): Promise<string> => {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteTransaction(transactionId);
            return res.message;
        } catch (e: unknown) {
            const msg =
                (e as any)?.response?.data?.detail ??
                (e instanceof Error ? e.message : "Error al eliminar la transacción");
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    return { remove, loading, error };
}
