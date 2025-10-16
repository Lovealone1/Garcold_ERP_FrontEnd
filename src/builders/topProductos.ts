import type { ReporteFinalDTO, TopProductoItemDTO } from "@/types/reporte-general";

export type TopProductoPoint = TopProductoItemDTO & { rank: number };

export type TopProductosBundle = {
    data: TopProductoPoint[];   // top N ordenado desc
    totalItems: number;         // total en payload
    totalCantidad: number;      // suma de cantidades del top
};

export function buildTopProductos(report: ReporteFinalDTO, limit = 10): TopProductosBundle {
    const raw: TopProductoItemDTO[] = report.top_productos ?? [];

    const ordered = [...raw]
        .sort((a, b) => (b?.cantidad_total ?? 0) - (a?.cantidad_total ?? 0))
        .slice(0, Math.max(0, limit));

    const data: TopProductoPoint[] = ordered.map((p, i) => ({
        producto_id: p.producto_id,
        producto: p.producto ?? "",
        cantidad_total: Number(p.cantidad_total ?? 0),
        rank: i + 1,
    }));

    const totalCantidad = data.reduce((acc, x) => acc + x.cantidad_total, 0);

    return {
        data,
        totalItems: raw.length,
        totalCantidad,
    };
}