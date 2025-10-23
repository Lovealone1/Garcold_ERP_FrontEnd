import type { FinalReportDTO, TopProductItemDTO } from "@/types/reporte-general";

export type TopProductoPoint = TopProductItemDTO & { rank: number };

export type TopProductosBundle = {
    data: TopProductoPoint[];   
    totalItems: number;         
    totalCantidad: number;      
};

export function buildTopProductos(report: FinalReportDTO, limit = 10): TopProductosBundle {
    const raw: TopProductItemDTO[] = report?.top_products ?? [];

    const ordered = [...raw]
        .sort((a, b) => (b?.total_quantity ?? 0) - (a?.total_quantity ?? 0))
        .slice(0, Math.max(0, limit));

    const data: TopProductoPoint[] = ordered.map((p, i) => ({
        ...p,
        total_quantity: Number(p.total_quantity ?? 0),
        rank: i + 1,
    }));

    const totalCantidad = data.reduce((acc, x) => acc + (x.total_quantity ?? 0), 0);

    return {
        data,
        totalItems: raw.length,
        totalCantidad,
    };
}
