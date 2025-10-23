"use client";
import { useState } from "react";
import { deleteExpense } from "@/services/sales/expense.api";

export function useDeleteExpense(onDeleted?: () => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function remove(id: number) {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteExpense(id);
            onDeleted?.();
            return res;
        } catch (e: any) {
            setError(e?.message ?? "Failed to delete expense");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading, error };
}
