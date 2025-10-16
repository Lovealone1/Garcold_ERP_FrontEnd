// src/builders/reportBuilder.ts
import type {
    ReporteFinalDTO,
    BancosResumenDTO,
} from "@/types/reporte-general";

/** Forma base que consumirá tu <KPI /> */
export type KpiKey = "ventas" | "compras" | "gastos" | "bancos" | "utilidad" | "finanzas";

export interface KpiCardData {
    key: KpiKey;
    title: string;
    value: number;                        // valor principal
    secondaryLabel?: string;              // etiqueta del valor secundario
    secondaryValue?: number;              // valor secundario (opcional)
    detail?: string;                      // label bajo el valor (ej. "+20 ventas")
    banksList?: BancosResumenDTO["bancos"]; // sólo para bancos (lo usarás después)
    raw?: unknown;                        // bloque original por si necesitas más cosas
}

/* ---------- Mappers individuales ---------- */

export function mapVentasKpi(r: ReporteFinalDTO): KpiCardData {
    return {
        key: "ventas",
        title: "Ventas",
        value: r.ventas.total_ventas,
        secondaryLabel: "Créditos",
        secondaryValue: r.ventas.total_creditos,
        raw: r.ventas,
    };
}

export function mapComprasKpi(r: ReporteFinalDTO): KpiCardData {
    return {
        key: "compras",
        title: "Compras",
        value: r.compras.total_compras,
        secondaryLabel: "Por pagar",
        secondaryValue: r.compras.total_por_pagar,
        raw: r.compras,
    };
}

export function mapGastosKpi(r: ReporteFinalDTO): KpiCardData {
    return {
        key: "gastos",
        title: "Gastos",
        value: r.gastos.total_gastos,
        raw: r.gastos,
    };
}

export function mapBancosKpi(r: ReporteFinalDTO): KpiCardData {
    return {
        key: "bancos",
        title: "Bancos",
        value: r.bancos.total,
        banksList: r.bancos.bancos, // te queda disponible para vistas futuras
        raw: r.bancos,
    };
}

export function mapUtilidadKpi(r: ReporteFinalDTO): KpiCardData {
    return {
        key: "utilidad",
        title: "Utilidad",
        value: r.utilidad.total_utilidad,
        raw: r.utilidad,
    };
}

/** KPI 5: totales de créditos e inversiones en una sola tarjeta */
export function mapFinanzasKpi(r: ReporteFinalDTO): KpiCardData {
    return {
        key: "finanzas",
        title: "Finanzas",
        value: r.creditos.total,                 // total de créditos
        secondaryLabel: "Inversiones",
        secondaryValue: r.inversiones.total,     // total de inversiones
        raw: { creditos: r.creditos, inversiones: r.inversiones },
    };
}

/* ---------- Builder para la página ---------- */

export function buildKpis(
    report: ReporteFinalDTO,
    order: KpiKey[] = ["ventas", "compras", "gastos", "bancos", "utilidad", "finanzas"]
): KpiCardData[] {
    const map: Record<KpiKey, (r: ReporteFinalDTO) => KpiCardData> = {
        ventas: mapVentasKpi,
        compras: mapComprasKpi,
        gastos: mapGastosKpi,
        bancos: mapBancosKpi,
        utilidad: mapUtilidadKpi,
        finanzas: mapFinanzasKpi,
    };
    return order.map((k) => map[k](report));
}
