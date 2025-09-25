import { useEffect, useState, useCallback } from "react";
import { getUtilidadByVentaId } from "@/services/sales/utilidades.api";
import type { Utilidad } from "@/types/utilidades";

export function useUtilidad(ventaId: number | null) {
    const [utilidad, setUtilidad] = useState<Utilidad | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIt = useCallback(async () => {
        if (!ventaId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getUtilidadByVentaId(ventaId);
            setUtilidad(data);
        } catch (e: any) {
            setError(e?.message ?? "Error al cargar utilidad");
        } finally {
            setLoading(false);
        }
    }, [ventaId]);

    useEffect(() => { fetchIt(); }, [fetchIt]);

    return { utilidad, loading, error, refetch: fetchIt };
}
