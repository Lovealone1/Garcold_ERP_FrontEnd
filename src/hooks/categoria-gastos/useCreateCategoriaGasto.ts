"use client";
import { useState } from "react";
import type { ExpenseCategory, ExpenseCategoryCreate } from "@/types/expense-category";
import { createExpenseCategory } from "@/services/sales/expense-category.api";

export function useCreateExpenseCategory(onCreated?: (c: ExpenseCategory) => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function create(payload: ExpenseCategoryCreate) {
        setLoading(true);
        setError(null);
        try {
            const res = await createExpenseCategory(payload);
            onCreated?.(res);
            return res;
        } catch (e: any) {
            setError(e?.message ?? "Failed to create expense category");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { create, loading, error };
}
