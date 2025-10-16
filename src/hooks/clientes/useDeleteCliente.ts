import { useState } from "react";
import { deleteCustomer } from "@/services/sales/customer.api";

export function useDeleteCustomer() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteCustomer(id); 
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Error deleting customer");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteCustomer: handleDelete, loading, error };
}
