"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSupplier } from "@/services/sales/supplier.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { SupplierCreate, Supplier } from "@/types/supplier";

export function useCreateSupplier() {
    const qc = useQueryClient();
    const { success, error: notifyError } = useNotifications();

    const [loading, setLoading] = useState(false);
    const [proveedor, setProveedor] = useState<Supplier | null>(null);
    const [error, setError] = useState<unknown>(null);

    const mutate = useCallback(
        async (payload: SupplierCreate) => {
            setLoading(true);
            setError(null);

            try {
                const s = await createSupplier(payload);

                setProveedor(s);
                success("Proveedor creado correctamente");

                qc.invalidateQueries({
                    queryKey: ["suppliers"],
                    refetchType: "all",
                });

                return s;
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ??
                    "No fue posible crear el proveedor";

                setError(e);
                notifyError(msg);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [qc, success, notifyError]
    );

    const reset = () => {
        setProveedor(null);
        setError(null);
        setLoading(false);
    };

    return {
        create: mutate,
        loading,
        proveedor,
        error,
        reset,
    };
}
