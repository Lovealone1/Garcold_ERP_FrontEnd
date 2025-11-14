"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createCustomer } from "@/services/sales/customer.api";
import type { Customer, CustomerCreate } from "@/types/customer";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export function useCreateCustomer() {
    const qc = useQueryClient();
    const { success, error: notifyError } = useNotifications();

    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [error, setError] = useState<unknown>(null);

    const create = useCallback(
        async (payload: CustomerCreate) => {
            setLoading(true);
            setError(null);

            try {
                const c = await createCustomer(payload);
                setCustomer(c);

                qc.invalidateQueries({
                    queryKey: ["customers"],
                    refetchType: "active",
                });

                success("Customer created successfully");
                return c;
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail ?? "Unable to create customer";
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
        setCustomer(null);
        setError(null);
        setLoading(false);
    };

    return { create, loading, customer, error, reset };
}