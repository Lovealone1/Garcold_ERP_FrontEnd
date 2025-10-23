"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { importInsert, type ImportOptions, type ImportReport } from "@/services/sales/import.api";

type State<T> = { loading: boolean; error: Error | null; data: T | null };

export function useImport() {
    const [state, setState] = useState<State<ImportReport>>({ loading: false, error: null, data: null });
    const abortRef = useRef<AbortController | null>(null);
    const mounted = useRef(true);

    useEffect(() => {
        return () => {
            mounted.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const run = useCallback(async (opts: ImportOptions) => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setState({ loading: true, error: null, data: null });
        try {
            const data = await importInsert({ ...opts, signal: ctrl.signal, _ts: Date.now() });
            if (mounted.current) setState({ loading: false, error: null, data });
            return data;
        } catch (e: any) {
            if (mounted.current) setState({ loading: false, error: e, data: null });
            throw e;
        }
    }, []);

    const reset = useCallback(() => setState({ loading: false, error: null, data: null }), []);

    return {
        importFile: run,
        ...state,
        reset,
        cancel: () => abortRef.current?.abort(),
    };
}
