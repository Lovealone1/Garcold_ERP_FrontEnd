"use client";
import { useEffect, useState, useCallback } from "react";
import { listBancos } from "@/services/sales/bancos.api";
import type { Banco } from "@/types/bancos";

export function useBanco(bancoId: number | null) {
  const [banco, setBanco] = useState<Banco | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!bancoId) return;
    setLoading(true);
    setError(null);
    try {
      const all = await listBancos(Date.now());
      const found = all.find(b => b.id === bancoId) ?? null;
      if (!found) throw new Error("Banco no encontrado");
      setBanco(found);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar banco");
      setBanco(null);
    } finally {
      setLoading(false);
    }
  }, [bancoId]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  return { banco, loading, error, refetch: fetchIt };
}
