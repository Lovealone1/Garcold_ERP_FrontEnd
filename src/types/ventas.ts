export interface Venta {
  id: number;
  cliente: string;
  banco: string;
  estado: string;
  total: number;
  saldo_restante: number;
  fecha: string; 
}

export interface VentasPage {
  items: Venta[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DetalleCarrito {
  producto_id: number;
  cantidad: number;
  precio_producto: number;
}

export interface VentaCreate {
  cliente_id: number;
  banco_id: number;
  estado_id: number;
  carrito: DetalleCarrito[];
}

export interface DetalleVentaView {
  venta_id: number;
  producto_referencia: string;
  cantidad: number;
  precio: number;
  total: number;
}

export interface PagoVenta {
  id: number;
  venta_id: number;
  banco: string;
  saldo_restante: number;
  monto_abonado: number;
  fecha_creacion: string; 
}

export interface PagoVentaCreate {
  banco_id: number;
  monto: number;
}