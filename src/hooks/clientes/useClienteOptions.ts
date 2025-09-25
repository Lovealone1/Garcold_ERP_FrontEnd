// hooks/clientes/useClienteOptions.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { listClientesAll } from "@/services/sales/clientes.api";
import type { ClienteLite } from "@/types/clientes";

export type ClienteOption = { label: string; value: number };

export function useClienteOptions(nocacheToken?: number) {
    const [items, setItems] = useState<ClienteLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        listClientesAll(nocacheToken)
            .then((data) => { if (alive) setItems(data || []); })
            .catch((e: any) => {
                if (alive) setError(e?.response?.data?.detail ?? e?.message ?? "Error cargando clientes");
            })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [nocacheToken]);

    const options: ClienteOption[] = useMemo(
        () => items.map((c) => ({ label: c.nombre, value: c.id })),
        [items]
    );

    const findLabel = (id?: number | null) =>
        id == null ? "" : (items.find((x) => x.id === id)?.nombre ?? "");

    return { items, options, loading, error, findLabel };
}
