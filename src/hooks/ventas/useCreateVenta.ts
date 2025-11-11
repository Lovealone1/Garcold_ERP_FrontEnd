// useCreateVenta.ts
"use client";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSale } from "@/services/sales/sale.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { SaleCreate, Sale } from "@/types/sale";

type Options = {
    onSuccess?: (sale: Sale) => void;
    onError?: (e: unknown) => void;
};

export function useCreateVenta(opts: Options = {}) {
    const qc = useQueryClient();
    const { success, error: notifyError } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [venta, setVenta] = useState<Sale | null>(null);
    const [error, setError] = useState<unknown>(null);

    const mutate = useCallback(
        async (payload: SaleCreate, saleDate?: Date | string) => {
            setLoading(true);
            setError(null);
            try {
                const v = await createSale(
                    saleDate ? { ...payload, sale_date: saleDate } : payload
                );

                setVenta(v);
                success("Venta creada correctamente");

                qc.invalidateQueries({
                    queryKey: ["sales"],
                    refetchType: "all", 
                });

                opts.onSuccess?.(v);
                return v;
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ?? "No fue posible crear la venta";
                setError(e);
                notifyError(msg);
                opts.onError?.(e);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [qc, success, notifyError, opts]
    );

    const reset = () => {
        setVenta(null);
        setError(null);
        setLoading(false);
    };

    return { create: mutate, loading, venta, error, reset };
}
