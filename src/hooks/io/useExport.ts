"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    exportAny,
    downloadExport,
    type Entity,
    type Fmt,
} from "@/services/sales/export.api";

type State = { loading: boolean; error: Error | null; blob: Blob | null };

export function useExport() {
    const [state, setState] = useState<State>({
        loading: false,
        error: null,
        blob: null,
    });

    const abortRef = useRef<AbortController | null>(null);
    const mounted = useRef(true);

    useEffect(() => {
        return () => {
            mounted.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const exportBlob = useCallback(
        async (entity: Entity, fmt: Fmt = "csv") => {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;

            setState({ loading: true, error: null, blob: null });

            try {
                const blob = await exportAny(entity, fmt, Date.now(), ctrl.signal);
                if (!mounted.current) return null;
                setState({ loading: false, error: null, blob });
                return blob;
            } catch (e: any) {
                if (!mounted.current) return null;
                setState({ loading: false, error: e, blob: null });
                return null;
            }
        },
        []
    );

    const download = useCallback(
        async (entity: Entity, fmt: Fmt = "csv", filename?: string) => {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;

            setState((s) => ({ ...s, loading: true, error: null }));

            try {
                await downloadExport(entity, fmt, filename, Date.now(), ctrl.signal);
                if (!mounted.current) return false;
                setState((s) => ({ ...s, loading: false }));
                return true;
            } catch (e: any) {
                if (!mounted.current) return false;
                setState((s) => ({ ...s, loading: false, error: e }));
                return false;
            }
        },
        []
    );

    const reset = useCallback(
        () =>
            setState({
                loading: false,
                error: null,
                blob: null,
            }),
        []
    );

    return {
        exportBlob,
        download,
        ...state,
        reset,
        cancel: () => abortRef.current?.abort(),
    };
}
