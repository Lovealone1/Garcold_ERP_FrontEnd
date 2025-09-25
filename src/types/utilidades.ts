
export interface Utilidad {
  id: number;
  venta_id: number;
  utilidad: number;
  fecha: string; 
}

export interface UtilidadesPage {
  items: Utilidad[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DetalleUtilidad {
  venta_id: number;
  producto_id: number;
  referencia?: string | null;
  descripcion?: string | null;
  cantidad: number;
  precio_compra: number;
  precio_venta: number;
  total_utilidad: number;
}