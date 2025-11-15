"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteCustomer } from "@/services/sales/customer.api";
import type { CustomerPage } from "@/types/customer";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { InfiniteData } from "@tanstack/react-query";

export function useDeleteCustomer() {
  const qc = useQueryClient();
  const { success, error: notifyError } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        const res = await deleteCustomer(id);

        qc.setQueriesData<InfiniteData<CustomerPage>>(
          { queryKey: ["customers"] },
          (old) => {
            if (!old) return old;

            const pages = old.pages.map((pg) => ({
              ...pg,
              items: pg.items.filter((c) => c.id !== id),
            }));

            return { ...old, pages };
          }
        );

        qc.invalidateQueries({
          queryKey: ["customers"],
          refetchType: "active",
        });

        success("Customer deleted");
        return res;
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ?? "Unable to delete customer";
        setError(msg);
        notifyError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [qc, success, notifyError]
  );

  return { deleteCustomer: remove, loading, error };
}