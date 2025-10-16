import salesApi from "../salesApi";
import type { ReporteFinalDTO, SolicitudMetaDTO } from "@/types/reporte-general";

function compact<T extends Record<string, any>>(obj: T): T {
    const out: Record<string, any> = {};
    for (const k in obj) {
        const v = obj[k];
        if (v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "")) out[k] = v;
    }
    return out as T;
}

export async function fetchReporteGeneral(
    payload: SolicitudMetaDTO,
    nocacheToken?: number
): Promise<ReporteFinalDTO> {
    const body = compact(payload);
    const { data } = await salesApi.post("/reportes/general", body, {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as ReporteFinalDTO;
}
