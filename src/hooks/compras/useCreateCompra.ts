"use client";

import { useCallback, useState } from "react";
import { createCompra } from "@/services/sales/compras.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { CompraCreate, Compra } from "@/types/compras";

type Options = {
    onSuccess?: (compra: Compra) => void;
    onError?: (e: unknown) => void;
};

export function useCreateCompra(opts: Options = {}) {
    const { success, error: notifyError } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [compra, setCompra] = useState<Compra | null>(null);
    const [error, setError] = useState<unknown>(null);

    const mutate = useCallback(async (payload: CompraCreate) => {
        setLoading(true);
        setError(null);
        try {
            const c = await createCompra(payload);
            setCompra(c);
            success("Compra creada correctamente");
            opts.onSuccess?.(c);
            return c;
        } catch (e: any) {
            const msg = e?.response?.data?.detail ?? "No fue posible crear la compra";
            setError(e);
            notifyError(msg);
            opts.onError?.(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [notifyError, success, opts]);

    const reset = useCallback(() => {
        setCompra(null);
        setError(null);
        setLoading(false);
    }, []);

    return { create: mutate, loading, compra, error, reset };
}
