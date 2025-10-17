"use client";
import { useState } from "react";
import { deleteExpenseCategory } from "@/services/sales/expense-category.api";

export function useDeleteExpenseCategory(onDeleted?: (id: number) => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function remove(id: number) {
        setLoading(true);
        setError(null);
        try {
            await deleteExpenseCategory(id);
            onDeleted?.(id);
        } catch (e: any) {
            setError(e?.message ?? "Failed to delete expense category");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading, error };
}
