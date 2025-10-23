import type {
    FinalReportDTO,
    BanksSummaryDTO,
} from "@/types/reporte-general";

export type KpiKey = "ventas" | "compras" | "gastos" | "bancos" | "utilidad" | "finanzas";

export interface KpiCardData {
    key: KpiKey;
    title: string;
    value: number;                       
    secondaryLabel?: string;             
    secondaryValue?: number;             
    detail?: string;                     
    banksList?: BanksSummaryDTO["banks"]; 
    raw?: unknown;                       
}


export function mapVentasKpi(r: FinalReportDTO): KpiCardData {
    return {
        key: "ventas",
        title: "Ventas",
        value: r.sales.total_sales,
        secondaryLabel: "Créditos",
        secondaryValue: r.sales.total_credit,
        raw: r.sales,
    };
}

export function mapComprasKpi(r: FinalReportDTO): KpiCardData {
    return {
        key: "compras",
        title: "Compras",
        value: r.purchases.total_purchases,
        secondaryLabel: "Por pagar",
        secondaryValue: r.purchases.total_payables,
        raw: r.purchases,
    };
}

export function mapGastosKpi(r: FinalReportDTO): KpiCardData {
    return {
        key: "gastos",
        title: "Gastos",
        value: r.expenses.total_expenses,
        raw: r.expenses,
    };
}

export function mapBancosKpi(r: FinalReportDTO): KpiCardData {
    return {
        key: "bancos",
        title: "Bancos",
        value: r.banks.total,
        banksList: r.banks.banks, 
        raw: r.banks,
    };
}

export function mapUtilidadKpi(r: FinalReportDTO): KpiCardData {
    return {
        key: "utilidad",
        title: "Utilidad",
        value: r.profit.total_profit,
        raw: r.profit,
    };
}

export function mapFinanzasKpi(r: FinalReportDTO): KpiCardData {
    return {
        key: "finanzas",
        title: "Finanzas",
        value: r.credits.total,             
        secondaryLabel: "Inversiones",
        secondaryValue: r.investments.total,    
        raw: { creditos: r.credits, inversiones: r.investments },
    };
}


export function buildKpis(
    report: FinalReportDTO,
    order: KpiKey[] = ["ventas", "compras", "gastos", "bancos", "utilidad", "finanzas"]
): KpiCardData[] {
    const map: Record<KpiKey, (r: FinalReportDTO) => KpiCardData> = {
        ventas: mapVentasKpi,
        compras: mapComprasKpi,
        gastos: mapGastosKpi,
        bancos: mapBancosKpi,
        utilidad: mapUtilidadKpi,
        finanzas: mapFinanzasKpi,
    };
    return order.map((k) => map[k](report));
}
