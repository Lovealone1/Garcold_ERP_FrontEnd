"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteExpense } from "@/services/sales/expense.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";

export function useDeleteExpense(onDeleted?: () => void) {
    const qc = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function remove(id: number) {
        setLoading(true);
        setError(null);
        try {
            const res = await deleteExpense(id);

            // Same gap as the create hook: no invalidation lived here, so a
            // deleted expense stayed in transactions and left the bank balance
            // and dashboard showing the reverted amount.
            await invalidateMovement(qc, { kind: "expense" });

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
