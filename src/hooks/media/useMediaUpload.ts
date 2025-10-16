"use client";

import { useState, useCallback } from "react";
import { uploadProductFiles } from "@/services/sales/media.api";
import type { MediaOutDTO } from "@/types/media";

function isCanceled(err: any): boolean {
  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    err?.message === "canceled"
  );
}

export function useMediaUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const reset = () => setError(null);

  const uploadProductFilesFn = useCallback(
    async (p: { product_id: number; files: File[] }): Promise<MediaOutDTO[]> => {
      setLoading(true);
      setError(null);
      try {
        return await uploadProductFiles(p);
      } catch (e) {
        if (isCanceled(e)) return []; // silenciar cancelaciones
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { uploadProductFiles: uploadProductFilesFn, loading, error, reset };
}
