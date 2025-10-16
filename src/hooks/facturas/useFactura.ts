// src/hooks/facturas/useFactura.ts
"use client";
import { useEffect, useState } from "react";
import type { VentaFacturaDTO } from "@/types/factura";
import { facturaDesdeVenta } from "@/services/sales/facturas.api";

export function useFactura(ventaId: number | null) {
    const [data, setData] = useState<VentaFacturaDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        if (!ventaId) return;
        let alive = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await facturaDesdeVenta(ventaId, { nocacheToken: Date.now() });
                if (!alive) return;
                setData(res);
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "Error cargando factura");
                setData(null);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [ventaId, tick]);

    return { data, loading, error, refresh };
}
