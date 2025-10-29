"use client";
import { useCallback, useState } from "react";
import type { Loan } from "@/types/loan";
import type { LoanApplyPaymentIn } from "@/types/loan";
import { applyLoanPayment } from "@/services/sales/loan.api";

type ApplyPaymentResult = Loan | { deleted: true; loan_id: number };

export function useApplyLoanPayment() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ApplyPaymentResult | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const run = useCallback(async (payload: LoanApplyPaymentIn) => {
        setLoading(true);
        setError(null);
        try {
            const res = await applyLoanPayment(payload);
            setData(res);
            return res;
        } catch (e) {
            const err = e instanceof Error ? e : new Error("Failed to apply loan payment");
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    return { run, loading, data, error, reset };
}