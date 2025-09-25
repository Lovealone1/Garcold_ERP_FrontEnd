// utils/transacciones.ts
export type Origen = "auto" | "manual";

const STRONG_PATTERNS: RegExp[] = [
    /\b(pago|abono)\s+(venta|compra)\s+\d+\b/i,     // Pago venta 24, Abono compra 47
    /\b(gasto)\s+\S+(?:\s+\S+)*\s+\d+\b/i,          // Gasto Transporte 7
    /^\d+\s+abono\s+(venta|compra)\s+\d+\b/i,       // 17 Abono compra 47
];

export function isAutoDescripcion(desc?: string | null): boolean {
    if (!desc) return false;            // sin texto → tratamos como manual
    if (STRONG_PATTERNS.some(r => r.test(desc))) return true;
    return /\d/.test(desc);             // fallback “tiene números” → automática
}

export function origenFromDescripcion(desc?: string | null): Origen {
    return isAutoDescripcion(desc) ? "auto" : "manual";
}
