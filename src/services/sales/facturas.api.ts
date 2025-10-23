import api from "../api";
import type { AxiosProgressEvent } from "axios";
import type { SaleInvoiceDTO } from "@/types/sale-invoice";

const API_PREFIX = "/api/v1";
const BASE = (api?.defaults?.baseURL ?? "").replace(/\/+$/g, "");
const HAS_PREFIX_IN_BASE = BASE.endsWith(API_PREFIX);
const prefix = HAS_PREFIX_IN_BASE ? "" : API_PREFIX;
const norm = (path: string) => `${prefix}${path.startsWith("/") ? path : `/${path}`}`;

export function buildFacturaPdfUrl(
    ventaId: number,
    opts?: { companyId?: number; download?: boolean; nocacheToken?: number }
): string {
    const origin =
        (api?.defaults?.baseURL && new URL(api.defaults.baseURL, window.location.origin).toString()) ||
        (typeof window !== "undefined" ? window.location.origin : "");
    const u = new URL(norm(`/invoices/sales/${ventaId}/pdf`), origin);
    if (opts?.companyId) u.searchParams.set("company_id", String(opts.companyId));
    u.searchParams.set("download", (opts?.download ?? true) ? "1" : "0");
    u.searchParams.set("_ts", String(opts?.nocacheToken ?? Date.now()));
    return u.toString();
}
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

export async function facturaDesdeVenta(
    ventaId: number,
    opts?: { companyId?: number; nocacheToken?: number }
): Promise<SaleInvoiceDTO> {
    const { data } = await api.get(norm(`/invoices/from-sale/${ventaId}`), {
        params: {
            company_id: opts?.companyId,
            _ts: opts?.nocacheToken ?? Date.now(),
        },
        headers: { "Cache-Control": "no-cache" },
    });
    console.log(data)
    return data as SaleInvoiceDTO;
}

export function abrirFacturaPdf(
    ventaId: number,
    opts?: { companyId?: number; download?: boolean; nocacheToken?: number }
): void {
    window.open(buildFacturaPdfUrl(ventaId, opts), "_blank", "noopener,noreferrer");
}

export async function descargarFacturaPdf(
    ventaId: number,
    opts?: {
        companyId?: number;
        nocacheToken?: number;
        onProgress?: (pct: number, loaded: number, total?: number) => void;
        filename?: string;
    }
): Promise<void> {
    const res = await api.get(norm(`/invoices/sales/${ventaId}/pdf`), {
        params: {
            company_id: opts?.companyId,
            download: true,
            _ts: opts?.nocacheToken ?? Date.now(),
        },
        responseType: "blob",
        onDownloadProgress: (e: AxiosProgressEvent) => {
            const total = e.total ?? undefined;
            const loaded = e.loaded ?? 0;
            const pct = total ? Math.round((loaded / total) * 100) : NaN;
            opts?.onProgress?.(pct, loaded, total);
        },
    });

    const cd = String(res.headers?.["content-disposition"] ?? "");
    const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)?/i);
    const filename =
        opts?.filename ?? (match?.[1] ? decodeURIComponent(match[1]) : `invoice_${ventaId}.pdf`);

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
