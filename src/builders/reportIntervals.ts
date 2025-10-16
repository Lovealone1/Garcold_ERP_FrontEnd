// src/builders/reportIntervals.ts
import { VentasSerieItemDTO, ComprasSerieItemDTO, UtilidadSerieItemDTO, SegmentosMetaDTO, Granularity, ReporteFinalDTO, GastosBloqueDTO, GastosSerieItemDTO } from "@/types/reporte-general";
// Puntos para chart: reusan tus DTOs + label derivado
export type ChartVentasPoint = VentasSerieItemDTO & { label: string };
export type ChartComprasPoint = ComprasSerieItemDTO & { label: string };
export type ChartUtilidadPoint = UtilidadSerieItemDTO & { label: string };
export type ChartGastosPoint = GastosSerieItemDTO & { label: string };
export type GastosIntervalBundle = { meta: SegmentosMetaDTO; data: ChartGastosPoint[] };
export type VentasIntervalBundle = { meta: SegmentosMetaDTO; data: ChartVentasPoint[] };
export type ComprasIntervalBundle = { meta: SegmentosMetaDTO; data: ChartComprasPoint[] };
export type UtilidadIntervalBundle = { meta: SegmentosMetaDTO; data: ChartUtilidadPoint[] };

// ---- helpers ----
const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function makeLabel(fecha: string, gran: Granularity): string {
    if (gran === "year") return fecha.slice(0, 4);                 // "2025"
    if (gran === "month") {                                         // "YYYY-MM" -> "Jul 2025"
        const [y, m] = fecha.split("-");
        const mm = Math.max(1, Math.min(12, Number(m || 1)));
        return `${MES_CORTO[mm - 1]} ${y}`;
    }
    // day -> "DD/MM"
    const [, m, d] = fecha.split("-");
    return `${(d ?? "01").padStart(2, "0")}/${(m ?? "01").padStart(2, "0")}`;
}

// ---- builders ----
export function buildVentasIntervalos(r: ReporteFinalDTO): VentasIntervalBundle {
    const { meta, series } = r.ventas.series;
    const gran = meta.granularity;
    const data: ChartVentasPoint[] = series.map(s => ({ ...s, label: makeLabel(s.fecha, gran) }));
    return { meta, data };
}
export function buildGastosIntervalos(r: ReporteFinalDTO): GastosIntervalBundle {
    const { meta, series } = r.gastos.series;
    const gran = meta.granularity;
    const data: ChartGastosPoint[] = series.map(s => ({ ...s, label: makeLabel(s.fecha, gran) }));
    return { meta, data };
}
export function buildComprasIntervalos(r: ReporteFinalDTO): ComprasIntervalBundle {
    const { meta, series } = r.compras.series;
    const gran = meta.granularity;
    const data: ChartComprasPoint[] = series.map(s => ({ ...s, label: makeLabel(s.fecha, gran) }));
    return { meta, data };
}

export function buildUtilidadIntervalos(r: ReporteFinalDTO): UtilidadIntervalBundle {
    const { meta, series } = r.utilidad.series;
    const gran = meta.granularity;
    const data: ChartUtilidadPoint[] = series.map(s => ({ ...s, label: makeLabel(s.fecha, gran) }));
    return { meta, data };
}

// Opcional: paquete único
export function buildIntervalos(report: ReporteFinalDTO) {
    return {
        ventas: buildVentasIntervalos(report),
        compras: buildComprasIntervalos(report),
        utilidad: buildUtilidadIntervalos(report),
        gastos: buildGastosIntervalos(report),
    };
}
