
export interface Cliente {
  id: number;
  nombre: string;
  cc_nit: string;
  correo?: string | null;
  celular?: string | null;
  direccion: string;
  ciudad: string;
  saldo: number;
  fecha_creacion: string; 
}

export interface ClientesPage {
  items: Cliente[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type ClienteCreate = Omit<Cliente, "id" | "fecha_creacion">;            
export type ClienteUpdate = Omit<Cliente, "id" | "fecha_creacion" | "saldo">; 

export type NuevoCliente = ClienteCreate;