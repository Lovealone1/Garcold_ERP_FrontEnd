import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReporteGeneral } from "@/services/sales/reporte-general.api";
import type { ReporteFinalDTO, SolicitudMetaDTO } from "@/types/reporte-general";


export function useReporteGeneral(
    initialParams?: SolicitudMetaDTO,
    { auto = true }: { auto?: boolean } = {}
) {
    const [params, setParams] = useState<SolicitudMetaDTO | undefined>(initialParams);
    const [data, setData] = useState<ReporteFinalDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    const refetch = useCallback(
        async (override?: SolicitudMetaDTO) => {
            const payload = override ?? params;
            if (!payload) return;

            // cancelar petición anterior si sigue viva
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoading(true);
            setError(null);

            try {
                const resp = await fetchReporteGeneral(payload, Date.now());
                if (!mountedRef.current || controller.signal.aborted) return;
                setData(resp);
                setLastUpdated(Date.now());
            } catch (err) {
                if (!mountedRef.current || (err as any)?.name === "CanceledError") return;
                setError(err);
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        },
        [params]
    );

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (auto && params) void refetch();
    }, [auto, params, refetch]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        params,
        setParams, // para actualizar los filtros (bucket, month, year, etc.)
        refetch,   // para ejecutar manualmente con los params actuales o override
    };
}

export default useReporteGeneral;
