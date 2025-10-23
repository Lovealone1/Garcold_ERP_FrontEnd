import {
    FinalReportDTO,
    Granularity,
    SegmentMetaDTO,
    SalesSeriesItemDTO,
    PurchasesSeriesItemDTO,
    ExpensesSeriesItemDTO,
    ProfitSeriesItemDTO,
} from "@/types/reporte-general";

export type ChartSalesPoint = SalesSeriesItemDTO & { label: string };
export type ChartPurchasesPoint = PurchasesSeriesItemDTO & { label: string };
export type ChartExpensesPoint = ExpensesSeriesItemDTO & { label: string };
export type ChartProfitPoint = ProfitSeriesItemDTO & { label: string };

export type SalesIntervalBundle = { meta: SegmentMetaDTO; data: ChartSalesPoint[] };
export type PurchasesIntervalBundle = { meta: SegmentMetaDTO; data: ChartPurchasesPoint[] };
export type ExpensesIntervalBundle = { meta: SegmentMetaDTO; data: ChartExpensesPoint[] };
export type ProfitIntervalBundle = { meta: SegmentMetaDTO; data: ChartProfitPoint[] };

export type VentasIntervalBundle = SalesIntervalBundle;
export type ComprasIntervalBundle = PurchasesIntervalBundle;
export type GastosIntervalBundle = ExpensesIntervalBundle;
export type UtilidadIntervalBundle = ProfitIntervalBundle;

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function makeLabel(date: string, gran: Granularity): string {
    if (gran === "year") return date.slice(0, 4); // "2025"
    if (gran === "month") {
        const [y, m] = date.split("-");
        const mm = Math.max(1, Math.min(12, Number(m || 1)));
        return `${MES_CORTO[mm - 1]} ${y}`;
    }
    // day -> "DD/MM"
    const [, m, d] = date.split("-");
    return `${(d ?? "01").padStart(2, "0")}/${(m ?? "01").padStart(2, "0")}`;
}

// ---- builders ----
export function buildSalesIntervals(r: FinalReportDTO): SalesIntervalBundle {
    const { meta, series } = r.sales.series;
    const gran = meta.granularity;
    const data: ChartSalesPoint[] = series.map(s => ({ ...s, label: makeLabel(s.date, gran) }));
    return { meta, data };
}

export function buildPurchasesIntervals(r: FinalReportDTO): PurchasesIntervalBundle {
    const { meta, series } = r.purchases.series;
    const gran = meta.granularity;
    const data: ChartPurchasesPoint[] = series.map(s => ({ ...s, label: makeLabel(s.date, gran) }));
    return { meta, data };
}

export function buildExpensesIntervals(r: FinalReportDTO): ExpensesIntervalBundle {
    const { meta, series } = r.expenses.series;
    const gran = meta.granularity;
    const data: ChartExpensesPoint[] = series.map(s => ({ ...s, label: makeLabel(s.date, gran) }));
    return { meta, data };
}

export function buildProfitIntervals(r: FinalReportDTO): ProfitIntervalBundle {
    const { meta, series } = r.profit.series;
    const gran = meta.granularity;
    const data: ChartProfitPoint[] = series.map(s => ({ ...s, label: makeLabel(s.date, gran) }));
    return { meta, data };
}

// Paquete único
export function buildIntervals(report: FinalReportDTO) {
    return {
        sales: buildSalesIntervals(report),
        purchases: buildPurchasesIntervals(report),
        profit: buildProfitIntervals(report),
        expenses: buildExpensesIntervals(report),
    };
}

// Aliases de función para código legado
export const buildVentasIntervalos = buildSalesIntervals;
export const buildComprasIntervalos = buildPurchasesIntervals;
export const buildGastosIntervalos = buildExpensesIntervals;
export const buildUtilidadIntervalos = buildProfitIntervals;
