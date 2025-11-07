import { useEffect, useState, useCallback } from "react";
import { getProfitBySaleId } from "@/services/sales/profit.api";
import type { Profit } from "@/types/profit";

export function useProfit(saleId: number | null | undefined) {
    const [profit, setProfit] = useState<Profit | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIt = useCallback(async () => {
        if (!saleId) {
            setProfit(null);
            setLoading(false);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getProfitBySaleId(saleId);
            setProfit(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load profit");
            setProfit(null);
        } finally {
            setLoading(false);
        }
    }, [saleId]);

    useEffect(() => { fetchIt(); }, [fetchIt]);

    return { profit, loading, error, refetch: fetchIt };
}
