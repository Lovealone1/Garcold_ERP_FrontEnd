"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "@/services/sales/product.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export function useDeleteProducto() {
  const qc = useQueryClient();
  const { success, error: notifyError } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleDelete = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        const res = await deleteProduct(id);

        qc.invalidateQueries({
          queryKey: ["products"],
          refetchType: "active",
        });

        qc.invalidateQueries({
          queryKey: ["all-products"],
          refetchType: "active",
        });

        success("Producto eliminado correctamente");
        return res;
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ?? "Error eliminando producto";
        setError(e);
        notifyError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [qc, success, notifyError]
  );

  return { deleteProducto: handleDelete, loading, error };
}
