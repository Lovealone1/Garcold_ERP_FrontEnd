"use client";

import { useCallback, useState } from "react";
import type { CompanyDTO } from "@/types/company";
import { patchCompany, type CompanyPatch } from "@/services/sales/company.api";

type PatchState = {
  loading: boolean;
  error: unknown;
  result: CompanyDTO | null;
};

export function usePatchCompany() {
  const [state, setState] = useState<PatchState>({ loading: false, error: null, result: null });

  const mutate = useCallback(
    async (payload: CompanyPatch, opts?: { onSuccess?: (c: CompanyDTO) => void; onError?: (e: unknown) => void }) => {
      setState({ loading: true, error: null, result: null });
      try {
        const res = await patchCompany(payload);
        setState({ loading: false, error: null, result: res });
        opts?.onSuccess?.(res);
        return res;
      } catch (e) {
        setState({ loading: false, error: e, result: null });
        opts?.onError?.(e);
        throw e;
      }
    },
    []
  );

  return {
    loading: state.loading,
    error: state.error,
    result: state.result,
    mutate,
  };
}
