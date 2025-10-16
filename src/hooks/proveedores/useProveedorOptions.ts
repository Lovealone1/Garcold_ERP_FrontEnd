"use client";

import { useEffect, useMemo, useState } from "react";
import { listSuppliersAll } from "@/services/sales/supplier.api";
import type { SupplierLite } from "@/types/supplier";

export type SupplierOption = { label: string; value: number };

export function useSupplierOptions(nocacheToken?: number) {
    const [items, setItems] = useState<SupplierLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        listSuppliersAll(nocacheToken)
            .then((data) => {
                if (alive) setItems(data || []);
            })
            .catch((e: any) => {
                if (alive) setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load suppliers");
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [nocacheToken]);

    const options: SupplierOption[] = useMemo(
        () => items.map((p) => ({ label: p.name, value: p.id })),
        [items]
    );

    const findLabel = (id?: number | null) =>
        id == null ? "" : items.find((x) => x.id === id)?.name ?? "";

    return { items, options, loading, error, findLabel };
}
