"use client";

import { useState, useCallback } from "react";
import { uploadPurchaseFiles } from "@/services/sales/media.api";
import type { MediaOutDTO } from "@/types/media";

export function usePurchaseMediaUpload() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const reset = () => setError(null);

    const uploadPurchaseFilesFn = useCallback(
        async (p: { purchase_id: number; files: File[] }): Promise<MediaOutDTO[]> => {
            setLoading(true);
            setError(null);
            try {
                return await uploadPurchaseFiles(p);
            } catch (e) {
                setError(e);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { uploadPurchaseFiles: uploadPurchaseFilesFn, loading, error, reset };
}
