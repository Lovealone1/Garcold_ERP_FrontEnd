// src/hooks/facturas/useFactura.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import type { SaleInvoiceDTO } from "@/types/sale-invoice";
import { facturaDesdeVenta } from "@/services/sales/facturas.api";

type Opts = { companyId?: number };

export function useFactura(ventaId?: number | null, opts?: Opts) {
    const [data, setData] = useState<SaleInvoiceDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const refresh = useCallback(() => {
        console.debug("[useFactura] refresh()");
        setTick(t => t + 1);
    }, []);

    useEffect(() => {
        console.debug("[useFactura] effect start", { ventaId, companyId: opts?.companyId, tick });

        if (!ventaId) {
            console.warn("[useFactura] sin ventaId -> limpio estado");
            setData(null);
            setError(null);
            setLoading(false);
            return;
        }

        let alive = true;
        setLoading(true);
        setError(null);

        const ts = Date.now();
        console.debug("[useFactura] fetch -> facturaDesdeVenta", { ventaId, companyId: opts?.companyId, ts });

        facturaDesdeVenta(ventaId, { companyId: opts?.companyId, nocacheToken: ts })
            .then(res => {
                if (!alive) return;
                console.debug("[useFactura] OK", {
                    sale_id: res?.sale_id,
                    items: res?.items?.length ?? 0,
                    status: res?.status,
                    total: res?.total,
                });
                setData(res);
            })
            .catch((e: unknown) => {
                if (!alive) return;
                const msg = e instanceof Error ? e.message : "Error cargando factura";
                console.error("[useFactura] ERROR", msg, e);
                setError(msg);
                setData(null);
            })
            .finally(() => {
                if (!alive) return;
                console.debug("[useFactura] finally -> setLoading(false)");
                setLoading(false);
            });

        return () => {
            alive = false;
            console.debug("[useFactura] cleanup");
        };
    }, [ventaId, opts?.companyId, tick]);

    return { data, loading, error, refresh };
}
