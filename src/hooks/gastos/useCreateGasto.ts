"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ExpenseCreate, Expense } from "@/types/expense";
import { createExpense } from "@/services/sales/expense.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";

export function useCreateExpense(onCreated?: (e: Expense) => void) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(payload: ExpenseCreate) {
    setLoading(true);
    setError(null);
    try {
      const res = await createExpense(payload);

      // This hook used to invalidate nothing at all: refreshing the list was
      // left to whatever callback the page happened to pass, so an expense
      // silently failed to show up in transactions, and never moved the bank
      // balance or the dashboard. Ownership belongs here, next to the write.
      await invalidateMovement(qc, { kind: "expense" });

      onCreated?.(res);
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Failed to create expense");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}
