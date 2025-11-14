// src/hooks/proveedores/useDeleteSupplier.ts
"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteSupplier } from "@/services/sales/supplier.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export function useDeleteSupplier() {
  const qc = useQueryClient();
  const { success, error: notifyError } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleDelete = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        const res = await deleteSupplier(id, { nocacheToken: Date.now() });

        success("Proveedor eliminado correctamente");

        qc.invalidateQueries({
          queryKey: ["suppliers"],
          refetchType: "all",
        });

        return res;
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ??
          e?.message ??
          "No fue posible eliminar el proveedor";

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
    setError(null);
    setLoading(false);
  };

  return { deleteSupplier: handleDelete, loading, error, reset };
}
