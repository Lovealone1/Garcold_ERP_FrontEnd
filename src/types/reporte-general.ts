// reporte-general.d.ts

export type Bucket = "week" | "month" | "year" | "all";
export type Granularity = "day" | "month" | "year";

export interface SolicitudMetaDTO {
    bucket: Bucket;
    pivot?: string;      // YYYY-MM-DD
    date_from?: string;  // YYYY-MM-DD
    date_to?: string;    // YYYY-MM-DD
    year?: number;
    month?: number;
}

export interface SegmentosMetaDTO {
    bucket: Bucket;
    granularity: Granularity;
    from_: string; // YYYY-MM-DD | YYYY-MM
    to: string;    // YYYY-MM-DD | YYYY-MM
    segments: number;
}

/* VENTAS */
export interface VentasSerieItemDTO {
    fecha: string; // YYYY-MM-DD | YYYY-MM | YYYY
    total: number;
    saldo_restante: number;
}
export interface VentasSeriesDTO {
    meta: SegmentosMetaDTO;
    series: VentasSerieItemDTO[];
}
export interface CXCItemDTO {
    cliente: string;
    total: number;
    saldo_restante: number;
    fecha: string; // YYYY-MM-DD
}
export interface VentasBloqueDTO {
    total_ventas: number;
    total_creditos: number;
    series: VentasSeriesDTO;
    cuentas_por_cobrar: CXCItemDTO[];
}

/* COMPRAS */
export interface ComprasSerieItemDTO {
    fecha: string; // YYYY-MM-DD | YYYY-MM | YYYY
    total: number;
    saldo: number;
}
export interface ComprasSeriesDTO {
    meta: SegmentosMetaDTO;
    series: ComprasSerieItemDTO[];
}
export interface CXPItemDTO {
    proveedor: string;
    total: number;
    saldo: number;
    fecha: string; // YYYY-MM-DD
}
export interface ComprasBloqueDTO {
    total_compras: number;
    total_por_pagar: number;
    series: ComprasSeriesDTO;
    cuentas_por_pagar: CXPItemDTO[];
}

/* GASTOS */
export interface GastosSerieItemDTO {
    fecha: string; // YYYY-MM-DD | YYYY-MM | YYYY
    monto: number;
}
export interface GastosSeriesDTO {
    meta: SegmentosMetaDTO;
    series: GastosSerieItemDTO[];
}
export interface GastosBloqueDTO {
    total_gastos: number;
    series: GastosSeriesDTO;
}

/* UTILIDAD */
export interface UtilidadSerieItemDTO {
    fecha: string; // YYYY-MM-DD | YYYY-MM | YYYY
    utilidad: number;
}
export interface UtilidadSeriesDTO {
    meta: SegmentosMetaDTO;
    series: UtilidadSerieItemDTO[];
}
export interface UtilidadBloqueDTO {
    total_utilidad: number;
    series: UtilidadSeriesDTO;
}

/* BANCOS */
export interface BancoItemDTO {
    nombre: string;
    saldo: number;
}
export interface BancosResumenDTO {
    bancos: BancoItemDTO[];
    total: number;
}

/* TOP PRODUCTOS */
export interface TopProductoItemDTO {
    producto_id: number;
    producto: string;
    cantidad_total: number;
}

/* CRÉDITOS */
export interface CreditoItemDTO {
    nombre: string;
    monto: number;
    fecha_creacion: string; // YYYY-MM-DD
}
export interface CreditosResumenDTO {
    creditos: CreditoItemDTO[];
    total: number;
}

/* INVERSIONES */
export interface InversionItemDTO {
    nombre: string;
    saldo: number;
    fecha_vencimiento: string | null; // YYYY-MM-DD | null
}
export interface InversionesResumenDTO {
    inversiones: InversionItemDTO[];
    total: number;
}

/* RESPUESTA FINAL */
export interface ReporteFinalDTO {
    meta: SolicitudMetaDTO;
    ventas: VentasBloqueDTO;
    compras: ComprasBloqueDTO;
    gastos: GastosBloqueDTO;
    utilidad: UtilidadBloqueDTO;
    bancos: BancosResumenDTO;
    creditos: CreditosResumenDTO;
    inversiones: InversionesResumenDTO;
    top_productos?: TopProductoItemDTO[] | null;
}
