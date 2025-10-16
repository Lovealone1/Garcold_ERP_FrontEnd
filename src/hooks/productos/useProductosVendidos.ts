"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { productosVendidosEnRango } from "@/services/sales/productos.api";
import type { ProductoVentasDTO } from "@/types/productos";

export type UseProductosVendidosParams = {
    date_from: string | Date;
    date_to: string | Date;
    product_ids: number[];
    enabled?: boolean;       // auto-disparo en cambios
    nocacheToken?: number;   // opcional para forzar no-cache
};

type State = {
    data: ProductoVentasDTO[] | null;
    loading: boolean;
    error: unknown;
    triggeredAt: Date | null;
};

export default function useProductosVendidos({
    date_from,
    date_to,
    product_ids,
    enabled = true,
    nocacheToken,
}: UseProductosVendidosParams) {
    const [state, setState] = useState<State>({
        data: null,
        loading: false,
        error: null,
        triggeredAt: null,
    });

    const isMounted = useRef(true);
    useEffect(() => () => { isMounted.current = false; }, []);

    const fire = useCallback(async () => {
        if (!product_ids?.length) {
            setState((s) => ({ ...s, data: [], loading: false, error: null, triggeredAt: new Date() }));
            return [];
        }
        setState((s) => ({ ...s, loading: true, error: null }));

        try {
            const data = await productosVendidosEnRango(
                { date_from, date_to, product_ids },
                nocacheToken
            );
            if (!isMounted.current) return [];
            setState({ data, loading: false, error: null, triggeredAt: new Date() });
            return data;
        } catch (err) {
            if (!isMounted.current) return [];
            setState((s) => ({ ...s, loading: false, error: err }));
            return [];
        }
    }, [date_from, date_to, JSON.stringify([...product_ids].sort()), nocacheToken]);

    useEffect(() => {
        if (enabled) void fire();
    }, [enabled, fire]);

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        triggeredAt: state.triggeredAt,
        reload: fire,
    };
}
