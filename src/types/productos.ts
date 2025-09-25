// types/productos.ts

export interface Producto {
  id: number;
  referencia: string;
  descripcion: string;
  cantidad: number;        // stock
  precio_compra: number;
  precio_venta: number;
  activo: boolean;
  fecha_creacion: string;  // ISO
}

export interface ProductosPage {
  items: Producto[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type ProductoCreate = Omit<Producto, "id" | "fecha_creacion">;
export type ProductoUpdate = Omit<Producto, "id" | "fecha_creacion">;

export type NuevoProducto = ProductoCreate;
