// types/compras.ts

export interface Compra {
    id: number;
    proveedor: string;
    banco: string;
    estado: string;
    total: number;
    saldo: number;
    fecha: string;
}

export interface ComprasPage {
    items: Compra[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface DetalleCompraCarrito {
    producto_id: number;
    cantidad: number;
    precio: number;
}

export interface CompraCreate {
    proveedor_id: number;
    banco_id: number;
    estado_id: number;
    carrito: DetalleCompraCarrito[];
}

export interface DetalleCompraView {
    compra_id: number;
    producto_referencia: string;
    cantidad: number;
    precio: number;
    total: number;
}

export interface PagoCompra {
    id: number;
    compra_id: number;
    banco: string;
    saldo: number;
    monto_abonado: number;
    fecha_creacion: string;
}

export interface PagoCompraCreate {
    banco_id: number;
    monto: number;
}
