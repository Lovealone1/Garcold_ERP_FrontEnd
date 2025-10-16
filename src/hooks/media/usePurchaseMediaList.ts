"use client";

import { useState, useCallback } from "react";
import { listPurchaseMedia } from "@/services/sales/media.api";
import type { MediaOutDTO } from "@/types/media";

export function usePurchaseMediaList() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const reset = () => setError(null);

    const fetchPurchaseMedia = useCallback(
        async (purchase_id: number): Promise<MediaOutDTO[]> => {
            setLoading(true);
            setError(null);
            try {
                return await listPurchaseMedia(purchase_id);
            } catch (e) {
                setError(e);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { fetchPurchaseMedia, loading, error, reset };
}
