"use client";
import { useEffect, useState, useCallback } from "react";
import { listBanks } from "@/services/sales/bank.api";
import type { Bank } from "@/types/bank";

export function useBank(bankId: number | null) {
  const [bank, setBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!bankId) return;
    setLoading(true);
    setError(null);
    try {
      const all = await listBanks(Date.now());
      const found = all.find((b) => b.id === bankId) ?? null;
      if (!found) throw new Error("Banco no encontrado");
      setBank(found);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar banco");
      setBank(null);
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    fetchIt();
  }, [fetchIt]);

  return { bank, loading, error, refetch: fetchIt };
}
