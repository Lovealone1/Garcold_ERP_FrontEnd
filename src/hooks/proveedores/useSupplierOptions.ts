"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listSuppliersAll } from "@/services/sales/supplier.api";
import type { SupplierLite, Supplier } from "@/types/supplier";

export type SupplierOption = { label: string; value: number };

export function useSupplierOptions(initialForce?: number) {
    const qc = useQueryClient();
    const [forceTs, setForceTs] = useState<number | undefined>(initialForce);

    const key = useMemo(
        () => ["suppliers", "all", { force: forceTs ?? 0 }] as const,
        [forceTs]
    );

    const query = useQuery<SupplierLite[]>({
        queryKey: key,
        queryFn: async ({ signal, queryKey }) => {
            const [, , meta] = queryKey;
            const nocacheToken =
                typeof (meta as any)?.force === "number" && (meta as any).force > 0
                    ? Date.now()
                    : undefined;
            return listSuppliersAll({ signal, nocacheToken });
        },
        staleTime: 1000 * 60 * 60,      
        gcTime: 1000 * 60 * 60 * 24 * 3, 
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const items = query.data ?? [];
    const loading = query.isLoading || query.isFetching;
    const error = query.isError ? (query.error as Error).message : null;

    const options: SupplierOption[] = useMemo(
        () => items.map((p) => ({ label: p.name, value: p.id })),
        [items]
    );

    const findLabel = (id?: number | null) =>
        id == null ? "" : items.find((x) => x.id === id)?.name ?? "";

    const reload = () => setForceTs(Date.now());
    const invalidate = () => qc.invalidateQueries({ queryKey: ["suppliers", "all"] });

    const primeFromPages = (full: Supplier[]) => {
        const lite: SupplierLite[] = full.map((s) => ({ id: s.id, name: s.name }));
        qc.setQueryData<SupplierLite[]>(["suppliers", "all", { force: 0 }], lite);
    };

    return { items, options, loading, error, findLabel, reload, invalidate, primeFromPages };
}
