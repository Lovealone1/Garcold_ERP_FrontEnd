import type { UtilidadSeriesDTO } from "@/types/reporte-general";

export const monthKey = (d: Date = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const monthCapEs = (d: Date = new Date(), locale = "es-CO") => {
    const name = new Intl.DateTimeFormat(locale, { month: "long" }).format(d);
    return name.charAt(0).toUpperCase() + name.slice(1);
};

export function utilidadMesActual(series: UtilidadSeriesDTO, d: Date = new Date()): number {
    if (!series || series.meta.granularity !== "month") return 0;
    return series.series.find((s) => s.fecha === monthKey(d))?.utilidad ?? 0;
}
