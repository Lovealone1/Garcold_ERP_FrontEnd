// src/builders/cuentas.ts
import type {
    ReporteFinalDTO,
    CXCItemDTO,   // cuentas por cobrar
    CXPItemDTO,   // cuentas por pagar
} from "@/types/reporte-general";

const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const fmtFecha = (iso: string) => {
    const [y, m, d] = (iso ?? "").split("-");
    const mm = Math.max(1, Math.min(12, Number(m || 1))) - 1;
    return `${Number(d || 1)} ${MES[mm]} ${y}`;
};

/* ---- Cuentas por cobrar: documentos ---- */
export function buildCxcDocs(
    r: ReporteFinalDTO,
    limit = 50,
    order: "saldo" | "total" | "fecha" = "saldo"
): CXCItemDTO[] {
    const rows = r?.ventas?.cuentas_por_cobrar ?? [];
    const sorted = [...rows].sort((a, b) => {
        if (order === "fecha") return (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0);
        if (order === "total") return (b.total ?? 0) - (a.total ?? 0);
        return (b.saldo_restante ?? 0) - (a.saldo_restante ?? 0);
    });
    return sorted.slice(0, Math.max(0, limit));
}

/* ---- Cuentas por pagar: documentos ---- */
export function buildCxpDocs(
    r: ReporteFinalDTO,
    limit = 50,
    order: "saldo" | "total" | "fecha" = "saldo"
): CXPItemDTO[] {
    const rows = r?.compras?.cuentas_por_pagar ?? [];
    const sorted = [...rows].sort((a, b) => {
        if (order === "fecha") return (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0);
        if (order === "total") return (b.total ?? 0) - (a.total ?? 0);
        return (b.saldo ?? 0) - (a.saldo ?? 0);
    });
    return sorted.slice(0, Math.max(0, limit));
}
