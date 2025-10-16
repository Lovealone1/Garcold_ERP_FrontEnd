// src/services/sales/facturas.api.ts
import salesApi from "../salesApi";
import api from "../api";
import type { VentaFacturaDTO } from "@/types/factura";

/* Resolver base + prefijo tal como hace salesApi */
const SALES_PREFIX = "/sales-api/v1";
const BASE = (api?.defaults?.baseURL ?? "").replace(/\/+$/g, "");
const HAS_PREFIX_IN_BASE = BASE.endsWith(SALES_PREFIX);
const prefix = HAS_PREFIX_IN_BASE ? "" : SALES_PREFIX;
const norm = (path: string) => `${prefix}${path.startsWith("/") ? path : `/${path}`}`;

/** URL absoluta del PDF en backend */
export function buildFacturaPdfUrl(
    ventaId: number,
    opts?: { companyId?: number; download?: boolean; nocacheToken?: number }
): string {
    const origin =
        (api?.defaults?.baseURL && new URL(api.defaults.baseURL, window.location.origin).toString()) ||
        (typeof window !== "undefined" ? window.location.origin : "");
    const u = new URL(norm(`/facturas/ventas/${ventaId}/pdf`), origin);
    if (opts?.companyId) u.searchParams.set("company_id", String(opts.companyId));
    u.searchParams.set("download", (opts?.download ?? true) ? "1" : "0");
    u.searchParams.set("_ts", String(opts?.nocacheToken ?? Date.now()));
    return u.toString();
}

/** URL del preview limpio (ruta (print) del front) */
export function buildFacturaPreviewUrl(
    ventaId: number,
    opts?: { companyId?: number; nocacheToken?: number }
): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const u = new URL(`/comercial/ventas/facturas/${ventaId}`, origin);
    u.searchParams.set("print", "1");
    u.searchParams.set("embed", "1");
    if (opts?.companyId) u.searchParams.set("company_id", String(opts.companyId));
    u.searchParams.set("_ts", String(opts?.nocacheToken ?? Date.now()));
    return u.toString();
}

/** JSON con los datos de la factura (lo usa el hook) */
export async function facturaDesdeVenta(
    ventaId: number,
    opts?: { companyId?: number; nocacheToken?: number }
): Promise<VentaFacturaDTO> {
    const { data } = await salesApi.post(
        `/facturas/ventas/${ventaId}`,
        null,
        {
            params: {
                company_id: opts?.companyId,
                _ts: opts?.nocacheToken ?? Date.now(),
            },
            headers: { "Cache-Control": "no-cache" },
        }
    );
    return data as VentaFacturaDTO;
}

/** Abrir/descargar PDF en nueva pestaña (el navegador decide) */
export function abrirFacturaPdf(
    ventaId: number,
    opts?: { companyId?: number; download?: boolean; nocacheToken?: number }
): void {
    window.open(buildFacturaPdfUrl(ventaId, opts), "_blank", "noopener,noreferrer");
}

/** Descarga forzada del PDF (sin pop-up blockers) */
export async function descargarFacturaPdf(
    ventaId: number,
    opts?: {
        companyId?: number;
        nocacheToken?: number;
        onProgress?: (pct: number, loaded: number, total?: number) => void;
        filename?: string;
    }
): Promise<void> {
    const res = await salesApi.get(`/facturas/ventas/${ventaId}/pdf`, {
        params: {
            company_id: opts?.companyId,
            download: true,
            _ts: opts?.nocacheToken ?? Date.now(),
        },
        responseType: "blob",
        onDownloadProgress: (e: ProgressEvent) => {
            const total = e.total ?? undefined;           // requiere Content-Length
            const pct = total ? Math.round((e.loaded / total) * 100) : NaN;
            opts?.onProgress?.(pct, e.loaded, total);
        },
    });

    // intenta usar el nombre del header
    const cd = String(res.headers?.["content-disposition"] ?? "");
    const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)?/i);
    const filename =
        opts?.filename ??
        (match?.[1] ? decodeURIComponent(match[1]) : `factura_${ventaId}.pdf`);

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}