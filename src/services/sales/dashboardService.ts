// services/dashboardService.ts
import salesApi from "../salesApi";
import type { FinalReportDTO, RequestMetaDTO } from "@/types/reporte-general";

function compact<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const k in obj) {
    const v = obj[k];
    if (v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "")) out[k] = v;
  }
  return out as T;
}

export async function fetchFinalDashboard(
  payload: RequestMetaDTO,
  opts?: { topLimit?: number; nocacheToken?: number; signal?: AbortSignal }
): Promise<FinalReportDTO> {
  const body = { payload: compact(payload) };
  const { data } = await salesApi.post("/dashboard", body, {
    params: { top_limit: opts?.topLimit ?? 10, _ts: opts?.nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
    signal: opts?.signal, // Axios v1 soporta AbortController
  });
  return data as FinalReportDTO;
}
