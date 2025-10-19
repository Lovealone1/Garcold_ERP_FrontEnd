import type {
    FinalReportDTO,
    ARItemDTO, 
    APItemDTO, 
} from "@/types/reporte-general";

const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const fmtFecha = (iso: string) => {
    const [y, m, d] = (iso ?? "").split("-");
    const mm = Math.max(1, Math.min(12, Number(m || 1))) - 1;
    return `${Number(d || 1)} ${MES[mm]} ${y}`;
};

type OrderTok = "balance" | "total" | "date" | "saldo" | "fecha";
const normOrder = (o: OrderTok): "balance" | "total" | "date" =>
    o === "saldo" ? "balance" : o === "fecha" ? "date" : o;

export function buildAccountsReceivableDocs(
    r: FinalReportDTO,
    limit = 50,
    order: OrderTok = "balance"
): ARItemDTO[] {

    const rows: ARItemDTO[] =
        (r as any)?.sales?.accounts_receivable ??
        (r as any)?.ventas?.cuentas_por_cobrar ??
        [];

    const key = normOrder(order);
    const sorted = [...rows].sort((a, b) => {
        if (key === "date") return b.date > a.date ? 1 : b.date < a.date ? -1 : 0;
        if (key === "total") return (b.total ?? 0) - (a.total ?? 0);
        return (b.remaining_balance ?? 0) - (a.remaining_balance ?? 0);
    });

    return sorted.slice(0, Math.max(0, limit));
}

export function buildAccountsPayableDocs(
    r: FinalReportDTO,
    limit = 50,
    order: OrderTok = "balance"
): APItemDTO[] {
    const rows: APItemDTO[] =
        (r as any)?.purchases?.accounts_payable ??
        (r as any)?.compras?.cuentas_por_pagar ??
        [];

    const key = normOrder(order);
    const sorted = [...rows].sort((a, b) => {
        if (key === "date") return b.date > a.date ? 1 : b.date < a.date ? -1 : 0;
        if (key === "total") return (b.total ?? 0) - (a.total ?? 0);
        return (b.balance ?? 0) - (a.balance ?? 0);
    });

    return sorted.slice(0, Math.max(0, limit));
}
