"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CompanyDTO } from "@/types/company";
import { getCompany } from "@/services/sales/company.api";

type State = {
  data: CompanyDTO | null;
  loading: boolean;
  error: unknown;
};

export function useCompany(opts?: { auto?: boolean; nocacheToken?: number }) {
  const { auto = true, nocacheToken } = opts ?? {};
  const [state, setState] = useState<State>({ data: null, loading: !!auto, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (token?: number) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await getCompany(token ?? nocacheToken);
      if (!ac.signal.aborted) setState({ data, loading: false, error: null });
    } catch (e) {
      if (!ac.signal.aborted) setState(s => ({ ...s, loading: false, error: e }));
    }
  }, [nocacheToken]);

  useEffect(() => {
    if (auto) load();
    return () => abortRef.current?.abort();
  }, [auto, load]);

  const reload = useCallback(() => load(Date.now()), [load]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    reload,
    setLocal: (updater: (prev: CompanyDTO | null) => CompanyDTO) =>
      setState(s => ({ ...s, data: updater(s.data) })),
  };
}
