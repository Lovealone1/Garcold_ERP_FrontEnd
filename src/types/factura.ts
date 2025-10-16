import type { Cliente } from "@/types/customer";

export enum Regimen {
    COMUN = "COMUN",
    NO_RESPONSABLE = "NO_RESPONSABLE",
    SIMPLE = "SIMPLE",
}

export interface CompaniaDTO {
    id: number;
    razon_social: string;
    nombre_completo: string;
    cc_nit: string;
    email_facturacion: string;
    celular?: string | null;
    direccion: string;
    municipio: string;
    departamento: string;
    codigo_postal?: string | null;
    regimen: Regimen;
}

export interface DetalleVentaViewDesc {
    venta_id: number;
    producto_referencia: string;
    producto_descripcion: string;
    cantidad: number;
    precio: number;
    total: number;
}

export interface VentaFacturaBancoDTO {
    numero_cuenta: string;
}

export interface VentaFacturaDTO {
    venta_id: number;
    fecha: string;
    estado: string;
    total: number;
    saldo_restante: number;
    numero_cuenta?: string | null;
    cliente: Cliente;
    compania: CompaniaDTO;
    detalles: DetalleVentaViewDesc[];
}
