export interface Proveedor {
  id: number;
  nombre: string;
  cc_nit: string;
  correo?: string | null;
  celular?: string | null;
  direccion: string;
  ciudad: string;
  fecha_creacion: string;
}

export interface ProveedoresPage {
  items: Proveedor[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type ProveedorCreate = Omit<Proveedor, "id" | "fecha_creacion">;
export type ProveedorUpdate = Omit<Proveedor, "id" | "fecha_creacion">;

export type NuevoProveedor = ProveedorCreate;
