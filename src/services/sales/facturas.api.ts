import api from "../api";
import type { AxiosProgressEvent } from "axios";
import type { SaleInvoiceDTO } from "@/types/sale-invoice";

const API_PREFIX = "/api/v1";
const BASE = (api?.defaults?.baseURL ?? "").replace(/\/+$/g, "");
const HAS_PREFIX_IN_BASE = BASE.endsWith(API_PREFIX);
const prefix = HAS_PREFIX_IN_BASE ? "" : API_PREFIX;
const norm = (path: string) => `${prefix}${path.startsWith("/") ? path : `/${path}`}`;

// Util: origen seguro en browser o SSR
function getOrigin(): string {
    if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    // En SSR: si baseURL es absoluta, úsala; si no, deja vacío y deja que URL resuelva relativo
    try {
        if (BASE) {
            const u = new URL(BASE, "http://localhost"); // base para validar
            if (u.protocol === "http:" || u.protocol === "https:") {
                return `${u.protocol}//${u.host}`;
            }
        }
    } catch { }
    return "";
}

// Util: construye URL absoluta a endpoint API respetando baseURL y prefix
function buildApiUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
    // Si BASE es absoluto, úsalo como base; si no, cae al origin calculado
    const baseForUrl = (() => {
        try {
            if (BASE) {
                const u = new URL(BASE, getOrigin() || "http://localhost");
                return u.toString();
            }
        } catch { }
        return getOrigin();
    })();

    const u = new URL(norm(path), baseForUrl || undefined);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
        });
    }
    return u.toString();
}

// Util: filename robusto desde content-disposition
function pickFilenameFromContentDisposition(cdHeader: string | undefined, fallback: string) {
    const cd = cdHeader ?? "";
    // filename*=UTF-8''... tiene prioridad
    const star = cd.match(/filename\*\s*=\s*([^;]+)/i);
    if (star?.[1]) {
        let v = star[1].trim();
        // Quita comillas si vienen
        v = v.replace(/^UTF-8''/i, "");
        try {
            return decodeURIComponent(v.replace(/^"+|"+$/g, ""));
        } catch {
            return v.replace(/^"+|"+$/g, "");
        }
    }
    // filename="..."
    const quoted = cd.match(/filename\s*=\s*"([^"]+)"/i);
    if (quoted?.[1]) return quoted[1];
    // filename=simple
    const simple = cd.match(/filename\s*=\s*([^;]+)/i);
    if (simple?.[1]) return simple[1].trim().replace(/^"+|"+$/g, "");
    return fallback;
}

export function buildFacturaPdfUrl(
    ventaId: number,
    opts?: { companyId?: number; download?: boolean; nocacheToken?: number }
): string {
    return buildApiUrl(`/invoices/sales/${ventaId}/pdf`, {
        company_id: opts?.companyId,
        download: (opts?.download ?? true) ? 1 : 0,
        _ts: opts?.nocacheToken ?? Date.now(),
    });
}

export function buildFacturaPreviewUrl(
    ventaId: number,
    opts?: { companyId?: number; nocacheToken?: number }
): string {
    const u = new URL(`/comercial/ventas/facturas/${ventaId}`, getOrigin() || undefined);
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
        params: { company_id: opts?.companyId, _ts: opts?.nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as SaleInvoiceDTO;
}

export function abrirFacturaPdf(
    ventaId: number,
    opts?: { companyId?: number; download?: boolean; nocacheToken?: number }
): void {
    const href = buildFacturaPdfUrl(ventaId, opts);
    if (typeof window !== "undefined") window.open(href, "_blank", "noopener,noreferrer");
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
        params: { company_id: opts?.companyId, download: true, _ts: opts?.nocacheToken ?? Date.now() },
        responseType: "blob",
        headers: { Accept: "application/pdf" },
        onDownloadProgress: (e: AxiosProgressEvent) => {
            const total = e.total ?? undefined;
            const loaded = e.loaded ?? 0;
            const pct = total ? Math.round((loaded / total) * 100) : NaN;
            opts?.onProgress?.(pct, loaded, total);
        },
    });

    const filename = pickFilenameFromContentDisposition(
        res.headers?.["content-disposition"] as string | undefined,
        opts?.filename ?? `invoice_${ventaId}.pdf`
    );

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
