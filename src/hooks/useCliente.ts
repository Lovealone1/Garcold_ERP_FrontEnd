import { useEffect, useState, useCallback } from "react";
import { getClienteById } from "@/services/sales/clientes.api";
import type { Cliente } from "@/types/clientes";

export function useCliente(clienteId: number | null) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getClienteById(clienteId);
      setCliente(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar cliente");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  return { cliente, loading, error, refetch: fetchIt };
}