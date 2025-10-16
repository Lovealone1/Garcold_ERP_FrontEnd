import { useEffect, useMemo, useState } from "react";
import { listCustomersAll } from "@/services/sales/customer.api";
import type { CustomerLite } from "@/types/customer";

export type CustomerOption = { label: string; value: number };

export function useCustomerOptions(nocacheToken?: number) {
  const [items, setItems] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listCustomersAll(nocacheToken)
      .then((data) => {
        if (alive) setItems(data || []);
      })
      .catch((e: any) => {
        if (alive) setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load customers");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [nocacheToken]);

  const options: CustomerOption[] = useMemo(
    () => items.map((c) => ({ label: c.name, value: c.id })),
    [items]
  );

  const findLabel = (id?: number | null) =>
    id == null ? "" : items.find((x) => x.id === id)?.name ?? "";

  return { items, options, loading, error, findLabel };
}
