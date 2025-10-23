"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listProfitDetailsBySaleId } from "@/services/sales/profit.api";
import type { ProfitDetail } from "@/types/profit";

type Options = { enabled?: boolean };

export function useProfitDetails(
    saleId: number | null | undefined,
    opts: Options = {}
) {
    const enabled = opts.enabled ?? true;

    const [details, setDetails] = useState<ProfitDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reqSeq = useRef(0);

    const fetchIt = useCallback(async () => {
        if (!enabled || !saleId) {
            setDetails([]);
            setLoading(false);
            setError(null);
            return;
        }

        const seq = ++reqSeq.current;
        setLoading(true);
        setError(null);

        try {
            const data = await listProfitDetailsBySaleId(saleId);
            if (seq === reqSeq.current) setDetails(data);
        } catch (e: any) {
            if (seq === reqSeq.current) {
                setError(e?.message ?? "Failed to load profit details");
                setDetails([]);
            }
        } finally {
            if (seq === reqSeq.current) setLoading(false);
        }
    }, [saleId, enabled]);

    useEffect(() => {
        fetchIt();
        return () => {
            reqSeq.current++;
        };
    }, [fetchIt]);

    return { details, loading, error, refetch: fetchIt };
}
