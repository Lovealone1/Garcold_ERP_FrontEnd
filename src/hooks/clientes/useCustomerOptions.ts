"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listCustomersAll } from "@/services/sales/customer.api";
import type { CustomerLite, Customer } from "@/types/customer";

export type CustomerOption = { label: string; value: number };

export function useCustomerOptions(initialForce?: number) {
  const qc = useQueryClient();
  const [forceTs, setForceTs] = useState<number | undefined>(initialForce);

  const key = useMemo(
    () => ["customers", "all", { force: forceTs ?? 0 }] as const,
    [forceTs]
  );

  const query = useQuery<CustomerLite[]>({
    queryKey: key,
    queryFn: async ({ signal, queryKey }) => {
      const [, , meta] = queryKey;
      const nocacheToken =
        typeof (meta as any)?.force === "number" && (meta as any).force > 0
          ? Date.now()
          : undefined;
      return listCustomersAll({ signal, nocacheToken });
    },
    staleTime: 1000 * 60 * 60,       
    gcTime: 1000 * 60 * 60 * 24 * 3, 
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const items = query.data ?? [];
  const loading = query.isLoading || query.isFetching;
  const error = query.isError ? (query.error as Error).message : null;

  const options: CustomerOption[] = useMemo(
    () => items.map((c) => ({ value: c.id, label: c.name })),
    [items]
  );

  const findLabel = (id?: number | null) =>
    id == null ? "" : items.find((x) => x.id === id)?.name ?? "";

  const reload = () => setForceTs(Date.now());
  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers", "all"] });

  const primeFromPages = (fullCustomers: Customer[]) => {
    const lite: CustomerLite[] = fullCustomers.map((c) => ({ id: c.id, name: c.name }));
    qc.setQueryData<CustomerLite[]>(["customers", "all", { force: 0 }], lite);
  };

  return { items, options, loading, error, findLabel, reload, invalidate, primeFromPages };
}
