"use client";
import { useCallback, useState } from "react";
import type { Investment } from "@/types/investment";
import type { InvestmentAddBalanceIn } from "@/types/investment";
import { addInvestmentBalance } from "@/services/sales/investment.api";

export function useAddInversionBalance() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Investment | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const run = useCallback(async (payload: InvestmentAddBalanceIn) => {
        setLoading(true);
        setError(null);
        try {
            const res = await addInvestmentBalance(payload);
            setData(res);
            return res;
        } catch (e) {
            const err = e instanceof Error ? e : new Error("Failed to add investment balance");
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