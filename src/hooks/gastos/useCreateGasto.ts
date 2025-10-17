"use client";
import { useState } from "react";
import type { GastoCreate, GastoCreated } from "@/types/expense";
import { createGasto } from "@/services/sales/gastos.api";

export function useCreateGasto(onCreated?: (g: GastoCreated) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(payload: GastoCreate) {
    setLoading(true);
    setError(null);
    try {
      const res = await createGasto(payload);
      onCreated?.(res);
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Error creando gasto");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}
