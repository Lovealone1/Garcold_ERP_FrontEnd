"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createCustomerSimplePayment } from "@/services/sales/customer.api";
import type { CustomerStandalonePaymentIn } from "@/types/customer";

type Options = {
    onError?: (err: unknown) => void;
    autoResetMs?: number;
};

export type UseCustomerSimplePayment = {
    run: (payload: CustomerStandalonePaymentIn) => Promise<boolean>;
    loading: boolean;
    error: unknown | null;
    success: boolean;
    reset: () => void;
};

export function useCustomerSimplePayment(
    customerId: number,
    opts?: Options
): UseCustomerSimplePayment {
    const qc = useQueryClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown | null>(null);
    const [success, setSuccess] = useState(false);

    const mounted = useRef(true);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            mounted.current = false;
            if (timer.current) window.clearTimeout(timer.current);
        };
    }, []);

    const reset = useCallback(() => {
        if (!mounted.current) return;
        setLoading(false);
        setError(null);
        setSuccess(false);
    }, []);

    const run = useCallback(
        async (payload: CustomerStandalonePaymentIn): Promise<boolean> => {
            if (loading) return false;

            setLoading(true);
            setError(null);
            setSuccess(false);

            try {
                const ok = await createCustomerSimplePayment(customerId, payload);

                if (!mounted.current) return false;

                setSuccess(ok);

                if (ok) {
                    qc.invalidateQueries({
                        queryKey: ["customers"],
                        refetchType: "active",
                    });

                    qc.invalidateQueries({
                        predicate: ({ queryKey }) =>
                            Array.isArray(queryKey) && queryKey[0] === "transactions",
                        refetchType: "active",
                    });

                    qc.invalidateQueries({
                        predicate: ({ queryKey }) =>
                            Array.isArray(queryKey) && queryKey[0] === "banks",
                        refetchType: "active",
                    });

                    qc.invalidateQueries({
                        queryKey: ["customer", { id: customerId }],
                        refetchType: "active",
                    });
                }

                if (ok && opts?.autoResetMs && opts.autoResetMs > 0) {
                    timer.current = window.setTimeout(() => {
                        if (mounted.current) reset();
                    }, opts.autoResetMs) as any;
                }

                return ok;
            } catch (err) {
                if (!mounted.current) return false;

                setError(err);
                opts?.onError?.(err);
                return false;
            } finally {
                if (mounted.current) setLoading(false);
            }
        },
        [customerId, loading, opts, reset, qc]
    );

    return { run, loading, error, success, reset };
}