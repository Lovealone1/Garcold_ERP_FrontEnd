import { useEffect, useState, useCallback } from "react";
import { getCustomerById } from "@/services/sales/customer.api";
import type { Customer } from "@/types/customer";

export function useCustomer(customerId: number | null) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerById(customerId);
      setCustomer(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchIt();
    })();
    return () => {
      active = false;
    };
  }, [fetchIt]);

  return { customer, loading, error, refetch: fetchIt };
}
