"use client";

import { useEffect, useMemo, useState } from "react";
import { listProveedoresAll } from "@/services/sales/proveedores.api";
import type { ProveedorLite } from "@/types/proveedores";

export type ProveedorOption = { label: string; value: number };

export function useProveedorOptions(nocacheToken?: number) {
    const [items, setItems] = useState<ProveedorLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        listProveedoresAll(nocacheToken)
            .then((data) => { if (alive) setItems(data || []); })
            .catch((e: any) => {
                if (alive) setError(e?.response?.data?.detail ?? e?.message ?? "Error cargando proveedores");
            })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [nocacheToken]);

    const options: ProveedorOption[] = useMemo(
        () => items.map((p) => ({ label: p.nombre, value: p.id })),
        [items]
    );

    const findLabel = (id?: number | null) =>
        id == null ? "" : (items.find((x) => x.id === id)?.nombre ?? "");

    return { items, options, loading, error, findLabel };
}