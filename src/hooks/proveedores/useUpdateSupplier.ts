"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateSupplier } from "@/services/sales/supplier.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { SupplierUpdate, Supplier } from "@/types/supplier";

export function useUpdateSupplier() {
    const qc = useQueryClient();
    const { success, error: notifyError } = useNotifications();

    const [loading, setLoading] = useState(false);
    const [proveedor, setProveedor] = useState<Supplier | null>(null);
    const [error, setError] = useState<unknown>(null);

    const mutate = useCallback(
        async (id: number, payload: SupplierUpdate) => {
            setLoading(true);
            setError(null);

            try {
                const s = await updateSupplier(id, payload, {
                    nocacheToken: Date.now(),
                });

                setProveedor(s);
                success("Proveedor actualizado correctamente");

                qc.invalidateQueries({
                    queryKey: ["suppliers"],
                    refetchType: "active",
                });

                return s;
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ??
                    e?.message ??
                    "No fue posible actualizar el proveedor";

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
        update: mutate,
        loading,
        proveedor,
        error,
        reset,
    };
}
