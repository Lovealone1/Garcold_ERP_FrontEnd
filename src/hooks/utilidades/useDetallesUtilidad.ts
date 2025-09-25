"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listDetallesUtilidadByVentaId } from "@/services/sales/utilidades.api";
import type { DetalleUtilidad } from "@/types/utilidades";

type Options = { enabled?: boolean };

export function useDetallesUtilidad(
    ventaId: number | null | undefined,
    opts: Options = {}
) {
    const enabled = opts.enabled ?? true;

    const [detalles, setDetalles] = useState<DetalleUtilidad[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reqSeq = useRef(0);

    const fetchIt = useCallback(async () => {
        if (!enabled || !ventaId) {
            setDetalles([]);
            setLoading(false);
            setError(null);
            return;
        }

        const seq = ++reqSeq.current;
        setLoading(true);
        setError(null);

        try {
            const data = await listDetallesUtilidadByVentaId(ventaId);
            if (seq === reqSeq.current) setDetalles(data);
        } catch (e: any) {
            if (seq === reqSeq.current) {
                setError(e?.message ?? "Error al cargar detalles de utilidad");
                setDetalles([]);
            }
        } finally {
            if (seq === reqSeq.current) setLoading(false);
        }
    }, [ventaId, enabled]);

    useEffect(() => {
        fetchIt();

        return () => {
            reqSeq.current++;
        };
    }, [fetchIt]);

    return { detalles, loading, error, refetch: fetchIt };
}
