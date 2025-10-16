"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listAllProducts } from "@/services/sales/productos.api";
import type { ProductDTO } from "@/types/productos";

type Option = { value: number; label: string };

export function useProductosAll(nocacheToken?: number) {
  const [items, setItems] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (token = nocacheToken) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAllProducts({ nocacheToken: token ?? Date.now() });
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? e?.message ?? "Error cargando productos");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [nocacheToken]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const options: Option[] = useMemo(
    () =>
      items.map((p) => ({
        value: p.id,
        label: p.description ? `${p.reference} — ${p.description}` : p.reference,
      })),
    [items]
  );

  return { items, options, loading, error, reload };
}
