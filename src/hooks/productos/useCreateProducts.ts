"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/services/sales/product.api";
import type { ProductDTO, ProductCreate } from "@/types/product";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export function useCreateProduct() {
    const qc = useQueryClient();
    const { success, error: notifyError } = useNotifications();

    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<ProductDTO | null>(null);
    const [error, setError] = useState<unknown>(null);

    const create = useCallback(
        async (payload: ProductCreate) => {
            setLoading(true);
            setError(null);

            try {
                const p = await createProduct(payload);
                setProduct(p);

                qc.invalidateQueries({
                    queryKey: ["products"],
                    refetchType: "active",
                });

                qc.invalidateQueries({
                    queryKey: ["all-products"],
                    refetchType: "active",
                });

                success("Producto creado correctamente");
                return p;
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ?? "No fue posible crear el producto";
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
        setProduct(null);
        setError(null);
        setLoading(false);
    };

    return { create, loading, product, error, reset };
}
