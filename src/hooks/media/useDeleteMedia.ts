"use client";

import { useState, useCallback } from "react";
import { deleteMedia } from "@/services/sales/media.api";

export function useDeleteMedia() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const reset = () => setError(null);

    const deleteMediaFn = useCallback(async (media_id: number): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await deleteMedia(media_id);
        } catch (e) {
            setError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    return { deleteMedia: deleteMediaFn, loading, error, reset };
}
