"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateCustomer } from "@/services/sales/customer.api";
import type { Customer, CustomerUpdate } from "@/types/customer";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export function useUpdateCustomer(customerId: number | null) {
    const qc = useQueryClient();
    const { success, error: notifyError } = useNotifications();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const update = useCallback(
        async (payload: CustomerUpdate) => {
            if (!customerId) return;

            setLoading(true);
            setError(null);

            try {
                const updated = await updateCustomer(customerId, payload);

                qc.setQueriesData(
                    { queryKey: ["customers"] },
                    (curr: any) => {
                        if (!curr) return curr;

                        const pages = curr.pages.map((pg: any) => ({
                            ...pg,
                            items: pg.items.map((c: Customer) =>
                                c.id === updated.id ? { ...c, ...updated } : c
                            ),
                        }));

                        return { ...curr, pages };
                    }
                );

                qc.invalidateQueries({
                    queryKey: ["customers"],
                    refetchType: "active",
                });

                success("Customer updated successfully");
                return updated;
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ?? "Unable to update customer";
                setError(e);
                notifyError(msg);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [customerId, qc, success, notifyError]
    );

    return { update, loading, error };
}