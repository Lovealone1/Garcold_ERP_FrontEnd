import { useState } from "react";
import { deleteCliente } from "@/services/sales/clientes.api";

export function useDeleteCliente() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteCliente(id);
      return res;
    } catch (e: any) {
      setError(e.message ?? "Error eliminando cliente");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteCliente: handleDelete, loading, error };
}
