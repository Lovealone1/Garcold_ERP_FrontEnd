"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateProduct } from "@/services/sales/product.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { ProductUpdate, ProductDTO } from "@/types/product";

export function useUpdateProduct() {
    const qc = useQueryClient();
    const { success, error: notifyError } = useNotifications();

    const [loading, setLoading] = useState(false);
    const [producto, setProducto] = useState<ProductDTO | null>(null);
    const [error, setError] = useState<unknown>(null);

    const mutate = useCallback(
        async (id: number, payload: ProductUpdate) => {
            setLoading(true);
            setError(null);

            try {
                const p = await updateProduct(id, payload, {
                    nocacheToken: Date.now(),
                });

                setProducto(p);
                success("Producto actualizado correctamente");

                qc.invalidateQueries({
                    queryKey: ["products"],
                    refetchType: "active",
                });

                qc.invalidateQueries({
                    queryKey: ["all-products"],
                    refetchType: "active",
                });

                return p;
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ??
                    e?.message ??
                    "No fue posible actualizar el producto";

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
        setProducto(null);
        setError(null);
        setLoading(false);
    };

    return {
        update: mutate,
        loading,
        producto,
        error,
        reset,
    };
}
