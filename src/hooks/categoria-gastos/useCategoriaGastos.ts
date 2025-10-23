"use client";
import { useEffect, useState } from "react";
import type { ExpenseCategory } from "@/types/expense-category";
import { listExpenseCategories } from "@/services/sales/expense-category.api";

export function useExpenseCategories() {
    const [items, setItems] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const data = await listExpenseCategories();
                if (active) setItems(data);
            } catch (e: any) {
                if (active) setError(e?.message ?? "Failed to list expense categories");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    return { items, loading, error };
}
